/**
 * The engine bound to the committed data.
 *
 * `derive.ts` stays pure and data-injected so tests can use fixtures; this is
 * what the app calls.
 */

import { COUNTER_OVERRIDES } from '../../data/overlay/overrides.ts'
import { deriveCounters, type RankedCounter } from './derive.ts'
import { ABILITY_THREATS, ITEM_COUNTERS } from './overlay.ts'
import { HEROES, ITEMS } from './snapshot.ts'
import type { Hero } from './schema.ts'

/** Ranked counters for a set of enemy hero `class_name`s. Unknown names are ignored. */
export function countersForTeam(enemyClassNames: readonly string[]): RankedCounter[] {
  const byClassName = new Map(HEROES.map((hero) => [hero.class_name, hero]))
  const heroes = enemyClassNames
    .map((className) => byClassName.get(className))
    .filter((hero): hero is Hero => hero !== undefined)

  return deriveCounters(heroes, {
    items: ITEMS,
    abilityThreats: ABILITY_THREATS,
    itemCounters: ITEM_COUNTERS,
    overrides: COUNTER_OVERRIDES,
  })
}
