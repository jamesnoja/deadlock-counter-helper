#!/usr/bin/env node
/**
 * Refreshes data/snapshot/ from the Deadlock assets API.
 *
 *   npm run sync
 *
 * Run by hand, and daily by CI (E06). The site never calls the API at build or
 * request time — it reads the committed snapshot, so builds are reproducible
 * and upstream downtime cannot take the site down.
 *
 * Runs directly under Node's native TypeScript stripping (Node 24+).
 */

import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describeDiff, diffSnapshots, isEmptyDiff } from '../src/data/diff.ts'
import { normalise } from '../src/data/normalise.ts'
import { ABILITY_THREATS } from '../data/overlay/ability-threats.ts'
import { ITEM_COUNTERS } from '../data/overlay/item-counters.ts'
import type { Ability, Hero, Item, Snapshot, SnapshotMeta } from '../src/data/schema.ts'
import {
  ENDPOINTS,
  type UpstreamHero,
  type UpstreamItem,
  type UpstreamPatch,
} from '../src/data/upstream.ts'

const SNAPSHOT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'snapshot')

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { accept: 'application/json' } })
  if (!response.ok) throw new Error(`GET ${url} -> ${response.status} ${response.statusText}`)
  return (await response.json()) as T
}

/** Two-space JSON with a trailing newline, so diffs are line-oriented. */
const serialise = (value: unknown) => JSON.stringify(value, null, 2) + '\n'

function readIfPresent(path: string): string | null {
  try {
    return readFileSync(path, 'utf8')
  } catch {
    return null
  }
}

/** The committed snapshot, or empty collections on a first run. */
function readSnapshot(): Snapshot {
  // Trailing comma required: in .mts, bare <T> parses as JSX.
  const load = <T,>(file: string): T[] => {
    const raw = readIfPresent(join(SNAPSHOT_DIR, file))
    return raw ? (JSON.parse(raw) as T[]) : []
  }
  return {
    heroes: load<Hero>('heroes.json'),
    abilities: load<Ability>('abilities.json'),
    items: load<Item>('items.json'),
  }
}

async function main() {
  console.log('Fetching upstream assets...')
  const [heroes, items, patches, clientVersions] = await Promise.all([
    fetchJson<UpstreamHero[]>(ENDPOINTS.heroes),
    fetchJson<UpstreamItem[]>(ENDPOINTS.items),
    fetchJson<UpstreamPatch[]>(ENDPOINTS.patches).catch(() => [] as UpstreamPatch[]),
    fetchJson<number[]>(ENDPOINTS.clientVersions).catch(() => [] as number[]),
  ])
  console.log(`  heroes: ${heroes.length}  items: ${items.length}`)

  // Feed the previous heroes in so a display-name change appends the old slug
  // to aliases rather than quietly orphaning every link that used it.
  const previousSnapshot = readSnapshot()
  const snapshot = normalise(heroes, items, previousSnapshot.heroes)
  console.log(
    `Normalised to ${snapshot.heroes.length} heroes, ` +
      `${snapshot.abilities.length} abilities, ${snapshot.items.length} items.`,
  )

  const files = {
    'heroes.json': serialise(snapshot.heroes),
    'abilities.json': serialise(snapshot.abilities),
    'items.json': serialise(snapshot.items),
  }

  /**
   * Hash the data files themselves, both before and after.
   *
   * Comparing against the hash recorded in meta.json would be a comparison
   * against our own bookkeeping — if the committed data ever drifted from that
   * record, the sync would report "no change" while sitting on a real
   * difference. Hashing what is actually on disk means "unchanged" always means
   * the bytes are identical.
   */
  const hashOf = (contents: Record<string, string>) => {
    const digest = createHash('sha256')
    for (const name of Object.keys(contents).sort()) digest.update(contents[name] ?? '')
    return digest.digest('hex')
  }

  const hash = hashOf(files)
  const previousFiles = Object.fromEntries(
    Object.keys(files).map((name) => [name, readIfPresent(join(SNAPSHOT_DIR, name)) ?? '']),
  )
  const unchanged = hashOf(previousFiles) === hash

  const metaPath = join(SNAPSHOT_DIR, 'meta.json')
  const previous = readIfPresent(metaPath)

  // Only advance the timestamp when the data actually moved. Otherwise the
  // daily job (E06) would open a pull request every single day whose entire
  // diff is a clock tick, and nobody would read the ones that matter.
  const syncedAt = unchanged
    ? (JSON.parse(previous!) as SnapshotMeta).synced_at
    : new Date().toISOString()

  const latestPatch = patches[0]
  const meta: SnapshotMeta = {
    sources: { ...ENDPOINTS },
    patch: latestPatch?.title
      ? {
          title: latestPatch.title,
          published_at: latestPatch.pub_date ?? '',
          link: latestPatch.link ?? '',
        }
      : null,
    client_version: clientVersions.at(-1) ?? null,
    counts: {
      heroes: snapshot.heroes.length,
      abilities: snapshot.abilities.length,
      items: snapshot.items.length,
    },
    content_hash: hash,
    synced_at: syncedAt,
  }

  /**
   * Only recompute the diff when content moved. On an unchanged sync the
   * previous changes.json still describes the last real patch, and that is
   * exactly what the provenance UI should keep showing — overwriting it with
   * an empty diff would silently mark everything reviewed.
   */
  const changesPath = join(SNAPSHOT_DIR, 'changes.json')
  const diff = unchanged
    ? null
    : diffSnapshots(previousSnapshot, snapshot, {
        abilityThreats: ABILITY_THREATS,
        itemCounters: ITEM_COUNTERS,
      })

  mkdirSync(SNAPSHOT_DIR, { recursive: true })
  for (const [name, contents] of Object.entries(files)) {
    writeFileSync(join(SNAPSHOT_DIR, name), contents, 'utf8')
  }
  writeFileSync(metaPath, serialise(meta), 'utf8')
  if (diff) {
    writeFileSync(changesPath, serialise({ ...diff, detected_at: syncedAt, patch: meta.patch }), 'utf8')
  }

  console.log(unchanged ? 'No content change — timestamp left alone.' : `Updated. hash=${hash.slice(0, 12)}`)

  if (diff && !isEmptyDiff(diff)) {
    console.log('')
    console.log(describeDiff(diff))
  }

  // The workflow reads this to decide whether to open a pull request.
  if (process.env.GITHUB_OUTPUT) {
    const changed = diff && !isEmptyDiff(diff)
    writeFileSync(process.env.GITHUB_OUTPUT, `changed=${changed ? 'true' : 'false'}\n`, { flag: 'a' })
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
