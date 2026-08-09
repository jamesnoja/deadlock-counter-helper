/**
 * The committed published-counter data, keyed for lookup.
 *
 * Reads the committed file, never the network — `npm run sync:counters` is the
 * only thing that talks to the source, same contract as the snapshot.
 *
 * Stage 1 of the rework: this loads and indexes the data. Nothing consumes it
 * yet; the engine still runs on the tag overlay until Stage 2 replaces it.
 */

import published from '../../data/counters/published.json' with { type: 'json' }
import gaps from '../../data/counters/acknowledged-gaps.json' with { type: 'json' }

import { HEROES } from './snapshot.ts'
import type { CounterGroup, HeroCounters, ItemNote, PublishedCounters } from './published-schema.ts'

/** JSON imports widen to structural types; `published.test.ts` is what actually validates this. */
const DATA = published as unknown as PublishedCounters

export const PUBLISHED_META = DATA.meta
export const COUNTER_GROUPS = DATA.groups
export const HERO_COUNTERS = DATA.heroes
export const ITEM_NOTES = DATA.items

const heroIndex = new Map(HERO_COUNTERS.map((entry) => [entry.hero, entry]))
const itemIndex = new Map(ITEM_NOTES.map((entry) => [entry.item, entry]))
const groupIndex = new Map(COUNTER_GROUPS.map((group) => [group.key, group]))

export const counterFor = (heroClassName: string): HeroCounters | undefined =>
  heroIndex.get(heroClassName)

export const noteFor = (itemClassName: string): ItemNote | undefined => itemIndex.get(itemClassName)

export const groupFor = (key: string): CounterGroup | undefined => groupIndex.get(key)

/**
 * Heroes the source has not written up.
 *
 * Empty today, and it will not stay that way — the source publishes on its own
 * cadence, so the next hero Valve ships arrives here with no advice at all.
 * This is the cost of replacing derivation, and the UI has to say so rather
 * than render an empty list that reads as "nothing counters them".
 */
export const heroesWithoutCounters = (): string[] =>
  HEROES.filter((hero) => !heroIndex.has(hero.class_name))
    .map((hero) => hero.class_name)
    .sort()

/**
 * Gaps somebody has consciously accepted.
 *
 * Hand-edited, never written by a sync. Adding a hero here is a commit with a
 * reviewer, which is the point.
 */
export const ACKNOWLEDGED_GAPS: string[] = (gaps as { heroes: string[] }).heroes

/**
 * Gaps nobody has looked at yet.
 *
 * The distinction matters because of how it fails. Asserting "no hero is
 * uncovered" would put CI red the day Valve ships a hero and keep it red until
 * a third party got round to writing them up — a red build nobody can fix is a
 * red build everybody learns to ignore.
 *
 * Asserting this instead means the build fails once, loudly, and is fixed by a
 * one-line commit saying "yes, we know". The hero still shows its empty state
 * in the UI until the advice arrives.
 */
export const unacknowledgedGaps = (): string[] =>
  heroesWithoutCounters().filter((className) => !ACKNOWLEDGED_GAPS.includes(className))
