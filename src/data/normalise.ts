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
  type HeroRole,
  type Item,
  type ItemTier,
  type Snapshot,
  RANKED_MAX_COST,
  isHeroRole,
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
 * Item slugs come from `class_name`. Items have no pages of their own, so
 * stability beats readability. `upgrade_metal_skin` -> `metal-skin`.
 */
export function toSlug(className: string): string {
  return className
    .replace(/^(hero|upgrade|citadel_ability|ability)_/, '')
    .replace(/_/g, '-')
    .toLowerCase()
}

/**
 * Hero slugs come from the display name, because E21's per-hero pages exist to
 * rank for "how to counter abrams" — and 26 of 38 `class_name`s are unrelated
 * development codenames (Abrams is `hero_atlas`, Paige is `hero_bookworm`).
 *
 * A rename therefore does change the slug, which is why `Hero.aliases` carries
 * the old ones forward.
 */
export function toDisplaySlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
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

/**
 * Keeps only properties with both a label and a numeric value.
 *
 * `dropZeros` is for display surfaces. Upstream reports every property on every
 * entity, so a self-buff still carries "Cast Range 0m" and "Charges 0" — noise
 * on an item card and three times the file size. Ability stats keep their
 * zeros, because those feed the retune detection in E06 and a value moving to
 * zero is exactly the kind of change we must not lose.
 */
export function toStats(
  properties: UpstreamItem['properties'],
  { dropZeros = false }: { dropZeros?: boolean } = {},
): Record<string, AbilityStat> {
  const stats: Record<string, AbilityStat> = {}
  for (const key of Object.keys(properties ?? {}).sort()) {
    const property = properties?.[key]
    const value = toNumber(property?.value)
    if (!property?.label || value === null) continue
    if (dropZeros && value === 0) continue
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
  /** The previous snapshot's heroes, so renames accumulate aliases. */
  previousHeroes: readonly Hero[] = [],
): Snapshot {
  const previousByClassName = new Map(previousHeroes.map((hero) => [hero.class_name, hero]))
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

    const name = upstreamHero.name ?? className
    const slug = toDisplaySlug(name)
    const previous = previousByClassName.get(className)
    // Keep every slug this hero has ever had, minus the current one.
    const aliases = [...new Set([...(previous?.aliases ?? []), previous?.slug ?? ''])]
      .filter((alias) => alias && alias !== slug)
      .sort()

    const rawRole = upstreamHero.hero_type
    heroes.push({
      class_name: className,
      name,
      // Upstream omits hero_type on at least one playable hero; unknown is real.
      role: (isHeroRole(rawRole) ? rawRole : 'unknown') as HeroRole,
      slug,
      aliases,
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
    const cost = raw.cost ?? 0
    items.push({
      class_name: className,
      name: raw.name ?? className,
      slug: toSlug(className),
      cost,
      tier: raw.item_tier as ItemTier,
      category: raw.item_slot_type,
      ranked: cost <= RANKED_MAX_COST,
      is_active: raw.is_active_item === true,
      description: toPlainText(raw.description),
      icon: raw.image_webp ?? raw.image ?? null,
      shop_icon: raw.shop_image_webp ?? raw.shop_image ?? null,
      stats: toStats(raw.properties, { dropZeros: true }),
    })
  }

  // Sorted so a re-sync with unchanged upstream data produces an identical file.
  return {
    heroes: heroes.sort(byClassName),
    abilities: abilities.sort(byClassName),
    items: items.sort(byClassName),
  }
}
