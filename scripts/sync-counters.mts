#!/usr/bin/env node
/**
 * Refreshes data/counters/ from deadlockitembuilder.com's counter-item helper.
 *
 *   npm run sync:counters
 *
 * The source is a static page with its dataset in an inline `<script>` — no
 * API. We evaluate that one declaration in a sandbox with no globals, resolve
 * every display name to a `class_name` against our own snapshot, and commit the
 * result. The site never fetches at build or request time, same as `sync.mts`.
 *
 * **This script fails rather than degrades.** A name it cannot resolve is a
 * rename upstream, and dropping it silently would remove real advice — `Curse`
 * alone is the top counter for fourteen heroes. Anything unresolved stops the
 * run and prints what to add to ALIASES.
 *
 * Runs directly under Node's native TypeScript stripping (Node 24+).
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createContext, runInContext } from 'node:vm'

import { HEROES, ITEMS } from '../src/data/snapshot.ts'
import type { PublishedCounters, PublishedMeta } from '../src/data/published-schema.ts'

const SOURCE_URL = 'https://deadlockitembuilder.com/counter-item-helper'
const SOURCE_NAME = 'Deadlock Item Builder — Counter Item Helper'
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'counters')

/**
 * Display names the source uses that our snapshot no longer has.
 *
 * Each is a rename upstream, and each carries its evidence because the mapping
 * is a judgement rather than a lookup. They are written into the committed
 * meta so a reader can check the reasoning without reading this file.
 */
const ALIASES: PublishedMeta['aliases'] = [
  {
    from: 'Holiday',
    to: 'Holliday',
    kind: 'hero',
    evidence: 'Spelling. The snapshot uses the double-l form upstream ships.',
  },
  {
    from: 'Curse',
    to: 'Cursed Relic',
    kind: 'item',
    evidence:
      'Renamed. Source describes "Interrupts, silences, and disarms. Removes buffs."; the snapshot entry upgrade_glitch reads "interrupting, Silencing, Disarming ... Removes all non-ultimate buffs".',
  },
  {
    from: 'Superior Stamina',
    to: 'Stamina Mastery',
    kind: 'item',
    evidence: 'Renamed. The snapshot entry still carries the class_name upgrade_superior_stamina.',
  },
]

/**
 * Names the source uses in item positions that are not items.
 *
 * There is nothing to resolve these to — aliasing one to a real item would be
 * inventing advice the source never gave. They are dropped, and recorded in the
 * committed meta with what they affected, because a silently shorter list looks
 * identical to a correct one.
 */
const NOT_ITEMS: Record<string, string> = {
  'Anti-Heal':
    'The display name of the source\'s own anti_heal group, used where an item belongs. A category, not a purchasable item.',
}

/** Shape of the source's own data, before any resolution. */
interface SourceGroup {
  name: string
  desc: string
  items: string[]
}
interface SourceHero {
  groups: string[]
  topCounters: string[]
  summary: string
  lanePhase: string[]
  situations: { label: string; priorityItem: string; reason: string }[]
}
interface SourceData {
  groupData: Record<string, SourceGroup>
  counterData: {
    heroes: Record<string, SourceHero>
    items: Record<string, { description: string; why: string[] }>
  }
}

/**
 * Pull one `const <name> = {...}` out of a script by matching braces.
 *
 * A regex cannot do this — the objects contain braces in their prose — and
 * parsing the whole bundle would drag in DOM calls we have no business running.
 */
function extractDeclaration(script: string, name: string): string {
  const start = script.indexOf(`const ${name}`)
  if (start === -1) throw new Error(`no \`const ${name}\` in the page script`)

  let depth = 0
  for (let i = script.indexOf('{', start); i < script.length; i += 1) {
    if (script[i] === '{') depth += 1
    else if (script[i] === '}') {
      depth -= 1
      if (depth === 0) return `globalThis.${name} = ${script.slice(script.indexOf('{', start), i + 1)};`
    }
  }
  throw new Error(`unbalanced braces reading \`${name}\``)
}

/** Evaluate the two declarations alone, in a context with nothing to reach for. */
function readSourceData(html: string): SourceData {
  const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((match) => match[1] ?? '')
  const script = scripts.find((body) => body.includes('groupData') && body.includes('counterData'))
  if (!script) {
    throw new Error(
      'no inline script carrying groupData and counterData — the page structure changed, so this script needs revisiting rather than patching',
    )
  }

  const sandbox: Record<string, unknown> = Object.create(null)
  createContext(sandbox)
  runInContext(extractDeclaration(script, 'groupData') + extractDeclaration(script, 'counterData'), sandbox)

  const { groupData, counterData } = sandbox as unknown as SourceData
  if (!groupData || !counterData?.heroes || !counterData?.items) {
    throw new Error('groupData/counterData evaluated to an unexpected shape')
  }
  return { groupData, counterData }
}

/**
 * The source writes its reasons as "Solution: <x>. Why: <y>".
 *
 * Those prefixes are its own presentation, and we already label a situation
 * with its own name before showing the reason. Left in, the UI reads
 * "Storm Cloud is healing him: Solution: buy X. Why: ...", which is two
 * labelling systems in one sentence. Stripped here rather than in the UI so the
 * committed data is clean for every consumer.
 */
const stripSourceLabels = (reason: string) =>
  reason
    .replace(/\bSolution:\s*/gi, '')
    .replace(/\s*\bWhy:\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/** Names differ in punctuation and case between the two sources; nothing else. */
const normalise = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '')

function buildResolver(kind: 'hero' | 'item', entries: { name: string; class_name: string }[]) {
  const byName = new Map(entries.map((entry) => [normalise(entry.name), entry.class_name]))
  const aliases = new Map(
    ALIASES.filter((alias) => alias.kind === kind).map((alias) => [
      normalise(alias.from),
      normalise(alias.to),
    ]),
  )
  const unresolved = new Set<string>()
  /** Where each non-item reference was found, so the record says what it cost. */
  const dropped = new Map<string, Set<string>>()

  const resolve = (name: string, context = ''): string | null => {
    if (kind === 'item' && name in NOT_ITEMS) {
      if (!dropped.has(name)) dropped.set(name, new Set())
      if (context) dropped.get(name)?.add(context)
      return null
    }
    const key = normalise(name)
    const found = byName.get(aliases.get(key) ?? key)
    if (!found) unresolved.add(name)
    return found ?? null
  }
  return { resolve, unresolved, dropped }
}

async function main() {
  const response = await fetch(SOURCE_URL, { headers: { 'user-agent': 'deadlock-counter-helper' } })
  if (!response.ok) throw new Error(`GET ${SOURCE_URL} -> ${response.status} ${response.statusText}`)
  const { groupData, counterData } = readSourceData(await response.text())

  const heroes = buildResolver('hero', HEROES)
  const items = buildResolver('item', ITEMS)

  const resolvedGroups = Object.entries(groupData).map(([key, group]) => ({
    key,
    name: group.name,
    desc: group.desc,
    items: group.items
      .map((item) => items.resolve(item, `group:${key}`))
      .filter((className): className is string => className !== null),
  }))

  const resolvedHeroes = Object.entries(counterData.heroes).map(([name, hero]) => ({
    hero: heroes.resolve(name) ?? name,
    groups: hero.groups,
    topCounters: hero.topCounters
      .map((item) => items.resolve(item, name))
      .filter((className): className is string => className !== null),
    summary: hero.summary,
    lanePhase: hero.lanePhase,
    situations: hero.situations
      .map((situation) => ({
        label: situation.label,
        priorityItem: items.resolve(situation.priorityItem, name) ?? '',
        reason: stripSourceLabels(situation.reason),
      }))
      .filter((situation) => situation.priorityItem !== ''),
  }))

  const resolvedItems = Object.entries(counterData.items).map(([name, note]) => ({
    item: items.resolve(name) ?? name,
    description: note.description,
    why: note.why,
  }))

  // Report every failure at once. Fixing them one run at a time would be miserable.
  const failures = [
    ...[...heroes.unresolved].map((name) => `  hero: ${name}`),
    ...[...items.unresolved].map((name) => `  item: ${name}`),
  ]
  if (failures.length > 0) {
    throw new Error(
      `${failures.length} name(s) in the source do not resolve against the snapshot:\n${failures.join('\n')}\n\n` +
        'Each is a rename upstream or an item that no longer exists. Add an entry to ALIASES in this ' +
        'script with the evidence, or confirm the item is gone. Nothing is written until they all resolve — ' +
        'dropping them silently would remove real advice.',
    )
  }

  const unknownGroups = resolvedHeroes
    .flatMap((hero) => hero.groups)
    .filter((key) => !(key in groupData))
  if (unknownGroups.length > 0) {
    throw new Error(`heroes reference groups that do not exist: ${[...new Set(unknownGroups)].join(', ')}`)
  }

  const output: PublishedCounters = {
    meta: {
      source_url: SOURCE_URL,
      source_name: SOURCE_NAME,
      retrieved_at: new Date().toISOString(),
      counts: {
        heroes: resolvedHeroes.length,
        items: resolvedItems.length,
        groups: resolvedGroups.length,
      },
      aliases: ALIASES,
      dropped: [...items.dropped].map(([name, affected]) => ({
        name,
        kind: 'item' as const,
        reason: NOT_ITEMS[name] ?? 'Not an item.',
        affected: [...affected].sort(),
      })),
    },
    groups: resolvedGroups,
    heroes: resolvedHeroes,
    items: resolvedItems,
  }

  mkdirSync(OUT_DIR, { recursive: true })
  writeFileSync(join(OUT_DIR, 'published.json'), JSON.stringify(output, null, 2) + '\n')

  const covered = new Set(resolvedHeroes.map((hero) => hero.hero))
  const uncovered = HEROES.filter((hero) => !covered.has(hero.class_name))
  console.log(
    `Wrote ${resolvedHeroes.length} heroes, ${resolvedItems.length} items, ${resolvedGroups.length} groups.`,
  )
  console.log(`Resolved ${ALIASES.length} name(s) through the alias table.`)
  for (const [name, affected] of items.dropped) {
    console.log(`Dropped ${name} — not an item. Shortened: ${[...affected].sort().join(', ')}`)
  }
  console.log(
    uncovered.length === 0
      ? 'Every hero in the snapshot has published counters.'
      : `${uncovered.length} hero(es) have no published counters and will return nothing: ${uncovered.map((hero) => hero.name).join(', ')}`,
  )
}

await main()
