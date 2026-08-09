/**
 * When an item is worth buying.
 *
 * All that survives of the threat-tag vocabulary. The tags themselves —
 * `hard_cc`, `channeled_ult` and the rest — described what an ability
 * threatened and what an item answered, and were the pivot the derivation
 * engine turned on. Counter advice is now published per hero rather than
 * derived per tag, so the vocabulary has no reader and is gone.
 *
 * Phase is not part of that. It is a fact about an item's cost curve, it is
 * derived from tier rather than authored, and the phase filter still uses it.
 */

export const GAME_PHASES = ['lane', 'mid', 'late'] as const
export type GamePhase = (typeof GAME_PHASES)[number]

/**
 * Default phase from tier.
 *
 * Cost is a pure function of tier and souls accumulate over a match, so tier is
 * a genuine proxy for when an item comes online.
 *
 * This used to be a *default* that a curated overlay entry could override. The
 * overlay is gone and no entry ever set one, so it is now simply the rule.
 */
export const PHASES_FOR_TIER: Record<number, GamePhase[]> = {
  1: ['lane', 'mid'],
  2: ['lane', 'mid'],
  3: ['mid', 'late'],
  4: ['late'],
  5: ['late'],
}
