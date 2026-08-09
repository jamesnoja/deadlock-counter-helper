/**
 * Ranking over the published counter data — Layer C's replacement.
 *
 * Where `derive.ts` computed what an item answers from ability tags, this ranks
 * what someone has already published. The engine's whole job becomes combining
 * per-hero advice into team advice: the source says what counters each hero
 * individually, and the question a player actually has is what to buy against
 * all six at once.
 *
 * **This does not return `RankedCounter`.** That shape carries `tag`,
 * `abilities` and a per-item `strength` — all facts derivation produced and the
 * source does not have. Reusing it would mean inventing values to fill fields,
 * so the result type here says only what the source actually said.
 */

import { RANKED_ITEMS } from './snapshot.ts'
import { COUNTER_GROUPS, PUBLISHED_META, counterFor, noteFor } from './published.ts'
import type { Hero, Item } from './schema.ts'
import type { CounterSituation, ItemNote, PublishedMeta } from './published-schema.ts'

/** What one selected enemy contributes to an item's case. */
export interface SourcedHeroEffect {
  /** Enemy hero `class_name`. */
  hero: string
  /** 1-based position in that hero's published list, or null if it only appears via a situation. */
  rank: number | null
  /** Situations where the source names this item as the priority answer. */
  situations: CounterSituation[]
  /** This hero's share of the item's score, so the UI can explain the ranking. */
  weight: number
}

export interface SourcedCounter {
  item: Item
  /** Higher is better. Comparable only within one result set. */
  score: number
  /** Enemy `class_name`s this item answers at all — the "5 of 6". */
  coverage: string[]
  /**
   * One entry per **selected** enemy, in selection order, including those this
   * item does nothing about. A fixed column per row is what lets the coverage
   * matrix render without holes.
   */
  perHero: SourcedHeroEffect[]
  /** The source's own description and why-bullets, when it wrote one. */
  note?: ItemNote
  /** Group keys this item belongs to, for grouping the shortlist. */
  groups: string[]
}

/** The per-hero editorial the tag model could never produce. */
export interface HeroPlan {
  hero: string
  summary: string
  lanePhase: string[]
  situations: CounterSituation[]
  groups: string[]
}

export interface CounterPlan {
  counters: SourcedCounter[]
  heroes: HeroPlan[]
  /**
   * Selected heroes the source has not written up.
   *
   * Never silently omitted. Replacing derivation means a new hero returns
   * nothing, and "we have no advice for Hero X" is different information from
   * "nothing counters Hero X" — the UI has to be able to tell them apart.
   */
  unavailable: string[]
  /** Where the advice came from and when, for attribution and staleness. */
  source: PublishedMeta
}

/**
 * A hero's published list is ordered, so position is their ranking.
 *
 * Normalised by list length so heroes with longer lists do not dominate purely
 * by being written up in more detail. First place scores 1, last scores just
 * above 0.
 */
const rankWeight = (index: number, length: number) => (length - index) / length

/**
 * Extra weight for an item the source names as the answer to a named situation.
 *
 * "He is healing through all your damage → Spirit Burn" is their strongest
 * signal — a specific problem with a specific answer, rather than a place in a
 * list. Additive rather than multiplicative so it lifts an item without letting
 * one situation outrank being wanted by the whole enemy team.
 */
const SITUATION_BONUS = 0.5

/**
 * Rank items against a set of enemies, using only what the source published.
 *
 * Score is the sum of each selected hero's weight for that item. Since one
 * hero contributes at most 1, breadth usually wins — but not always, and that
 * is deliberate: being the first answer against two enemies beats being the
 * ninth against four. Against a full team `Indomitable` scores 9.0 at 6/6
 * coverage while `Reactive Barrier` sits below items covering fewer heroes,
 * because every hero that wants it wants it last.
 *
 * The consequence to know: coverage alone does not order this list, so a UI
 * showing "4 of 6" beside a lower rank than "2 of 6" is correct and needs to
 * explain itself rather than look broken.
 *
 * Groups are deliberately **not** scored. They describe what kind of answer a
 * hero needs, and treating group membership as a recommendation would invent
 * per-hero rankings the source never gave.
 */
export function planCounters(heroes: readonly Hero[]): CounterPlan {
  const selected = heroes.map((hero) => hero.class_name)
  const groupsByItem = new Map<string, string[]>()
  for (const group of COUNTER_GROUPS) {
    for (const item of group.items) {
      groupsByItem.set(item, [...(groupsByItem.get(item) ?? []), group.key])
    }
  }

  const entries = heroes.map((hero) => ({ hero: hero.class_name, published: counterFor(hero.class_name) }))
  const unavailable = entries.filter((entry) => !entry.published).map((entry) => entry.hero)

  /** Per item, what each selected hero contributes. Missing means this hero does not want it. */
  const effects = new Map<string, Map<string, SourcedHeroEffect>>()
  const record = (item: string, effect: SourcedHeroEffect) => {
    const perItem = effects.get(item) ?? new Map<string, SourcedHeroEffect>()
    const existing = perItem.get(effect.hero)
    perItem.set(effect.hero, {
      hero: effect.hero,
      rank: effect.rank ?? existing?.rank ?? null,
      situations: [...(existing?.situations ?? []), ...effect.situations],
      weight: (existing?.weight ?? 0) + effect.weight,
    })
    effects.set(item, perItem)
  }

  for (const { hero, published } of entries) {
    if (!published) continue

    published.topCounters.forEach((item, index) => {
      record(item, {
        hero,
        rank: index + 1,
        situations: [],
        weight: rankWeight(index, published.topCounters.length),
      })
    })

    for (const situation of published.situations) {
      record(situation.priorityItem, {
        hero,
        rank: null,
        situations: [situation],
        weight: SITUATION_BONUS,
      })
    }
  }

  const itemsByClassName = new Map(RANKED_ITEMS.map((item) => [item.class_name, item]))

  const counters: SourcedCounter[] = [...effects]
    .flatMap(([className, perHero]) => {
      const item = itemsByClassName.get(className)
      // Unbuyable in ranked, or gone from the snapshot entirely. published.test.ts
      // asserts this never happens today; skipping keeps a bad sync from crashing
      // the page rather than silently recommending something nobody can buy.
      if (!item) return []

      return [
        {
          item,
          score: [...perHero.values()].reduce((total, effect) => total + effect.weight, 0),
          coverage: selected.filter((hero) => perHero.has(hero)),
          perHero: selected.map(
            (hero) => perHero.get(hero) ?? { hero, rank: null, situations: [], weight: 0 },
          ),
          note: noteFor(className),
          groups: groupsByItem.get(className) ?? [],
        },
      ]
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.coverage.length - a.coverage.length ||
        a.item.cost - b.item.cost ||
        a.item.name.localeCompare(b.item.name),
    )

  return {
    counters,
    heroes: entries.flatMap(({ hero, published }) =>
      published
        ? [
            {
              hero,
              summary: published.summary,
              lanePhase: published.lanePhase,
              situations: published.situations,
              groups: published.groups,
            },
          ]
        : [],
    ),
    unavailable,
    source: PUBLISHED_META,
  }
}

/**
 * How decisively an item answers one specific enemy, for display.
 *
 * The old engine computed this from tag severity and a curated strength. The
 * source publishes neither — what it publishes is an *ordering*, so this is a
 * presentation of that ordering rather than a new judgement. Bands are thirds
 * of a list, which for the source's eight-to-nine-item lists means roughly
 * top three / middle three / rest.
 *
 * Kept in the data layer so the four components that show it cannot drift into
 * three different opinions about what "strong" means.
 */
export type PairStrength = 'strong' | 'moderate' | 'situational' | 'none'

export function pairStrength(effect: SourcedHeroEffect): PairStrength {
  if (effect.weight === 0) return 'none'
  // A named situation is the source's most specific claim: this exact item, for
  // this exact problem. It outranks a list position whatever the position was.
  if (effect.situations.length > 0) return 'strong'
  if (effect.rank === null) return 'situational'
  if (effect.rank <= 3) return 'strong'
  if (effect.rank <= 6) return 'moderate'
  return 'situational'
}

/**
 * The one-line justification shown beside an item.
 *
 * Prefers the source's reason for a specific situation, then its general note
 * on the item, and says plainly when it has neither rather than inventing a
 * sentence. The old engine always had a `why` because the overlay required one;
 * this one can genuinely be empty.
 */
export function reasonFor(counter: SourcedCounter): string {
  const situation = counter.perHero.flatMap((effect) => effect.situations)[0]
  if (situation) return situation.reason
  return counter.note?.description ?? ''
}
