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
  /** New entities the published source says nothing about — uncovered until it does. */
  uncoveredAdditions: string[]
}

export const EMPTY_DIFF: SnapshotDiff = {
  heroes: { added: [], removed: [], renamed: [] },
  items: { added: [], removed: [], renamed: [] },
  abilities: { added: [], removed: [], renamed: [], retuned: [] },
  needsReview: [],
  uncoveredAdditions: [],
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
 * A stat change only counts if we publish advice about that ability's hero.
 *
 * This used to gate on the ability's own tags. There are no tags now, and the
 * claim we make is at hero level: someone wrote "counter Haze like this", and a
 * retune of one of Haze's abilities may have invalidated it. A retune on a hero
 * nobody has written up changes nothing, because we asserted nothing.
 */
function compareAbilityStats(
  before: readonly Ability[],
  after: readonly Ability[],
  coveredHeroes: ReadonlySet<string>,
): Retuned[] {
  const beforeByName = new Map(before.map((ability) => [ability.class_name, ability]))
  const retuned: Retuned[] = []

  for (const ability of after) {
    if (!coveredHeroes.has(ability.hero)) continue

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
  /**
   * What the published source currently says something about. Passed in rather
   * than imported so this stays a pure function over two snapshots.
   */
  coverage: {
    heroes: ReadonlySet<string>
    items: ReadonlySet<string>
  },
): SnapshotDiff {
  const heroes = comparePresence<Hero>(before.heroes, after.heroes)
  const items = comparePresence<Item>(before.items, after.items)
  const abilityPresence = comparePresence<Ability>(before.abilities, after.abilities)
  const retuned = compareAbilityStats(before.abilities, after.abilities, coverage.heroes)

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

  /**
   * Abilities are not listed here any more. The source works at hero level and
   * makes no per-ability claim, so a new ability is not itself a coverage gap —
   * a new *hero* is.
   */
  const uncoveredAdditions = [
    ...heroes.added.filter((className) => !coverage.heroes.has(className)),
    ...items.added.filter((className) => !coverage.items.has(className)),
  ].sort()

  return {
    heroes,
    items,
    abilities: { ...abilityPresence, retuned },
    needsReview,
    uncoveredAdditions,
  }
}

export const isEmptyDiff = (diff: SnapshotDiff): boolean =>
  diff.needsReview.length === 0 &&
  diff.uncoveredAdditions.length === 0 &&
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

  if (diff.uncoveredAdditions.length) {
    lines.push(
      '### ⚠️ New and uncovered',
      'The published source says nothing about these, so the tool cannot advise on them:',
      ...diff.uncoveredAdditions.map((e) => `- \`${e}\``),
      '',
    )
  }

  lines.push(`**${diff.needsReview.length} entities flagged for review.**`)
  return lines.join('\n')
}
