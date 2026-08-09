/**
 * Published counter advice — the model for Layer B's replacement.
 *
 * Sourced from deadlockitembuilder.com's counter-item helper, which publishes
 * hand-written per-hero counter guidance. Where the tag overlay derived what an
 * item answers from the game's own text, this is someone's judgement about the
 * matchup — reasons, lane advice and situational triggers that no derivation
 * produces.
 *
 * **Everything here is keyed on `class_name`, not display name.** The source
 * keys on English names, and two of its 46 items had already drifted from the
 * current snapshot before we imported it (`Curse` and `Superior Stamina` are
 * now Cursed Relic and Stamina Mastery). Resolving at import means a future
 * rename fails `npm run sync:counters` with a list, rather than silently
 * dropping the top counter for fourteen heroes.
 */

/** One of the source's nine answer-side groupings. Its own key, kept verbatim. */
export interface CounterGroup {
  key: string
  name: string
  desc: string
  /** Resolved to `class_name`. */
  items: string[]
}

/** A matchup the source calls out, with the item it says answers it. */
export interface CounterSituation {
  label: string
  /** Resolved to `class_name`. */
  priorityItem: string
  reason: string
}

export interface HeroCounters {
  /** Our `class_name`, resolved from the source's display name. */
  hero: string
  /** Group keys, in the source's order. */
  groups: string[]
  /** Resolved to `class_name`, in the source's order — position carries their ranking. */
  topCounters: string[]
  summary: string
  lanePhase: string[]
  situations: CounterSituation[]
}

/** The source's own note on what an item does and why it answers things. */
export interface ItemNote {
  /** Our `class_name`. */
  item: string
  description: string
  why: string[]
}

/**
 * Where this came from, and when.
 *
 * The source is a third party publishing on its own cadence, so "when did we
 * last pull this" is not a footnote — if they stop updating, we stop being
 * right and nothing in our own pipeline notices. The UI shows this.
 */
export interface PublishedMeta {
  source_url: string
  source_name: string
  retrieved_at: string
  counts: { heroes: number; items: number; groups: number }
  /**
   * Display names we had to map by hand, and what we mapped them to.
   *
   * Recorded rather than applied invisibly: each one is a judgement that could
   * be wrong, and a reader should be able to check it.
   */
  aliases: { from: string; to: string; kind: 'hero' | 'item'; evidence: string }[]
  /**
   * References the source makes that are not items at all, and what we did.
   *
   * Distinct from a rename: there is nothing to resolve to. Dropping them is
   * the only honest option, but dropping them quietly would make the source
   * look cleaner than it is, and these lists come out one entry short.
   */
  dropped: { name: string; kind: 'hero' | 'item'; reason: string; affected: string[] }[]
}

export interface PublishedCounters {
  meta: PublishedMeta
  groups: CounterGroup[]
  heroes: HeroCounters[]
  items: ItemNote[]
}
