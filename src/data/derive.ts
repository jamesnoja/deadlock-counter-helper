/**
 * Layer C — the counter derivation engine.
 *
 * Pure and deterministic. Data is injected rather than imported, so tests run
 * against fixtures instead of the live snapshot and a data change can never
 * quietly alter what a test proves. `deriveCountersForTeam` is the convenience
 * wrapper that binds the committed data.
 *
 * The engine does not know about game phases, soul budgets, or which hero you
 * are playing. Those are E14, E16 and E18, and they belong on top of a ranking
 * that is stable without them.
 */

import type { Hero, Item } from './schema.ts'
import {
  STRENGTH_WEIGHT,
  THREAT_SEVERITY,
  type AbilityThreats,
  type CounterStrength,
  type ItemCounters,
  type ThreatTag,
} from './tags.ts'

/** How an override bends the result. Each needs a reason; the type enforces it. */
export type OverrideEffect = 'include' | 'exclude' | 'boost' | 'demote'

export interface CounterOverride {
  /** Item `class_name`. */
  item: string
  /** Limit to one enemy hero's `class_name`. Omit to apply whenever the item appears. */
  hero?: string
  effect: OverrideEffect
  /** Required. Shown in the UI and in review — an unexplained override is a future bug. */
  reason: string
}

/** Multipliers for boost and demote. Deliberately modest: an override nudges, it does not rewrite. */
const OVERRIDE_MULTIPLIER: Record<'boost' | 'demote', number> = { boost: 1.5, demote: 0.5 }

/** Which enemy heroes an item answers, and through which threat. */
export interface CounterMatch {
  tag: ThreatTag
  /** Enemy hero `class_name`s presenting this tag. */
  heroes: string[]
}

export interface RankedCounter {
  item: Item
  /** Higher is better. Comparable only within one result set. */
  score: number
  /** Distinct enemy `class_name`s this item answers — the "5 of 6" in E10. */
  coverage: string[]
  matches: CounterMatch[]
  strength: CounterStrength
  /** The overlay's one-line justification. */
  why: string
  /**
   * `editorial` means a human overruled the derivation. E07 and E10 must
   * surface that difference rather than presenting it as computed.
   */
  source: 'derived' | 'editorial'
  /** Present only when an override applied. */
  overrideReason?: string
}

export interface DeriveContext {
  items: readonly Item[]
  abilityThreats: Readonly<Record<string, AbilityThreats>>
  itemCounters: Readonly<Record<string, ItemCounters>>
  overrides?: readonly CounterOverride[]
}

/** Threat tags a hero presents, deduplicated across its abilities. */
function heroThreats(hero: Hero, abilityThreats: DeriveContext['abilityThreats']): Set<ThreatTag> {
  const tags = new Set<ThreatTag>()
  for (const className of hero.abilities) {
    for (const tag of abilityThreats[className]?.tags ?? []) tags.add(tag)
  }
  return tags
}

/**
 * Ranks every item that answers something the given enemies present.
 *
 * Score is the sum, over each answered tag, of
 * `enemies presenting it × counter strength × tag severity`.
 *
 * Summing over tags rather than taking the best one is deliberate: an item
 * answering two different threats across a team is genuinely more useful than
 * one answering a single threat, and the shortlist should say so.
 */
export function deriveCounters(heroes: readonly Hero[], context: DeriveContext): RankedCounter[] {
  const { items, abilityThreats, itemCounters, overrides = [] } = context

  if (heroes.length === 0) return []

  // Which enemies present each tag. Built once, read per item.
  const heroesByTag = new Map<ThreatTag, string[]>()
  for (const hero of heroes) {
    for (const tag of heroThreats(hero, abilityThreats)) {
      const list = heroesByTag.get(tag) ?? []
      if (!list.includes(hero.class_name)) list.push(hero.class_name)
      heroesByTag.set(tag, list)
    }
  }

  const selected = new Set(heroes.map((hero) => hero.class_name))
  const relevantOverrides = overrides.filter((o) => !o.hero || selected.has(o.hero))
  const overridesByItem = new Map<string, CounterOverride[]>()
  for (const override of relevantOverrides) {
    overridesByItem.set(override.item, [...(overridesByItem.get(override.item) ?? []), override])
  }

  const results: RankedCounter[] = []

  for (const item of items) {
    const itemOverrides = overridesByItem.get(item.class_name) ?? []
    // Exclusion wins over everything, including an include on the same item —
    // "never show this" is the stronger statement, and a contradictory pair is
    // a curation mistake we should fail safe on.
    if (itemOverrides.some((o) => o.effect === 'exclude')) continue

    const entry = itemCounters[item.class_name]
    const answers = entry?.untagged ? [] : (entry?.answers ?? [])

    const matches: CounterMatch[] = []
    for (const tag of [...answers].sort()) {
      const answered = heroesByTag.get(tag)
      if (answered?.length) matches.push({ tag, heroes: [...answered].sort() })
    }

    const forced = itemOverrides.find((o) => o.effect === 'include')
    if (matches.length === 0 && !forced) continue

    const strength = entry?.strength ?? 'situational'
    const weight = STRENGTH_WEIGHT[strength]
    let score = matches.reduce(
      (total, match) => total + match.heroes.length * weight * THREAT_SEVERITY[match.tag],
      0,
    )

    for (const override of itemOverrides) {
      if (override.effect === 'boost' || override.effect === 'demote') {
        score *= OVERRIDE_MULTIPLIER[override.effect]
      }
    }
    // A forced include with no tag match still needs to rank somewhere.
    if (forced && score === 0) score = weight

    const editorial = itemOverrides.length > 0
    results.push({
      item,
      score,
      coverage: [...new Set(matches.flatMap((match) => match.heroes))].sort(),
      matches,
      strength,
      why: entry?.why ?? '',
      source: editorial ? 'editorial' : 'derived',
      ...(editorial ? { overrideReason: itemOverrides.map((o) => o.reason).join(' ') } : {}),
    })
  }

  // Score first, then coverage, then class_name. The final key guarantees a
  // total order, so identical inputs always produce identical output — no
  // dependence on the order items happened to arrive in.
  return results.sort(
    (a, b) =>
      b.score - a.score ||
      b.coverage.length - a.coverage.length ||
      a.item.class_name.localeCompare(b.item.class_name),
  )
}
