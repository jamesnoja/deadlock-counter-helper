import { describe, expect, it } from 'vitest'
import { planCounters } from './sourced.ts'
import { HERO_COUNTERS, counterFor } from './published.ts'
import { HEROES, RANKED_ITEMS } from './snapshot.ts'
import type { Hero } from './schema.ts'

/**
 * The behaviour that justifies a team-wide tool: an item several enemies want
 * should outrank one that is first choice against a single hero. Everything
 * else here guards the edges around that.
 */

const heroByClassName = new Map(HEROES.map((hero) => [hero.class_name, hero]))
const hero = (className: string): Hero => {
  const found = heroByClassName.get(className)
  if (!found) throw new Error(`test fixture references a hero not in the snapshot: ${className}`)
  return found
}

/** Three heroes that share a published counter, found from the data rather than hardcoded. */
function heroesSharing(): { shared: string; heroes: string[] } {
  const counts = new Map<string, string[]>()
  for (const entry of HERO_COUNTERS) {
    for (const item of entry.topCounters) {
      counts.set(item, [...(counts.get(item) ?? []), entry.hero])
    }
  }
  const [shared, heroes] = [...counts].sort((a, b) => b[1].length - a[1].length)[0]!
  return { shared, heroes: heroes.slice(0, 3) }
}

describe('planCounters weights breadth above single-hero fit', () => {
  it('puts an item several enemies want above one only a single enemy wants', () => {
    const { shared, heroes } = heroesSharing()
    const plan = planCounters(heroes.map(hero))

    const sharedCounter = plan.counters.find((counter) => counter.item.class_name === shared)
    expect(sharedCounter).toBeDefined()
    expect(sharedCounter!.coverage.length).toBe(heroes.length)

    const singles = plan.counters.filter((counter) => counter.coverage.length === 1)
    for (const single of singles) {
      expect(sharedCounter!.score).toBeGreaterThan(single.score)
    }
  })

  it('ranks by the source’s own ordering when two items are wanted equally', () => {
    const entry = HERO_COUNTERS[0]!
    const plan = planCounters([hero(entry.hero)])
    const positions = plan.counters
      .filter((counter) => counter.perHero[0]?.rank !== null)
      .map((counter) => counter.perHero[0]!.rank!)

    // One hero selected, so score is position weight alone: the published order survives.
    expect([...positions].sort((a, b) => a - b)).toEqual(positions)
  })

  it('lifts an item the source names as the answer to a specific situation', () => {
    const entry = HERO_COUNTERS.find((candidate) =>
      candidate.situations.some((situation) => candidate.topCounters.includes(situation.priorityItem)),
    )!
    const situation = entry.situations.find((candidate) =>
      entry.topCounters.includes(candidate.priorityItem),
    )!
    const plan = planCounters([hero(entry.hero)])

    const lifted = plan.counters.find((counter) => counter.item.class_name === situation.priorityItem)!
    const rank = lifted.perHero[0]!.rank!
    const positionAlone = (entry.topCounters.length - (rank - 1)) / entry.topCounters.length
    expect(lifted.score).toBeGreaterThan(positionAlone)
    expect(lifted.perHero[0]!.situations.length).toBeGreaterThan(0)
  })
})

describe('planCounters keeps the result usable by the UI', () => {
  const entry = HERO_COUNTERS[0]!

  it('returns one perHero entry per selected enemy, in selection order', () => {
    const picked = HERO_COUNTERS.slice(0, 3).map((candidate) => candidate.hero)
    const plan = planCounters(picked.map(hero))
    for (const counter of plan.counters) {
      expect(counter.perHero.map((effect) => effect.hero)).toEqual(picked)
    }
  })

  it('includes enemies an item does nothing about, at zero weight', () => {
    const picked = HERO_COUNTERS.slice(0, 4).map((candidate) => candidate.hero)
    const plan = planCounters(picked.map(hero))
    const partial = plan.counters.find((counter) => counter.coverage.length < picked.length)
    expect(partial).toBeDefined()
    const idle = partial!.perHero.filter((effect) => !partial!.coverage.includes(effect.hero))
    expect(idle.length).toBeGreaterThan(0)
    for (const effect of idle) {
      expect(effect.weight).toBe(0)
      expect(effect.rank).toBeNull()
      expect(effect.situations).toEqual([])
    }
  })

  it('recommends only items ranked play can buy', () => {
    const buyable = new Set(RANKED_ITEMS.map((item) => item.class_name))
    const plan = planCounters(HERO_COUNTERS.slice(0, 6).map((candidate) => hero(candidate.hero)))
    for (const counter of plan.counters) {
      expect(buyable.has(counter.item.class_name)).toBe(true)
    }
  })

  it('carries the per-hero editorial that motivated the rework', () => {
    const plan = planCounters([hero(entry.hero)])
    expect(plan.heroes).toHaveLength(1)
    expect(plan.heroes[0]!.summary).toBe(counterFor(entry.hero)!.summary)
    expect(plan.heroes[0]!.lanePhase.length).toBeGreaterThan(0)
  })

  it('attributes every result to its source', () => {
    const plan = planCounters([hero(entry.hero)])
    expect(plan.source.source_url).toMatch(/^https:\/\//)
    expect(plan.source.retrieved_at).toBeTruthy()
  })
})

describe('planCounters is honest about what it does not know', () => {
  it('returns nothing at all for no selection', () => {
    const plan = planCounters([])
    expect(plan.counters).toEqual([])
    expect(plan.heroes).toEqual([])
    expect(plan.unavailable).toEqual([])
  })

  it('names an unwritten hero rather than dropping it', () => {
    // "No advice published for this hero" and "nothing counters this hero" are
    // different claims. Conflating them is the failure mode of dropping
    // derivation, so it is asserted rather than assumed.
    const unwritten = { ...hero(HERO_COUNTERS[0]!.hero), class_name: 'hero_not_published' }
    const plan = planCounters([unwritten])
    expect(plan.unavailable).toEqual(['hero_not_published'])
    expect(plan.counters).toEqual([])
    expect(plan.heroes).toEqual([])
  })

  it('still advises on the heroes it does know when one is unwritten', () => {
    const known = hero(HERO_COUNTERS[0]!.hero)
    const unwritten = { ...known, class_name: 'hero_not_published' }
    const plan = planCounters([known, unwritten])

    expect(plan.unavailable).toEqual(['hero_not_published'])
    expect(plan.counters.length).toBeGreaterThan(0)
    expect(plan.heroes).toHaveLength(1)
    // The unwritten hero still gets a column, so the matrix does not misalign.
    expect(plan.counters[0]!.perHero.map((effect) => effect.hero)).toEqual([
      known.class_name,
      'hero_not_published',
    ])
  })

  it('is stable: the same selection produces the same order', () => {
    const picked = HERO_COUNTERS.slice(0, 5).map((candidate) => hero(candidate.hero))
    const first = planCounters(picked).counters.map((counter) => counter.item.class_name)
    const second = planCounters(picked).counters.map((counter) => counter.item.class_name)
    expect(first).toEqual(second)
  })
})

describe('the ranking is weighted breadth, not raw breadth', () => {
  it('can rank a strongly-wanted item above a more widely but weakly wanted one', () => {
    // Documents the surprise rather than asserting it never happens: a UI
    // showing "4 of 6" below "2 of 6" is correct, and someone reading the list
    // will assume it is a bug unless this is written down somewhere.
    const picked = HERO_COUNTERS.slice(0, 6).map((candidate) => hero(candidate.hero))
    const counters = planCounters(picked).counters

    const inversions = counters.filter((counter, index) =>
      counters.slice(index + 1).some((later) => later.coverage.length > counter.coverage.length),
    )
    expect(inversions.length).toBeGreaterThan(0)
  })

  it('never lets a single hero contribute more than one full point of position weight', () => {
    // The property that keeps breadth dominant in the normal case. If one hero
    // could contribute more, a single strong match would outrank a whole team.
    const picked = HERO_COUNTERS.slice(0, 4).map((candidate) => hero(candidate.hero))
    for (const counter of planCounters(picked).counters) {
      for (const effect of counter.perHero) {
        // Position weight is capped at 1; only a named situation can push past it.
        const fromSituations = effect.situations.length * 0.5
        expect(effect.weight - fromSituations).toBeLessThanOrEqual(1.000001)
      }
    }
  })
})
