/**
 * The overlay joined to the snapshot.
 *
 * Layer B of the architecture: the hand-curated mapping between what abilities
 * threaten and what items answer. E05 consumes this to derive counters; nothing
 * here ranks or recommends.
 */

import { ABILITY_THREATS } from '../../data/overlay/ability-threats.ts'
import { ITEM_COUNTERS } from '../../data/overlay/item-counters.ts'
import { ABILITIES, HEROES, NON_RANKED_ITEMS, RANKED_ITEMS } from './snapshot.ts'
import type { Hero } from './schema.ts'
import type { AbilityThreats, ItemCounters, ThreatTag } from './tags.ts'

export { ABILITY_THREATS, ITEM_COUNTERS }

export const threatsForAbility = (className: string): AbilityThreats | undefined =>
  ABILITY_THREATS[className]

export const countersForItem = (className: string): ItemCounters | undefined =>
  ITEM_COUNTERS[className]

/** Every distinct threat tag a hero presents across its four abilities. */
export function threatsForHero(hero: Hero): ThreatTag[] {
  const tags = hero.abilities.flatMap((className) => ABILITY_THREATS[className]?.tags ?? [])
  return [...new Set(tags)].sort()
}

/** Items whose answers intersect the given tags. Unranked — E05 ranks. */
export function itemsAnswering(tags: readonly ThreatTag[]): string[] {
  const wanted = new Set(tags)
  return Object.entries(ITEM_COUNTERS)
    .filter(([, entry]) => entry.answers.some((tag) => wanted.has(tag)))
    .map(([className]) => className)
    .sort()
}

/**
 * Buckets for the curation worklist.
 *
 * `blocked` matters most: upstream ships some abilities and items with no
 * description at all, so no amount of reading the data will settle them. They
 * need someone who has played the matchup, and separating them stops that work
 * hiding inside the much larger "untagged" pile.
 */
export type CurationBucket = 'blocked' | 'untagged' | 'suggested' | 'curated'

export interface CurationEntry {
  class_name: string
  name: string
  /** The game's own text. Empty is what puts an entry in `blocked`. */
  description: string
  bucket: CurationBucket
  tags: ThreatTag[]
  note?: string
  /** Owning hero's display name, for abilities. */
  hero?: string
  slot?: number
  /** Items only. */
  strength?: string
  why?: string
}

const bucketFor = (
  entry: { untagged?: true; review: string } | undefined,
  description: string,
): CurationBucket => {
  if (!entry) return 'untagged'
  if (entry.review === 'curated') return 'curated'
  if (!entry.untagged) return 'suggested'
  return description.trim() ? 'untagged' : 'blocked'
}

export function abilityCurationQueue(): CurationEntry[] {
  const heroName = new Map(HEROES.map((hero) => [hero.class_name, hero.name]))
  return ABILITIES.map((ability) => {
    const entry = ABILITY_THREATS[ability.class_name]
    return {
      class_name: ability.class_name,
      name: ability.name,
      description: ability.description,
      bucket: bucketFor(entry, ability.description),
      tags: entry?.tags ?? [],
      note: entry?.note,
      hero: heroName.get(ability.hero) ?? ability.hero,
      slot: ability.slot,
    }
  }).sort((a, b) => `${a.hero}${a.slot}`.localeCompare(`${b.hero}${b.slot}`))
}

/** Curation work. Ranked-buyable items only — the rest cannot be recommended anyway. */
export function itemCurationQueue(): CurationEntry[] {
  return RANKED_ITEMS.map((item) => {
    const entry = ITEM_COUNTERS[item.class_name]
    return {
      class_name: item.class_name,
      name: item.name,
      description: item.description,
      bucket: bucketFor(entry, item.description),
      tags: entry?.answers ?? [],
      strength: entry?.strength,
      why: entry?.why,
    }
  }).sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Items excluded from recommendations, kept for reference.
 *
 * Not a worklist — tagging these changes nothing until they become buyable.
 * Listed so the exclusion is visible and reversible rather than a silent
 * filter someone rediscovers later.
 */
export function nonRankedItems(): CurationEntry[] {
  return NON_RANKED_ITEMS.map((item) => ({
    class_name: item.class_name,
    name: item.name,
    description: item.description,
    bucket: bucketFor(ITEM_COUNTERS[item.class_name], item.description),
    tags: ITEM_COUNTERS[item.class_name]?.answers ?? [],
    strength: ITEM_COUNTERS[item.class_name]?.strength,
    why: ITEM_COUNTERS[item.class_name]?.why,
  })).sort((a, b) => a.name.localeCompare(b.name))
}

export interface OverlayCoverage {
  abilities: { total: number; tagged: number; untagged: number; suggested: number }
  /** Ranked-buyable items only — the rest cannot be recommended, so they are not coverage. */
  items: { total: number; tagged: number; untagged: number; suggested: number }
  /** Excluded from recommendations: mode-restricted or not yet live. */
  nonRankedCount: number
  /** Heroes with no threat tags at all — invisible to the engine until fixed. */
  heroesWithNoThreats: string[]
}

/** Drives the coverage assertions here and the admin page in E06. */
export function overlayCoverage(): OverlayCoverage {
  const abilityEntries = ABILITIES.map((a) => ABILITY_THREATS[a.class_name]).filter(
    (entry): entry is AbilityThreats => entry !== undefined,
  )
  const itemEntries = RANKED_ITEMS.map((item) => ITEM_COUNTERS[item.class_name]).filter(
    (entry): entry is ItemCounters => entry !== undefined,
  )
  return {
    abilities: {
      total: ABILITIES.length,
      tagged: abilityEntries.filter((e) => !e.untagged).length,
      untagged: abilityEntries.filter((e) => e.untagged).length,
      suggested: abilityEntries.filter((e) => e.review === 'suggested').length,
    },
    items: {
      total: itemEntries.length,
      tagged: itemEntries.filter((e) => !e.untagged).length,
      untagged: itemEntries.filter((e) => e.untagged).length,
      suggested: itemEntries.filter((e) => e.review === 'suggested').length,
    },
    nonRankedCount: NON_RANKED_ITEMS.length,
    heroesWithNoThreats: HEROES.filter((hero) => threatsForHero(hero).length === 0)
      .map((hero) => hero.class_name)
      .sort(),
  }
}
