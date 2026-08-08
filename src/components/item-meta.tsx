/**
 * Category, tier and cost — the three facts E13 requires on every item.
 *
 * One component rather than the same markup in four places, so "category is an
 * icon *and* a label, never a colour alone" holds everywhere by construction
 * instead of by everyone remembering.
 */

import type { ItemCategory } from '@/data/schema.ts'

const CATEGORY_CLASS: Record<ItemCategory, string> = {
  weapon: 'text-category-weapon',
  vitality: 'text-category-vitality',
  spirit: 'text-category-spirit',
}

/** A shape per category, so the distinction survives greyscale. */
const CATEGORY_GLYPH: Record<ItemCategory, string> = {
  weapon: '◈',
  vitality: '❤',
  spirit: '✦',
}

export function CategoryTag({ category }: { category: ItemCategory }) {
  return (
    <span
      className={`inline-flex items-center gap-xs rounded-pill bg-surface-elevated px-sm py-px text-micro ${CATEGORY_CLASS[category]}`}
    >
      <span aria-hidden>{CATEGORY_GLYPH[category]}</span>
      {category}
    </span>
  )
}

export function ItemMeta({
  category,
  tier,
  cost,
}: {
  category: ItemCategory
  tier: number
  cost: number
}) {
  return (
    <span className="flex flex-wrap items-center gap-xs">
      <CategoryTag category={category} />
      <span className="text-micro text-text-muted">
        Tier {tier}
        <span className="sr-only"> item</span>
      </span>
      <span className="text-tabular">
        {cost.toLocaleString()}
        <span className="sr-only"> souls</span>
      </span>
    </span>
  )
}
