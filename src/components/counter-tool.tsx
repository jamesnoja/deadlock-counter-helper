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
import { countersForTeam } from '@/data/counters.ts'
import { provenanceFor } from '@/data/provenance.ts'
import type { Hero } from '@/data/schema.ts'

const MAX_ENEMIES = 6

export function CounterTool({ heroes }: { heroes: readonly Hero[] }) {
  const [selected, setSelected] = useState<string[]>([])

  const toggle = (className: string) =>
    setSelected((current) =>
      current.includes(className)
        ? current.filter((name) => name !== className)
        : current.length >= MAX_ENEMIES
          ? current
          : [...current, className],
    )

  const counters = useMemo(() => countersForTeam(selected), [selected])
  const full = selected.length >= MAX_ENEMIES

  return (
    <div className="flex flex-col gap-xl">
      <section className="flex flex-col gap-md">
        <h2 className="text-heading">Enemy team</h2>
        <HeroPicker
          heroes={heroes}
          selected={selected}
          onToggle={toggle}
          blockedReason={
            full ? `Six enemies selected — clear one to swap somebody in.` : undefined
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
            {counters.slice(0, 6).map((counter) => (
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
