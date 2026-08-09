'use client'

/**
 * The three cards above the shortlist — E33.
 *
 * Everything here is also in the full table. This is a lens on the ranking, not
 * a second recommendation, which is why it slices the engine's order rather
 * than computing its own.
 */

import { GameImage } from './game-image.tsx'
import { pairStrength, reasonFor, type SourcedCounter } from '@/data/sourced.ts'
import { counterPlan, type PlanTier } from '@/data/plan.ts'
import { itemArtwork } from '@/data/snapshot.ts'
import type { Hero } from '@/data/schema.ts'

const TIER_CLASS: Record<PlanTier, string> = {
  core: 'text-counter-hard',
  flexible: 'text-category-spirit',
}

const TIER_HINT: Record<PlanTier, string> = {
  core: 'Answers most of this lineup',
  flexible: 'Targeted — fewer enemies, but decisive against them',
}

interface CounterPlanProps {
  counters: readonly SourcedCounter[]
  team: readonly Hero[]
  onSelect: (className: string) => void
}

export function CounterPlan({ counters, team, onSelect }: CounterPlanProps) {
  const plan = counterPlan(counters, team.length)
  if (plan.length === 0) return null

  return (
    <section className="flex flex-col gap-sm">
      <h3 className="text-micro text-text-muted">Counter plan</h3>
      <ul className="grid gap-md sm:grid-cols-3">
        {plan.map(({ counter, tier }) => (
          <li key={counter.item.class_name}>
            <button
              type="button"
              onClick={() => onSelect(counter.item.class_name)}
              className="flex h-full w-full flex-col gap-sm rounded-card bg-surface p-card text-left shadow-1 transition-colors hover:bg-surface-elevated"
            >
              <span className="flex items-start justify-between gap-sm">
                {/* The label says why this card is here, not just that it is. */}
                <span className={`text-micro ${TIER_CLASS[tier]}`} title={TIER_HINT[tier]}>
                  {tier}
                </span>
                <span className="shrink-0">
                  <span className="text-tabular text-heading text-brand">
                    {counter.coverage.length}
                  </span>
                  <span className="text-caption text-text-muted">/{team.length}</span>
                </span>
              </span>

              <span className="flex items-center gap-sm">
                <GameImage
                  src={itemArtwork(counter.item)}
                  fallback={counter.item.name}
                  size={40}
                  className="shrink-0 rounded-md"
                />
                <span className="min-w-0">
                  <span className="block truncate text-heading">{counter.item.name}</span>
                  <span className="block text-micro text-text-muted">
                    {counter.item.category} · T{counter.item.tier} ·{' '}
                    <span className="text-tabular">{counter.item.cost.toLocaleString()}</span>
                  </span>
                </span>
              </span>

              <span className="line-clamp-2 text-caption text-text-muted">{reasonFor(counter)}</span>

              <span className="mt-auto flex flex-wrap gap-px pt-xs">
                {counter.perHero
                  .filter((effect) => pairStrength(effect) !== 'none')
                  .map((effect) => {
                    const hero = team.find((candidate) => candidate.class_name === effect.hero)
                    return (
                      <GameImage
                        key={effect.hero}
                        src={hero?.images.minimap ?? hero?.images.portrait}
                        fallback={hero?.name ?? '?'}
                        size={20}
                        className="rounded-pill"
                      />
                    )
                  })}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
