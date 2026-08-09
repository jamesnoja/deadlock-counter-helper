/**
 * Slot economy — E15.
 *
 * A flat list of twelve recommended items hides the actual decision, which is
 * a tradeoff: you have limited purchases and taking one thing means not taking
 * another.
 *
 * **The spec assumed a flat "per-category slot count". Upstream does not model
 * that.** `item_slot_info` gives `max_purchases_for_tier` per category — a cap
 * on how many items of each tier you may buy, currently `[6, 6, 6]` for tiers
 * 1–3 on every hero and category. Built against the real shape rather than an
 * invented one.
 */

import type { SourcedCounter } from './sourced.ts'
import { ITEM_CATEGORIES, type ItemCategory } from './schema.ts'

export interface CategoryBuild {
  category: ItemCategory
  /** Best picks first, capped. */
  picks: SourcedCounter[]
  /** Everything else that answers something, behind a disclosure. */
  runnersUp: SourcedCounter[]
  /** Total souls for the picks — the real cost of this column. */
  cost: number
}

/**
 * Purchases allowed per tier, per category.
 *
 * From `item_slot_info.max_purchases_for_tier`. Uniform across heroes today, so
 * it is a constant rather than a per-hero lookup — but it lives here named, so
 * the day it stops being uniform there is one place to change.
 */
export const MAX_PURCHASES_PER_CATEGORY = 6

export function buildByCategory(
  counters: readonly SourcedCounter[],
  limit: number = MAX_PURCHASES_PER_CATEGORY,
): CategoryBuild[] {
  return ITEM_CATEGORIES.map((category) => {
    const inCategory = counters.filter((counter) => counter.item.category === category)
    const picks = inCategory.slice(0, limit)
    return {
      category,
      picks,
      runnersUp: inCategory.slice(limit),
      cost: picks.reduce((total, counter) => total + counter.item.cost, 0),
    }
  })
}

/**
 * What taking the last pick costs you.
 *
 * The opportunity cost E15 asks to surface: the best thing you did *not* take
 * in this category, and the pick it displaced.
 */
export function opportunityCost(
  build: CategoryBuild,
): { dropped: SourcedCounter; inFavourOf: SourcedCounter } | null {
  const dropped = build.runnersUp[0]
  const inFavourOf = build.picks.at(-1)
  if (!dropped || !inFavourOf) return null
  return { dropped, inFavourOf }
}
