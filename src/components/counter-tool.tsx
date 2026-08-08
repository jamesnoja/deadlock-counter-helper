'use client'

/**
 * Holds the enemy lineup and everything that follows from it.
 *
 * The order matters: the engine ranks once against the lineup, then the context
 * filters narrow or re-weight that single result. Phase and budget cannot see
 * each other, and none of them can change what the engine believes — which is
 * why the two lenses and the build view never disagree.
 *
 * State lives here, in memory, deliberately: E20 moves it to the URL so a
 * lineup can be shared, and putting it anywhere else first would be work we
 * throw away.
 */

import { useMemo, useState } from 'react'
import { BudgetFilter } from './budget-filter.tsx'
import { BuildLens } from './build-lens.tsx'
import { ChatExport } from './chat-export.tsx'
import { CounterPlan } from './counter-plan.tsx'
import { HeroPicker } from './hero-picker.tsx'
import { HeroesLens } from './heroes-lens.tsx'
import { ItemDetail } from './item-detail.tsx'
import { ItemsLens } from './items-lens.tsx'
import { EmptyState } from './primitives.tsx'
import { MAX_ENEMIES, TeamBar } from './team-bar.tsx'
import { YourHero } from './your-hero.tsx'
import { filterByPhase, splitByBudget, weightForRole } from '@/data/context.ts'
import { countersForTeam } from '@/data/counters.ts'
import { countersForItem } from '@/data/overlay.ts'
import type { Hero } from '@/data/schema.ts'
import { abilityByClassName } from '@/data/snapshot.ts'
import { GAME_PHASES, type GamePhase } from '@/data/tags.ts'

type Lens = 'items' | 'heroes' | 'build'

const LENSES: Lens[] = ['items', 'heroes', 'build']

export function CounterTool({ heroes }: { heroes: readonly Hero[] }) {
  /** Pick order, not snapshot order — the team bar should read as you built it. */
  const [selected, setSelected] = useState<string[]>([])
  const [lens, setLens] = useState<Lens>('items')
  const [focus, setFocus] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [phase, setPhase] = useState<GamePhase | null>(null)
  const [budget, setBudget] = useState<number | null>(null)
  const [yourHero, setYourHero] = useState<string | null>(null)

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

  /** Ranked once. Everything below narrows or re-weights this one result. */
  const ranked = useMemo(() => countersForTeam(selected), [selected])

  const contextual = useMemo(() => {
    const role = yourHero ? (byClassName.get(yourHero)?.role ?? null) : null
    return weightForRole(filterByPhase(ranked, phase, countersForItem), role)
  }, [ranked, phase, yourHero, byClassName])

  const { affordable, outOfReach } = useMemo(
    () => splitByBudget(contextual, budget),
    [contextual, budget],
  )

  const detail = affordable.find((c) => c.item.class_name === selectedItem) ?? null
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

      {selected.length === 0 ? (
        <EmptyState title="No enemies selected" hint="Pick a hero above to see counters." />
      ) : (
        <section className="flex flex-col gap-md">
          <div className="flex flex-wrap items-center justify-between gap-md">
            <h2 className="text-heading">Counters — {affordable.length} items</h2>
            <ChatExport counters={affordable} team={team} />
          </div>

          <YourHero heroes={heroes} value={yourHero} onChange={setYourHero} />

          <div role="group" aria-label="Game phase" className="flex flex-wrap gap-xs">
            <button
              type="button"
              aria-pressed={phase === null}
              onClick={() => setPhase(null)}
              className={[
                'rounded-pill border-2 px-md py-xs text-micro transition-colors',
                phase === null
                  ? 'border-brand bg-brand-subdued text-brand-soft'
                  : 'border-hairline text-text-muted hover:border-brand',
              ].join(' ')}
            >
              any phase
            </button>
            {GAME_PHASES.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={phase === value}
                onClick={() => setPhase(value)}
                className={[
                  'rounded-pill border-2 px-md py-xs text-micro transition-colors',
                  phase === value
                    ? 'border-brand bg-brand-subdued text-brand-soft'
                    : 'border-hairline text-text-muted hover:border-brand',
                ].join(' ')}
              >
                {value}
              </button>
            ))}
          </div>

          <BudgetFilter
            budget={budget}
            onChange={setBudget}
            affordable={affordable.length}
            outOfReach={outOfReach.length}
          />

          {affordable.length === 0 ? (
            <EmptyState
              title="Nothing matches those filters"
              hint="Widen the budget or phase to see counters again."
            />
          ) : (
            <>
              <div role="group" aria-label="View" className="flex gap-xs">
                {LENSES.map((value) => (
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

              <CounterPlan counters={affordable} team={team} onSelect={setSelectedItem} />

              {detail ? (
                <ItemDetail
                  counter={detail}
                  team={team}
                  abilityName={(className) => abilityByClassName(className)?.name}
                  onClose={() => setSelectedItem(null)}
                />
              ) : null}

              {lens === 'items' ? (
                <ItemsLens
                  counters={affordable}
                  team={team}
                  onSelectItem={setSelectedItem}
                  onSelectHero={(className) => {
                    setFocus(className)
                    setLens('heroes')
                  }}
                />
              ) : lens === 'heroes' ? (
                <HeroesLens
                  counters={affordable}
                  team={team}
                  focus={focus}
                  onFocus={setFocus}
                  onSelectItem={setSelectedItem}
                />
              ) : (
                <BuildLens
                  counters={affordable}
                  teamSize={team.length}
                  onSelectItem={setSelectedItem}
                />
              )}

              {outOfReach.length > 0 ? (
                <section className="flex flex-col gap-xs rounded-card bg-surface p-card">
                  <h3 className="text-micro text-provenance-stale">Just out of reach</h3>
                  <p className="text-caption text-text-muted">
                    The next rung up, for planning your following back.
                  </p>
                  <ul className="flex flex-wrap gap-xs">
                    {outOfReach.map((counter) => (
                      <li
                        key={counter.item.class_name}
                        className="rounded-pill bg-surface-elevated px-md py-xs text-caption"
                      >
                        {counter.item.name}{' '}
                        <span className="text-tabular text-text-muted">
                          {counter.item.cost.toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </>
          )}
        </section>
      )}
    </div>
  )
}
