/**
 * The counter plan — the layer above the shortlist.
 *
 * A ranked list of forty items is complete but not decisive. Mid-match the
 * question is not "what are my options", it is "what do I buy". This picks the
 * few that answer that, and labels why each is here.
 */

import type { RankedCounter } from './derive.ts'

export type PlanTier = 'core' | 'flexible'

export interface PlanEntry {
  counter: RankedCounter
  tier: PlanTier
}

export const PLAN_SIZE = 3

/**
 * **Core answers more than half the lineup; flexible answers fewer but answers
 * at least one of them strongly.**
 *
 * That is the whole rule, and it is derived — nothing here is authored. The
 * distinction matters because the two are bought for different reasons: a core
 * item is value against the team, a flexible one is a targeted pick you take
 * because a specific enemy is ruining your game.
 */
export function classify(counter: RankedCounter, teamSize: number): PlanTier {
  return counter.coverage.length * 2 > teamSize ? 'core' : 'flexible'
}

/**
 * The top few counters, already ranked by the engine, each labelled.
 *
 * Deliberately a slice of the same ordering rather than its own ranking — this
 * is a lens on the shortlist, not a second opinion about it. Anything here is
 * always also in the full table.
 */
export function counterPlan(
  counters: readonly RankedCounter[],
  teamSize: number,
  size: number = PLAN_SIZE,
): PlanEntry[] {
  if (teamSize <= 0) return []
  return counters.slice(0, size).map((counter) => ({ counter, tier: classify(counter, teamSize) }))
}
