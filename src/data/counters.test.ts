import { describe, expect, it } from 'vitest'
import { planForTeam } from './counters.ts'
import { HEROES } from './snapshot.ts'
import { RANKED_MAX_COST } from './schema.ts'

/**
 * Integration: the engine bound to the real snapshot and overlay.
 *
 * sourced.test.ts proves the ranking against the data. This proves the wiring —
 * that enemy class_names resolve and the committed data flows through. Kept
 * shape-level, so a refreshed import does not become a test failure.
 */

const someHeroes = (count: number) => HEROES.slice(0, count).map((hero) => hero.class_name)

describe('planForTeam', () => {
  it('returns nothing for an empty team', () => {
    expect(planForTeam([]).counters).toEqual([])
  })

  it('ignores hero names that are not in the snapshot', () => {
    expect(planForTeam(['hero_does_not_exist']).counters).toEqual([])
  })

  it('recommends something for a real six-hero team', () => {
    const result = planForTeam(someHeroes(6)).counters
    expect(result.length).toBeGreaterThan(0)
    expect(result[0]?.coverage.length).toBeGreaterThan(0)
    expect(result[0]?.perHero.length).toBeGreaterThan(0)
  })

  it('answers every hero in the snapshot individually', () => {
    // A hero nobody can counter is a dead end in the UI. If the source drops a
    // hero on a refresh, this fails rather than the page rendering empty.
    const unanswered = HEROES.filter((hero) => planForTeam([hero.class_name]).counters.length === 0).map(
      (hero) => hero.name,
    )
    expect(unanswered).toEqual([])
  })

  it('is stable across calls', () => {
    const team = someHeroes(4)
    expect(planForTeam(team).counters).toEqual(planForTeam(team).counters)
  })

  it('ranks in descending score with no ties out of order', () => {
    const result = planForTeam(someHeroes(6)).counters
    const scores = result.map((counter) => counter.score)
    expect(scores).toEqual([...scores].sort((a, b) => b - a))
  })

  it('never reports coverage for a hero that was not selected', () => {
    const team = someHeroes(3)
    const selected = new Set(team)
    const strays = planForTeam(team).counters.flatMap((counter) =>
      counter.coverage.filter((className) => !selected.has(className)),
    )
    expect(strays).toEqual([])
  })

  it('never recommends an item ranked play cannot buy', () => {
    // Recommending an unbuyable item is worse than recommending nothing — the
    // user goes looking for it mid-match and it is not in the shop.
    const unbuyable = planForTeam(someHeroes(6)).counters.filter((counter) => !counter.item.ranked)
    expect(unbuyable.map((counter) => counter.item.name)).toEqual([])
  })

  it('keeps every recommendation within the ranked cost ceiling', () => {
    const tooExpensive = planForTeam(someHeroes(6)).counters
      .filter((counter) => counter.item.cost > RANKED_MAX_COST)
      .map((counter) => `${counter.item.name} (${counter.item.cost})`)
    expect(tooExpensive).toEqual([])
  })

})
