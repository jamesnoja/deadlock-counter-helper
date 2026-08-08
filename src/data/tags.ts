/**
 * The threat-tag vocabulary — the pivot the whole product turns on.
 *
 * Abilities declare the threats they present. Items declare the threats they
 * answer. E05 joins the two, which is why counters are derived rather than
 * authored: tag a new hero's abilities and it inherits every relevant counter
 * with no other edit.
 *
 * Keep this list small. Every tag added is a tag that must be applied
 * consistently across 152 abilities and 173 items, and a vocabulary nobody can
 * hold in their head produces inconsistent curation.
 */

export const THREAT_TAGS = [
  'hard_cc',
  'channeled_ult',
  'sustain',
  'burst_spirit',
  'high_dps_gun',
  'airborne',
  'dot_debuff',
  'displacement',
  'stealth',
  'zone_denial',
  'summon_pressure',
  'melee_pressure',
] as const

export type ThreatTag = (typeof THREAT_TAGS)[number]

export const THREAT_TAG_LABELS: Record<ThreatTag, string> = {
  hard_cc: 'Hard CC',
  channeled_ult: 'Channelled ult',
  sustain: 'Sustain',
  burst_spirit: 'Spirit burst',
  high_dps_gun: 'Gun DPS',
  airborne: 'Airborne',
  dot_debuff: 'Damage over time',
  displacement: 'Displacement',
  stealth: 'Stealth',
  zone_denial: 'Zone denial',
  summon_pressure: 'Summons',
  melee_pressure: 'Melee pressure',
}

/** How decisively an item answers a tag. Feeds the ranking in E05. */
export const COUNTER_STRENGTHS = ['hard', 'soft', 'situational'] as const
export type CounterStrength = (typeof COUNTER_STRENGTHS)[number]

/** Multipliers for ranking. Ratios matter; absolute values do not. */
export const STRENGTH_WEIGHT: Record<CounterStrength, number> = {
  hard: 3,
  soft: 2,
  situational: 1,
}

/**
 * How much a threat hurts if unanswered, 1–3.
 *
 * This is an editorial judgement and the most arguable file in the repo — it
 * decides ranking order more than anything else. It is deliberately a single
 * table so the argument happens in one place rather than being smeared across
 * the engine. Change it and the ranking test in derive.test.ts will tell you
 * what moved.
 *
 * The reasoning: losing control of your character, or dying inside one
 * cooldown, ends the fight outright. Sustain and repositioning change how a
 * fight goes without deciding it. Chip damage and creep pressure are
 * annoyances you can play around.
 */
export const THREAT_SEVERITY: Record<ThreatTag, number> = {
  hard_cc: 3,
  channeled_ult: 3,
  burst_spirit: 3,
  high_dps_gun: 3,
  sustain: 2,
  displacement: 2,
  airborne: 2,
  stealth: 2,
  zone_denial: 2,
  dot_debuff: 1,
  summon_pressure: 1,
  melee_pressure: 1,
}

/**
 * Where an entry came from.
 *
 * `suggested` means derived mechanically from the game's own description text
 * and **not yet confirmed by someone who plays the matchup**. The UI must not
 * present a suggested entry as settled advice, and E06's review queue works
 * from this field.
 */
export const REVIEW_STATES = ['suggested', 'curated'] as const
export type ReviewState = (typeof REVIEW_STATES)[number]

/** One ability's threat profile. */
export interface AbilityThreats {
  /** Empty only when `untagged` is true. */
  tags: ThreatTag[]
  /**
   * Set when an ability genuinely presents no threat worth countering — a
   * mobility dash, a cosmetic passive. Explicit, so "nobody has looked at this
   * yet" and "there is nothing here" stay distinguishable.
   */
  untagged?: true
  review: ReviewState
  /** Free prose. Survives the scaffold round-trip; comments do not. */
  note?: string
}

/** One item's answer profile. */
export interface ItemCounters {
  /** Threat tags this item answers. Empty only when `untagged` is true. */
  answers: ThreatTag[]
  untagged?: true
  /** One line, shown next to the recommendation. Why this actually helps. */
  why: string
  strength: CounterStrength
  review: ReviewState
}

export const isThreatTag = (value: unknown): value is ThreatTag =>
  typeof value === 'string' && (THREAT_TAGS as readonly string[]).includes(value)
