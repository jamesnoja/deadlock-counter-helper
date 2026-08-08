import { describe, expect, it } from 'vitest'
import { ABILITY_THREATS, ITEM_COUNTERS, itemsAnswering, overlayCoverage, threatsForHero } from './overlay.ts'
import { ABILITIES, HEROES, ITEMS } from './snapshot.ts'
import { COUNTER_STRENGTHS, REVIEW_STATES, isThreatTag } from './tags.ts'

/**
 * E04's acceptance criteria, as tests:
 *
 * - a typo in a tag fails the build (the union does that at typecheck; this
 *   also catches it at runtime, since the overlay is plain data),
 * - every ability is tagged or explicitly untagged,
 * - an entry referencing an unknown class_name fails CI.
 */

const abilityClassNames = new Set(ABILITIES.map((a) => a.class_name))
const itemClassNames = new Set(ITEMS.map((i) => i.class_name))

describe('overlay references resolve', () => {
  it('has no ability entry for a class_name outside the snapshot', () => {
    const unknown = Object.keys(ABILITY_THREATS).filter((name) => !abilityClassNames.has(name))
    expect(unknown).toEqual([])
  })

  it('has no item entry for a class_name outside the snapshot', () => {
    const unknown = Object.keys(ITEM_COUNTERS).filter((name) => !itemClassNames.has(name))
    expect(unknown).toEqual([])
  })

  it('covers every ability in the snapshot', () => {
    const missing = ABILITIES.filter((a) => !ABILITY_THREATS[a.class_name]).map((a) => a.class_name)
    expect(missing).toEqual([])
  })

  it('covers every item in the snapshot', () => {
    const missing = ITEMS.filter((i) => !ITEM_COUNTERS[i.class_name]).map((i) => i.class_name)
    expect(missing).toEqual([])
  })
})

describe('overlay entries are well formed', () => {
  it('uses only known threat tags', () => {
    const bad = [
      ...Object.entries(ABILITY_THREATS).flatMap(([name, entry]) =>
        entry.tags.filter((tag) => !isThreatTag(tag)).map((tag) => `${name}:${tag}`),
      ),
      ...Object.entries(ITEM_COUNTERS).flatMap(([name, entry]) =>
        entry.answers.filter((tag) => !isThreatTag(tag)).map((tag) => `${name}:${tag}`),
      ),
    ]
    expect(bad).toEqual([])
  })

  it('marks every empty entry as explicitly untagged', () => {
    // "Nobody has looked at this" and "there is nothing here" must stay distinct.
    const ambiguous = [
      ...Object.entries(ABILITY_THREATS)
        .filter(([, e]) => e.tags.length === 0 && !e.untagged)
        .map(([name]) => `ability:${name}`),
      ...Object.entries(ITEM_COUNTERS)
        .filter(([, e]) => e.answers.length === 0 && !e.untagged)
        .map(([name]) => `item:${name}`),
    ]
    expect(ambiguous).toEqual([])
  })

  it('never marks an entry untagged while it also carries tags', () => {
    const contradictory = [
      ...Object.entries(ABILITY_THREATS)
        .filter(([, e]) => e.untagged && e.tags.length > 0)
        .map(([name]) => `ability:${name}`),
      ...Object.entries(ITEM_COUNTERS)
        .filter(([, e]) => e.untagged && e.answers.length > 0)
        .map(([name]) => `item:${name}`),
    ]
    expect(contradictory).toEqual([])
  })

  it('uses known review states and counter strengths', () => {
    const badReview = [...Object.values(ABILITY_THREATS), ...Object.values(ITEM_COUNTERS)].filter(
      (e) => !(REVIEW_STATES as readonly string[]).includes(e.review),
    )
    const badStrength = Object.values(ITEM_COUNTERS).filter(
      (e) => !(COUNTER_STRENGTHS as readonly string[]).includes(e.strength),
    )
    expect({ badReview: badReview.length, badStrength: badStrength.length }).toEqual({
      badReview: 0,
      badStrength: 0,
    })
  })

  it('gives every tagged item a reason, since the UI shows it', () => {
    const missing = Object.entries(ITEM_COUNTERS)
      .filter(([, e]) => !e.untagged && !e.why.trim())
      .map(([name]) => name)
    expect(missing).toEqual([])
  })

  it('stores tags deduplicated and sorted, so diffs stay readable', () => {
    const unsorted = [
      ...Object.entries(ABILITY_THREATS).filter(
        ([, e]) => e.tags.join() !== [...new Set(e.tags)].sort().join(),
      ),
      ...Object.entries(ITEM_COUNTERS).filter(
        ([, e]) => e.answers.join() !== [...new Set(e.answers)].sort().join(),
      ),
    ].map(([name]) => name)
    expect(unsorted).toEqual([])
  })
})

describe('joins', () => {
  it('collects a hero’s threats across its abilities', () => {
    const hero = HEROES.find((h) => threatsForHero(h).length > 0)
    expect(hero).toBeDefined()
    const tags = threatsForHero(hero!)
    expect(tags.every(isThreatTag)).toBe(true)
    expect(tags).toEqual([...new Set(tags)].sort())
  })

  it('finds items answering a tag', () => {
    const answered = itemsAnswering(['hard_cc'])
    expect(answered.length).toBeGreaterThan(0)
    expect(answered.every((name) => itemClassNames.has(name))).toBe(true)
  })

  it('returns nothing for an empty tag list', () => {
    expect(itemsAnswering([])).toEqual([])
  })
})

describe('coverage', () => {
  /**
   * These are ratchets, not targets. They exist so curation cannot silently go
   * backwards — if a sync adds abilities nobody tags, this fails. Raise the
   * numbers as curation improves; never lower them without a reason in the PR.
   */
  const coverage = overlayCoverage()

  it('keeps ability tagging at or above its current level', () => {
    expect(coverage.abilities.tagged).toBeGreaterThanOrEqual(143)
  })

  it('keeps item tagging at or above its current level', () => {
    expect(coverage.items.tagged).toBeGreaterThanOrEqual(54)
  })

  it('leaves no hero invisible to the engine', () => {
    // A hero with no tagged ability is invisible to E05 — picking it would
    // return nothing. Now zero, after the drafting pass covered hero_mirage.
    // Held at zero: a new hero must be tagged before it ships.
    expect(coverage.heroesWithNoThreats).toEqual([])
  })

  it('reports how much is still machine-suggested rather than confirmed', () => {
    // Everything starts suggested. This documents the honest state of the data
    // rather than asserting a quality we have not earned yet.
    expect(coverage.abilities.suggested).toBeLessThanOrEqual(coverage.abilities.total)
    expect(coverage.items.suggested).toBeLessThanOrEqual(coverage.items.total)
  })
})
