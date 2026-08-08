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
import { HeroesLens } from './heroes-lens.tsx'
import { ItemsLens } from './items-lens.tsx'
import { EmptyState } from './primitives.tsx'
import { MAX_ENEMIES, TeamBar } from './team-bar.tsx'
import { countersForTeam } from '@/data/counters.ts'
import type { Hero } from '@/data/schema.ts'

export function CounterTool({ heroes }: { heroes: readonly Hero[] }) {
  /** Pick order, not snapshot order — the team bar should read as you built it. */
  const [selected, setSelected] = useState<string[]>([])
  const [lens, setLens] = useState<'items' | 'heroes'>('items')
  /** Which hero the heroes lens is focused on; null is the combined view. */
  const [focus, setFocus] = useState<string | null>(null)

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
          <>
            <div role="group" aria-label="View" className="flex gap-xs">
              {(['items', 'heroes'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={lens === value}
                  onClick={() => setLens(value)}
                  className={[
                    'rounded-pill border-2 px-xl py-xs text-micro transition-colors',
                    lens === value
                      ? 'border-brand bg-brand-subdued text-brand-soft'
                      : 'border-hairline text-text-muted hover:border-brand',
                  ].join(' ')}
                >
                  {value}
                </button>
              ))}
            </div>

            {lens === 'items' ? (
              <ItemsLens
                counters={counters}
                team={team}
                // Clicking a coverage cell is the bridge between the lenses.
                onSelectHero={(className) => {
                  setFocus(className)
                  setLens('heroes')
                }}
              />
            ) : (
              <HeroesLens counters={counters} team={team} focus={focus} onFocus={setFocus} />
            )}
          </>
        )}
      </section>
    </div>
  )
}
