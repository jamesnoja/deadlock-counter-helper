import type { Metadata } from 'next'
import {
  abilityCurationQueue,
  itemCurationQueue,
  overlayCoverage,
  nonRankedItems,
  type CurationEntry,
} from '@/data/overlay.ts'
import { RANKED_MAX_COST } from '@/data/schema.ts'
import { CurationList } from './curation-list.tsx'

export const metadata: Metadata = {
  title: 'Curation worklist',
  robots: { index: false, follow: false },
}

/** Work first, done last. `blocked` leads because it is the only bucket that needs a player. */
const ORDER = { blocked: 0, untagged: 1, suggested: 2, curated: 3 } as const
const byPriority = (a: CurationEntry, b: CurationEntry) => ORDER[a.bucket] - ORDER[b.bucket]

/**
 * This is a worklist, not a browser. Rendering all 325 entries meant ~3,900 tag
 * buttons and a page that took long enough to paint that it looked hung. Show
 * the entries that actually need a decision, capped, and say plainly what is
 * not shown — a silent truncation would read as "that's everything".
 */
const PAGE_SIZE = 40
const needsWork = (entry: CurationEntry) => entry.bucket === 'blocked' || entry.bucket === 'untagged'

function Stat({ label, value, of }: { label: string; value: number; of: number }) {
  return (
    <div className="rounded-card bg-surface p-lg">
      <p className="text-micro text-text-muted">{label}</p>
      <p className="text-tabular">
        <span className="text-heading">{value}</span> of {of}
      </p>
    </div>
  )
}

export default function UntaggedAdmin() {
  const coverage = overlayCoverage()
  const allAbilities = abilityCurationQueue().sort(byPriority)
  const allItems = itemCurationQueue().sort(byPriority)
  const blocked = [...allAbilities, ...allItems].filter((entry) => entry.bucket === 'blocked').length
  const excluded = nonRankedItems()

  const abilityQueue = allAbilities.filter(needsWork)
  const itemQueue = allItems.filter(needsWork)
  const abilities = abilityQueue.slice(0, PAGE_SIZE)
  const items = itemQueue.slice(0, PAGE_SIZE)

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-xl p-xl">
      <header className="flex flex-col gap-sm">
        <h1 className="text-display">Curation worklist</h1>
        <p className="text-caption text-text-muted">
          Layer B. Everything here is <code>review: &quot;suggested&quot;</code> until a human
          confirms it — derived from the game’s own text, not from playing the matchup.
        </p>
      </header>

      <section className="grid gap-sm sm:grid-cols-3">
        <Stat label="Abilities tagged" value={coverage.abilities.tagged} of={coverage.abilities.total} />
        <Stat label="Items tagged" value={coverage.items.tagged} of={coverage.items.total} />
        <Stat label="Blocked, no upstream text" value={blocked} of={abilities.length + items.length} />
      </section>

      <section className="rounded-card bg-surface p-card">
        <h2 className="text-heading">Reading the numbers</h2>
        <p className="text-caption text-text-muted">
          Item coverage will never approach 100%, and should not. Most shop items are stat or
          damage items that answer no specific threat — <code>untagged</code> is their correct
          final state, not a gap. What matters is that every threat tag has two or three items
          that genuinely answer it.
        </p>
        {coverage.heroesWithNoThreats.length > 0 ? (
          <p className="text-caption text-threat-high">
            {coverage.heroesWithNoThreats.length} hero(es) have no tagged ability and would return
            nothing: {coverage.heroesWithNoThreats.join(', ')}
          </p>
        ) : (
          <p className="text-caption text-provenance-verified">
            Every hero has at least one tagged ability.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-md">
        <h2 className="text-display">Abilities needing a decision</h2>
        <p className="text-caption text-text-muted">
          Showing {abilities.length} of {abilityQueue.length} that need work.{' '}
          {allAbilities.length - abilityQueue.length} already carry tags and are not listed.
        </p>
        <CurationList entries={abilities} kind="ability" />
      </section>

      <section className="rounded-card bg-surface p-card">
        <h2 className="text-heading">Excluded from recommendations</h2>
        <p className="text-caption text-text-muted">
          {excluded.length} items cost more than {RANKED_MAX_COST.toLocaleString()} souls, which
          means they are restricted to non-ranked modes or are not live yet. They stay in the
          snapshot so they can be reviewed later, but the engine will not suggest them — pointing
          someone at an item they cannot buy is worse than saying nothing.
        </p>
        <ul className="mt-sm flex flex-wrap gap-xs">
          {excluded.map((entry) => (
            <li
              key={entry.class_name}
              className="rounded-pill bg-surface-elevated px-md py-xs text-caption text-text-muted"
            >
              {entry.name}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-md">
        <h2 className="text-display">Items needing a decision</h2>
        <p className="text-caption text-text-muted">
          Showing {items.length} of {itemQueue.length} that need work.{' '}
          {allItems.length - itemQueue.length} already carry tags and are not listed. Many of the
          remainder are stat items that correctly answer nothing.
        </p>
        <CurationList entries={items} kind="item" />
      </section>
    </main>
  )
}
