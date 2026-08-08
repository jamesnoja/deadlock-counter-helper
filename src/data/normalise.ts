/**
 * Pure transforms from upstream payloads to our snapshot model.
 *
 * No I/O lives here so the whole thing is unit-testable against fixtures, and
 * so `npm run sync` is the only place that touches the network or the disk.
 */

import {
  type Ability,
  type AbilitySlot,
  type AbilityStat,
  type Hero,
  type Item,
  type ItemTier,
  type Snapshot,
  isItemCategory,
  isItemTier,
} from './schema.ts'
import type { UpstreamDescription, UpstreamHero, UpstreamItem } from './upstream.ts'

/**
 * Upstream descriptions carry HTML — `<span class="highlight">` and, on some
 * abilities, entire inline `<svg>` blobs thousands of characters long. We want
 * plain text: it keeps diffs readable, keeps the snapshot small, and means no
 * component is ever tempted to reach for dangerouslySetInnerHTML.
 */
export function toPlainText(description: UpstreamDescription | undefined): string {
  const raw = description?.desc
  if (!raw) return ''
  return raw
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Slugs come from `class_name`, never the display name — a rename upstream must
 * not break a shared link. `hero_atlas` -> `atlas`, `upgrade_metal_skin` ->
 * `metal-skin`.
 */
export function toSlug(className: string): string {
  return className
    .replace(/^(hero|upgrade|citadel_ability|ability)_/, '')
    .replace(/_/g, '-')
    .toLowerCase()
}

/** Upstream mixes `33` and `"1.4"` in the same field. */
function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

/** Keeps only properties with both a label and a numeric value. */
export function toStats(properties: UpstreamItem['properties']): Record<string, AbilityStat> {
  const stats: Record<string, AbilityStat> = {}
  for (const key of Object.keys(properties ?? {}).sort()) {
    const property = properties?.[key]
    const value = toNumber(property?.value)
    if (!property?.label || value === null) continue
    stats[key] = { label: property.label, value, unit: property.postfix ?? '' }
  }
  return stats
}

/** A hero is in the snapshot only if a player can actually pick it today. */
export function isPlayable(hero: UpstreamHero): boolean {
  return hero.player_selectable === true && !hero.disabled && !hero.in_development
}

/** A shop item is a counter candidate only if it can be bought today. */
export function isPurchasable(item: UpstreamItem): boolean {
  return item.type === 'upgrade' && item.shopable === true && !item.disabled
}

const byClassName = <T extends { class_name: string }>(a: T, b: T) =>
  a.class_name < b.class_name ? -1 : a.class_name > b.class_name ? 1 : 0

/** `signature1`..`signature4`, in slot order, resolved to ability class names. */
function signatureClassNames(hero: UpstreamHero): string[] {
  return [1, 2, 3, 4]
    .map((slot) => hero.items?.[`signature${slot}`])
    .filter((name): name is string => typeof name === 'string' && name.length > 0)
}

export class NormaliseError extends Error {}

export function normalise(
  upstreamHeroes: UpstreamHero[],
  upstreamItems: UpstreamItem[],
): Snapshot {
  const itemsByClassName = new Map<string, UpstreamItem>()
  for (const item of upstreamItems) {
    if (item.class_name) itemsByClassName.set(item.class_name, item)
  }

  const heroes: Hero[] = []
  const abilities: Ability[] = []

  for (const upstreamHero of upstreamHeroes) {
    if (!isPlayable(upstreamHero)) continue
    const className = upstreamHero.class_name
    if (!className) throw new NormaliseError(`Playable hero with no class_name: ${upstreamHero.id}`)

    const abilityClassNames = signatureClassNames(upstreamHero)

    abilityClassNames.forEach((abilityClassName, index) => {
      const raw = itemsByClassName.get(abilityClassName)
      if (!raw) {
        throw new NormaliseError(
          `${className} references ability "${abilityClassName}", which is not in the items payload`,
        )
      }
      abilities.push({
        class_name: abilityClassName,
        name: raw.name ?? abilityClassName,
        hero: className,
        slot: (index + 1) as AbilitySlot,
        description: toPlainText(raw.description),
        icon: raw.image_webp ?? raw.image ?? null,
        stats: toStats(raw.properties),
      })
    })

    heroes.push({
      class_name: className,
      name: upstreamHero.name ?? className,
      slug: toSlug(className),
      images: {
        card: upstreamHero.images?.icon_hero_card_webp ?? upstreamHero.images?.icon_hero_card ?? null,
        portrait:
          upstreamHero.images?.icon_image_small_webp ?? upstreamHero.images?.icon_image_small ?? null,
        minimap: upstreamHero.images?.minimap_image_webp ?? upstreamHero.images?.minimap_image ?? null,
      },
      abilities: abilityClassNames,
    })
  }

  const items: Item[] = []
  for (const raw of upstreamItems) {
    if (!isPurchasable(raw)) continue
    const className = raw.class_name
    if (!className) throw new NormaliseError(`Purchasable item with no class_name: ${raw.id}`)
    if (!isItemCategory(raw.item_slot_type)) {
      throw new NormaliseError(`${className} has unknown item_slot_type "${raw.item_slot_type}"`)
    }
    if (!isItemTier(raw.item_tier)) {
      throw new NormaliseError(`${className} has unknown item_tier "${raw.item_tier}"`)
    }
    items.push({
      class_name: className,
      name: raw.name ?? className,
      slug: toSlug(className),
      cost: raw.cost ?? 0,
      tier: raw.item_tier as ItemTier,
      category: raw.item_slot_type,
      is_active: raw.is_active_item === true,
      description: toPlainText(raw.description),
      icon: raw.image_webp ?? raw.image ?? null,
      shop_icon: raw.shop_image_webp ?? raw.shop_image ?? null,
    })
  }

  // Sorted so a re-sync with unchanged upstream data produces an identical file.
  return {
    heroes: heroes.sort(byClassName),
    abilities: abilities.sort(byClassName),
    items: items.sort(byClassName),
  }
}
