/**
 * The normalised snapshot model — our shape, not upstream's.
 *
 * Every entity is keyed on `class_name`. Display names are presentation only
 * and may change in any patch; nothing else in the codebase may key on them.
 */

/** Shop item categories. Upstream calls this `item_slot_type`. */
export const ITEM_CATEGORIES = ['weapon', 'vitality', 'spirit'] as const
export type ItemCategory = (typeof ITEM_CATEGORIES)[number]

/** Upstream ships tiers 1-5. */
export const ITEM_TIERS = [1, 2, 3, 4, 5] as const
export type ItemTier = (typeof ITEM_TIERS)[number]

/** Every hero has exactly four signature abilities; slot 4 is the ultimate. */
export const ABILITY_SLOTS = [1, 2, 3, 4] as const
export type AbilitySlot = (typeof ABILITY_SLOTS)[number]

/** A single numeric stat on an ability, e.g. `{ label: 'Cooldown', value: 33, unit: 's' }`. */
export interface AbilityStat {
  label: string
  value: number
  unit: string
}

export interface Hero {
  class_name: string
  name: string
  /** Derived from `class_name`, so a display-name change cannot break a URL. */
  slug: string
  images: {
    card: string | null
    portrait: string | null
    minimap: string | null
  }
  /** Ability `class_name`s in signature order, index 0 = slot 1. */
  abilities: string[]
}

export interface Ability {
  class_name: string
  name: string
  /** Owning hero's `class_name`. */
  hero: string
  slot: AbilitySlot
  /** Plain text. Upstream embeds HTML and inline SVG; both are stripped. */
  description: string
  icon: string | null
  /** Only properties carrying a numeric value and a label. */
  stats: Record<string, AbilityStat>
}

export interface Item {
  class_name: string
  name: string
  slug: string
  cost: number
  tier: ItemTier
  category: ItemCategory
  /** Active items need a keypress; passives do not. */
  is_active: boolean
  /** Plain text, as with abilities. */
  description: string
  icon: string | null
  shop_icon: string | null
}

export interface SnapshotMeta {
  /** Where it came from, so provenance is auditable without reading the script. */
  sources: Record<string, string>
  patch: {
    title: string
    published_at: string
    link: string
  } | null
  client_version: number | null
  counts: {
    heroes: number
    abilities: number
    items: number
  }
  /**
   * sha256 of the three data files. `synced_at` advances only when this
   * changes, so a daily sync that finds nothing new produces no diff — and a
   * PR from the patch-diff job (E06) always means something actually moved.
   */
  content_hash: string
  synced_at: string
}

export interface Snapshot {
  heroes: Hero[]
  abilities: Ability[]
  items: Item[]
}

export function isItemCategory(value: unknown): value is ItemCategory {
  return typeof value === 'string' && (ITEM_CATEGORIES as readonly string[]).includes(value)
}

export function isItemTier(value: unknown): value is ItemTier {
  return typeof value === 'number' && (ITEM_TIERS as readonly number[]).includes(value)
}
