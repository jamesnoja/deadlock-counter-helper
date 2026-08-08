/**
 * Context filters applied on top of the ranking — E14, E16, E18.
 *
 * All three narrow or re-weight an existing result rather than deriving a new
 * one. Keeping them out of `deriveCounters` means the engine stays a pure join
 * with one job, and these stay independently testable.
 */

import type { RankedCounter } from './derive.ts'
import type { ItemCounters, GamePhase } from './tags.ts'
import { PHASES_FOR_TIER } from './tags.ts'
import type { HeroRole, ItemCategory } from './schema.ts'

/* ------------------------------------------------------------------- budget */

export interface BudgetSplit {
  affordable: RankedCounter[]
  /** The next rung up — what to plan the following back around. */
  outOfReach: RankedCounter[]
}

/**
 * Splits rather than filters. E14 asks for a "just out of reach" section, and
 * hiding the next tier entirely would answer "what can I buy" while destroying
 * "what am I saving for".
 */
export function splitByBudget(
  counters: readonly RankedCounter[],
  budget: number | null,
): BudgetSplit {
  if (budget === null) return { affordable: [...counters], outOfReach: [] }
  const affordable = counters.filter((counter) => counter.item.cost <= budget)
  const cheapestUnaffordable = Math.min(
    ...counters.filter((counter) => counter.item.cost > budget).map((counter) => counter.item.cost),
  )
  return {
    affordable,
    outOfReach: Number.isFinite(cheapestUnaffordable)
      ? counters.filter((counter) => counter.item.cost === cheapestUnaffordable)
      : [],
  }
}

/* -------------------------------------------------------------------- phase */

export const phasesFor = (counter: RankedCounter, entry?: ItemCounters): GamePhase[] =>
  entry?.phases ?? PHASES_FOR_TIER[counter.item.tier] ?? ['lane', 'mid', 'late']

/** Keeps only items worth buying in the chosen phase. */
export function filterByPhase(
  counters: readonly RankedCounter[],
  phase: GamePhase | null,
  entryFor: (className: string) => ItemCounters | undefined,
): RankedCounter[] {
  if (phase === null) return [...counters]
  return counters.filter((counter) =>
    phasesFor(counter, entryFor(counter.item.class_name)).includes(phase),
  )
}

/* ---------------------------------------------------------------- your hero */

/**
 * What each role tends to want, by item category.
 *
 * This is the honest limit of E18 as specced. Its redundancy warnings ("your
 * ult already grants CC immunity") need to know what an ability *provides*, and
 * the overlay only records what an ability *threatens*. Role affinity is the
 * part that is genuinely derivable from data we hold, so it is the part that
 * ships; the rest needs a new overlay dimension and is not faked here.
 */
const ROLE_AFFINITY: Record<HeroRole, Partial<Record<ItemCategory, number>>> = {
  brawler: { vitality: 1.25, weapon: 1.05 },
  assassin: { weapon: 1.2, spirit: 1.05 },
  marksman: { weapon: 1.25 },
  mystic: { spirit: 1.25, vitality: 1.05 },
  unknown: {},
}

/**
 * Re-weights by how well an item suits the role you are playing.
 *
 * A nudge, not a rewrite — the multipliers are deliberately small, because the
 * enemy lineup should still dominate the ranking. Re-sorted with the same
 * tie-breaks as the engine so ordering stays total and stable.
 */
export function weightForRole(
  counters: readonly RankedCounter[],
  role: HeroRole | null,
): RankedCounter[] {
  if (!role) return [...counters]
  const affinity = ROLE_AFFINITY[role]
  /**
   * No affinity means no opinion, so leave the order alone. Re-sorting anyway
   * would shuffle equal-scoring items into alphabetical order and make picking
   * a hero with an unknown role look like it had done something.
   */
  if (Object.keys(affinity).length === 0) return [...counters]

  return counters
    .map((counter) => ({
      ...counter,
      score: counter.score * (affinity[counter.item.category] ?? 1),
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.coverage.length - a.coverage.length ||
        a.item.class_name.localeCompare(b.item.class_name),
    )
}
