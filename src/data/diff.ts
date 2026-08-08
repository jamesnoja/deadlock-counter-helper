/**
 * Snapshot comparison — what a patch actually changed.
 *
 * Pure. The sync calls this after normalising and writes the result to
 * `data/snapshot/changes.json`, which is what the provenance UI (E07) reads and
 * what makes the daily pull request worth opening.
 *
 * The point is not to list every byte that moved. It is to answer one question:
 * **which of our curated decisions might this patch have invalidated?**
 */

import type { Ability, Hero, Item, Snapshot } from './schema.ts'
import type { AbilityThreats, ItemCounters } from './tags.ts'

export interface Renamed {
  class_name: string
  from: string
  to: string
}

export interface Retuned {
  class_name: string
  /** Ability display name at the time of the change, for a readable PR body. */
  name: string
  stat: string
  from: number
  to: number
}

export interface SnapshotDiff {
  heroes: { added: string[]; removed: string[]; renamed: Renamed[] }
  items: { added: string[]; removed: string[]; renamed: Renamed[] }
  abilities: { added: string[]; removed: string[]; renamed: Renamed[]; retuned: Retuned[] }
  /**
   * Everything a human should re-check, by `class_name`. Drives the amber
   * provenance state in E07.
   */
  needsReview: string[]
  /** New entities with no overlay entry — uncovered until someone tags them. */
  untaggedAdditions: string[]
}

export const EMPTY_DIFF: SnapshotDiff = {
  heroes: { added: [], removed: [], renamed: [] },
  items: { added: [], removed: [], renamed: [] },
  abilities: { added: [], removed: [], renamed: [], retuned: [] },
  needsReview: [],
  untaggedAdditions: [],
}

type Named = { class_name: string; name: string }

function comparePresence<T extends Named>(before: readonly T[], after: readonly T[]) {
  const beforeByName = new Map(before.map((entity) => [entity.class_name, entity]))
  const afterByName = new Map(after.map((entity) => [entity.class_name, entity]))

  const added = after.filter((e) => !beforeByName.has(e.class_name)).map((e) => e.class_name).sort()
  const removed = before.filter((e) => !afterByName.has(e.class_name)).map((e) => e.class_name).sort()

  // Renames are keyed on class_name, which is exactly why they are safe: the
  // display name moving is a presentation change and nothing else.
  const renamed: Renamed[] = []
  for (const entity of after) {
    const previous = beforeByName.get(entity.class_name)
    if (previous && previous.name !== entity.name) {
      renamed.push({ class_name: entity.class_name, from: previous.name, to: entity.name })
    }
  }
  renamed.sort((a, b) => a.class_name.localeCompare(b.class_name))

  return { added, removed, renamed }
}

/**
 * A stat change only counts if the ability carries overlay tags.
 *
 * An untagged ability being retuned tells us nothing — we made no claim about
 * it. A tagged one being retuned might mean the claim no longer holds, and
 * that is the whole signal we are looking for.
 */
function compareAbilityStats(
  before: readonly Ability[],
  after: readonly Ability[],
  abilityThreats: Readonly<Record<string, AbilityThreats>>,
): Retuned[] {
  const beforeByName = new Map(before.map((ability) => [ability.class_name, ability]))
  const retuned: Retuned[] = []

  for (const ability of after) {
    const entry = abilityThreats[ability.class_name]
    if (!entry || entry.untagged || entry.tags.length === 0) continue

    const previous = beforeByName.get(ability.class_name)
    if (!previous) continue

    for (const stat of Object.keys(ability.stats).sort()) {
      const now = ability.stats[stat]?.value
      const then = previous.stats[stat]?.value
      if (then === undefined || now === undefined || then === now) continue
      retuned.push({ class_name: ability.class_name, name: ability.name, stat, from: then, to: now })
    }
  }

  return retuned.sort(
    (a, b) => a.class_name.localeCompare(b.class_name) || a.stat.localeCompare(b.stat),
  )
}

export function diffSnapshots(
  before: Snapshot,
  after: Snapshot,
  overlay: {
    abilityThreats: Readonly<Record<string, AbilityThreats>>
    itemCounters: Readonly<Record<string, ItemCounters>>
  },
): SnapshotDiff {
  const heroes = comparePresence<Hero>(before.heroes, after.heroes)
  const items = comparePresence<Item>(before.items, after.items)
  const abilityPresence = comparePresence<Ability>(before.abilities, after.abilities)
  const retuned = compareAbilityStats(before.abilities, after.abilities, overlay.abilityThreats)

  /**
   * A removal cannot need review — it is gone. A rename cannot invalidate
   * curation either, because nothing is keyed on the display name; it is
   * recorded for the changelog, not for the review queue.
   */
  const needsReview = [
    ...new Set([
      ...heroes.added,
      ...items.added,
      ...abilityPresence.added,
      ...retuned.map((entry) => entry.class_name),
    ]),
  ].sort()

  const untaggedAdditions = [
    ...items.added.filter((className) => !overlay.itemCounters[className]),
    ...abilityPresence.added.filter((className) => !overlay.abilityThreats[className]),
  ].sort()

  return {
    heroes,
    items,
    abilities: { ...abilityPresence, retuned },
    needsReview,
    untaggedAdditions,
  }
}

export const isEmptyDiff = (diff: SnapshotDiff): boolean =>
  diff.needsReview.length === 0 &&
  diff.untaggedAdditions.length === 0 &&
  [diff.heroes, diff.items, diff.abilities].every(
    (group) => group.added.length === 0 && group.removed.length === 0 && group.renamed.length === 0,
  ) &&
  diff.abilities.retuned.length === 0

/** A readable summary for the pull request body. Empty string when nothing changed. */
export function describeDiff(diff: SnapshotDiff): string {
  if (isEmptyDiff(diff)) return ''
  const lines: string[] = []
  const section = (title: string, entries: string[]) => {
    if (entries.length) lines.push(`### ${title}`, ...entries.map((e) => `- ${e}`), '')
  }

  section('New heroes', diff.heroes.added)
  section('Removed heroes', diff.heroes.removed)
  section(
    'Renamed heroes',
    diff.heroes.renamed.map((r) => `\`${r.class_name}\`: "${r.from}" → "${r.to}"`),
  )
  section('New items', diff.items.added)
  section('Removed items', diff.items.removed)
  section(
    'Renamed items',
    diff.items.renamed.map((r) => `\`${r.class_name}\`: "${r.from}" → "${r.to}"`),
  )
  section('New abilities', diff.abilities.added)
  section('Removed abilities', diff.abilities.removed)
  section(
    'Retuned tagged abilities',
    diff.abilities.retuned.map((r) => `${r.name} — ${r.stat}: ${r.from} → ${r.to}`),
  )

  if (diff.untaggedAdditions.length) {
    lines.push(
      '### ⚠️ New and untagged',
      'These are not covered by the overlay, so the engine cannot use them:',
      ...diff.untaggedAdditions.map((e) => `- \`${e}\``),
      '',
    )
  }

  lines.push(`**${diff.needsReview.length} entities flagged for review.**`)
  return lines.join('\n')
}
