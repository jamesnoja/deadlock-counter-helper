'use client'

/**
 * Holds the enemy lineup and renders what follows from it.
 *
 * State lives here, in memory, deliberately: E20 moves it to the URL so a
 * lineup can be shared, and putting it anywhere else first would be work we
 * throw away.
 */

import { useMemo, useState } from 'react'
import { HeroPicker } from './hero-picker.tsx'
import { EmptyState, ItemCard } from './primitives.tsx'
import { MAX_ENEMIES, TeamBar } from './team-bar.tsx'
import { countersForTeam } from '@/data/counters.ts'
import { provenanceFor } from '@/data/provenance.ts'
import type { Hero } from '@/data/schema.ts'

export function CounterTool({ heroes }: { heroes: readonly Hero[] }) {
  /** Pick order, not snapshot order — the team bar should read as you built it. */
  const [selected, setSelected] = useState<string[]>([])

  const byClassName = useMemo(
    () => new Map(heroes.map((hero) => [hero.class_name, hero])),
    [heroes],
  )
  const team = useMemo(
    () => selected.map((className) => byClassName.get(className)).filter((h): h is Hero => !!h),
    [selected, byClassName],
  )

  const toggle = (className: string) =>
    setSelected((current) =>
      current.includes(className)
        ? current.filter((name) => name !== className)
        : current.length >= MAX_ENEMIES
          ? current
          : [...current, className],
    )

  const clear = (className: string) =>
    setSelected((current) => current.filter((name) => name !== className))

  const counters = useMemo(() => countersForTeam(selected), [selected])
  const full = selected.length >= MAX_ENEMIES

  return (
    <div className="flex flex-col gap-xl">
      <TeamBar team={team} onClear={clear} onClearAll={() => setSelected([])} />

      <section className="flex flex-col gap-md">
        <HeroPicker
          heroes={heroes}
          selected={selected}
          onToggle={toggle}
          blockedReason={
            full
              ? 'All six slots are full. Clear a slot in the team bar above to swap somebody in.'
              : undefined
          }
        />
      </section>

      <section className="flex flex-col gap-md">
        <h2 className="text-heading">
          Counters{selected.length ? ` — ${counters.length} items` : ''}
        </h2>
        {selected.length === 0 ? (
          <EmptyState title="No enemies selected" hint="Pick a hero above to see counters." />
        ) : (
          <div className="grid gap-md sm:grid-cols-2">
            {counters.slice(0, 8).map((counter) => (
              <ItemCard
                key={counter.item.class_name}
                name={counter.item.name}
                cost={counter.item.cost}
                tier={counter.item.tier}
                category={counter.item.category}
                strength={counter.strength}
                reason={counter.why}
                icon={counter.item.icon ?? counter.item.shop_icon}
                provenance={provenanceFor(counter.item.class_name)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
