import { describe, expect, it } from 'vitest'
import { countersForTeam } from './counters.ts'
import { HEROES } from './snapshot.ts'
import { RANKED_MAX_COST } from './schema.ts'

/**
 * Integration: the engine bound to the real snapshot and overlay.
 *
 * derive.test.ts proves the logic against fixtures. This proves the wiring —
 * that the committed data actually flows through it and produces something.
 * Assertions stay shape-level, because tying them to specific items would make
 * every curation edit a test failure.
 */

const someHeroes = (count: number) => HEROES.slice(0, count).map((hero) => hero.class_name)

describe('countersForTeam', () => {
  it('returns nothing for an empty team', () => {
    expect(countersForTeam([])).toEqual([])
  })

  it('ignores hero names that are not in the snapshot', () => {
    expect(countersForTeam(['hero_does_not_exist'])).toEqual([])
  })

  it('recommends something for a real six-hero team', () => {
    const result = countersForTeam(someHeroes(6))
    expect(result.length).toBeGreaterThan(0)
    expect(result[0]?.coverage.length).toBeGreaterThan(0)
    expect(result[0]?.why).not.toBe('')
  })

  it('answers every hero in the snapshot individually', () => {
    // A hero nobody can counter is a dead end in the UI. Coverage regressions
    // in the overlay show up here rather than as an empty page.
    const unanswered = HEROES.filter((hero) => countersForTeam([hero.class_name]).length === 0).map(
      (hero) => hero.name,
    )
    expect(unanswered).toEqual([])
  })

  it('is stable across calls', () => {
    const team = someHeroes(4)
    expect(countersForTeam(team)).toEqual(countersForTeam(team))
  })

  it('ranks in descending score with no ties out of order', () => {
    const result = countersForTeam(someHeroes(6))
    const scores = result.map((counter) => counter.score)
    expect(scores).toEqual([...scores].sort((a, b) => b - a))
  })

  it('never reports coverage for a hero that was not selected', () => {
    const team = someHeroes(3)
    const selected = new Set(team)
    const strays = countersForTeam(team).flatMap((counter) =>
      counter.coverage.filter((className) => !selected.has(className)),
    )
    expect(strays).toEqual([])
  })

  it('never recommends an item ranked play cannot buy', () => {
    // Recommending an unbuyable item is worse than recommending nothing — the
    // user goes looking for it mid-match and it is not in the shop.
    const unbuyable = countersForTeam(someHeroes(6)).filter((counter) => !counter.item.ranked)
    expect(unbuyable.map((counter) => counter.item.name)).toEqual([])
  })

  it('keeps every recommendation within the ranked cost ceiling', () => {
    const tooExpensive = countersForTeam(someHeroes(6))
      .filter((counter) => counter.item.cost > RANKED_MAX_COST)
      .map((counter) => `${counter.item.name} (${counter.item.cost})`)
    expect(tooExpensive).toEqual([])
  })

  it('marks everything derived while the overrides file is empty', () => {
    const editorial = countersForTeam(someHeroes(6)).filter((c) => c.source === 'editorial')
    expect(editorial).toEqual([])
  })
})
