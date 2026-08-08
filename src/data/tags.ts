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

/**
 * What each tag means at the table, in game terms.
 *
 * Curation is only as consistent as the vocabulary is shared. These live beside
 * the tags rather than in a doc nobody opens, and the curation page renders
 * them — a curator reading `zone_denial` should not have to guess whether a
 * slow field counts.
 *
 * Each says what the tag covers and what it does not, because the boundary is
 * where curation actually goes wrong: `hard_cc` collecting slows, or
 * `melee_pressure` collecting every ability that happens to be short-ranged.
 */
export const THREAT_TAG_MEANINGS: Record<ThreatTag, { covers: string; excludes: string }> = {
  hard_cc: {
    covers:
      'Stuns, silences, sleeps, roots and immobilises — anything that takes control of your character away entirely for a duration.',
    excludes:
      'Slows. A slow reduces your options; hard CC removes them. Move-speed answers belong nowhere near this tag.',
  },
  channeled_ult: {
    covers:
      'Ultimates that must be channelled to work, so interrupting one wastes the whole cooldown. The highest-value interrupt targets in the game.',
    excludes: 'Instant-cast ultimates, which nothing can interrupt after the fact.',
  },
  sustain: {
    covers:
      'Self-healing, lifesteal and regeneration that lets a hero win a fight of attrition or refuse to leave lane.',
    excludes: 'Shields and barriers, which absorb a burst rather than out-heal sustained damage.',
  },
  burst_spirit: {
    covers:
      'Spirit damage delivered in one window large enough to kill from a healthy bar. The reason spirit resist gets bought.',
    excludes: 'Spirit damage spread thin over time — that is `dot_debuff`.',
  },
  high_dps_gun: {
    covers:
      'Heroes whose damage comes primarily from sustained weapon fire rather than abilities. Bullet resist is the answer.',
    excludes: 'Burst weapon damage from a single ability proc.',
  },
  airborne: {
    covers:
      'Threats that launch you, or that punish you specifically while you are off the ground and cannot change direction.',
    excludes: 'Ground-level knockbacks — those are `displacement`.',
  },
  dot_debuff: {
    covers:
      'Damage over time, bleeds, poisons and lingering debuffs, including healing reduction that persists after the hit.',
    excludes: 'One-shot burst of any damage type.',
  },
  displacement: {
    covers:
      'Being pulled, pushed, knocked back or otherwise moved against your will — out of position rather than out of control.',
    excludes:
      'Being held in place. Immobilise is `hard_cc`; displacement is about being moved somewhere worse.',
  },
  stealth: {
    covers:
      'Invisibility and unseen approaches, where the problem is information rather than damage.',
    excludes: 'Fast flanks you can still see coming.',
  },
  zone_denial: {
    covers:
      'Persistent areas you cannot stand in — fields, walls and traps that take space away rather than damaging you directly.',
    excludes: 'Instantaneous area damage, which is burst that happens to hit several people.',
  },
  summon_pressure: {
    covers: 'Pets, turrets and summoned units that apply damage or map pressure independently.',
    excludes: 'Temporary clones or illusions used to reposition.',
  },
  melee_pressure: {
    covers:
      'Heroes that must close to melee range to threaten you, where the counter is keeping them off you.',
    excludes: 'Short-range abilities on heroes that are otherwise happy at range.',
  },
}

/**
 * When an item is worth buying — E16.
 *
 * Expressed in the overlay rather than hardcoded in the UI, so switching phase
 * changes the ranking rather than just the prose. Absent means "any phase".
 */
export const GAME_PHASES = ['lane', 'mid', 'late'] as const
export type GamePhase = (typeof GAME_PHASES)[number]

/**
 * Default phase from tier.
 *
 * Cost is a pure function of tier and souls accumulate over a match, so tier is
 * a genuine proxy for when an item comes online. It is a starting point, not a
 * judgement: a curator can override any entry, and a tier-4 item that is
 * situationally a lane pick should say so in the overlay.
 */
export const PHASES_FOR_TIER: Record<number, GamePhase[]> = {
  1: ['lane', 'mid'],
  2: ['lane', 'mid'],
  3: ['mid', 'late'],
  4: ['late'],
  5: ['late'],
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
 * The test to apply when judging strength, phrased as a question.
 *
 * Strength is the largest lever on ranking order, so the difference between
 * these three has to mean the same thing to everyone who curates. Stated as
 * "does buying this change the outcome" rather than "is this good", because
 * good-in-general is what produced a whole overlay sitting at the default.
 */
export const STRENGTH_MEANINGS: Record<CounterStrength, string> = {
  hard: 'Buying this neutralises the threat. The enemy has to change how they play, or the ability stops mattering — a cleanse against hard CC, an interrupt against a channelled ult.',
  soft: 'Buying this meaningfully reduces the threat without removing it. You still lose the exchange, but you survive it — resist against burst, healing reduction against sustain.',
  situational:
    'Buying this helps in some matchups or some phases, but is not the reason you win the fight. The honest default when an item only glances at the threat.',
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
  /**
   * Hand-written lines for specific enemies, keyed on hero `class_name`.
   *
   * The exception, not the rule. E34 derives a per-hero line for every pair
   * automatically; this overrides it where somebody has something better to
   * say. Anything here is shown to the user as editorial rather than derived.
   */
  heroNotes?: Record<string, string>
  /**
   * Prose about this entry itself — why a strength was chosen, what upstream
   * failed to provide. Distinct from `heroNotes`, which is per-enemy copy shown
   * to the user; this is for whoever reads the overlay next.
   *
   * Also a curation marker: the scaffold will not re-derive an entry carrying
   * one, because a note means somebody looked and decided.
   */
  note?: string
  /**
   * Phases this item is worth buying in. Omit to fall back to the tier default,
   * which is the honest state for anything nobody has judged yet.
   */
  phases?: GamePhase[]
}

export const isThreatTag = (value: unknown): value is ThreatTag =>
  typeof value === 'string' && (THREAT_TAGS as readonly string[]).includes(value)
