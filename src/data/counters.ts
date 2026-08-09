/**
 * The engine bound to the committed data.
 *
 * `sourced.ts` stays pure so tests can drive it directly; this resolves enemy
 * `class_name`s against the snapshot and is what the app calls.
 */

import { planCounters, type CounterPlan } from './sourced.ts'
import { HEROES } from './snapshot.ts'
import type { Hero } from './schema.ts'

/**
 * The counter plan for a set of enemy hero `class_name`s.
 *
 * An unknown `class_name` is dropped here — it is a bad URL or a stale
 * bookmark, not a hero the source has yet to write up. A hero that *is* in the
 * snapshot but has no published advice survives into `plan.unavailable`, which
 * is a different thing and has to stay visible.
 */
export function planForTeam(enemyClassNames: readonly string[]): CounterPlan {
  const byClassName = new Map(HEROES.map((hero) => [hero.class_name, hero]))
  const heroes = enemyClassNames
    .map((className) => byClassName.get(className))
    .filter((hero): hero is Hero => hero !== undefined)

  return planCounters(heroes)
}
