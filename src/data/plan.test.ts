import { describe, expect, it } from 'vitest'
import { classify, counterPlan } from './plan.ts'
import type { SourcedCounter } from './sourced.ts'
import type { Item } from './schema.ts'

const item = (className: string): Item => ({
  class_name: className,
  name: className,
  slug: className,
  cost: 1000,
  tier: 2,
  category: 'vitality',
  ranked: true,
  is_active: false,
  description: '',
  icon: null,
  shop_icon: null,
  stats: {},
})

const counter = (className: string, coverage: string[]): SourcedCounter => ({
  item: item(className),
  score: coverage.length,
  coverage,
  perHero: [],
  groups: [],
})

describe('classify', () => {
  /** Core answers more than half the lineup; flexible answers fewer. */
  it('calls a majority answer core', () => {
    expect(classify(counter('a', ['h1', 'h2', 'h3', 'h4']), 6)).toBe('core')
  })

  it('calls exactly half flexible, not core', () => {
    // "More than half" — three of six is not a majority.
    expect(classify(counter('a', ['h1', 'h2', 'h3']), 6)).toBe('flexible')
  })

  it('calls a narrow answer flexible', () => {
    expect(classify(counter('a', ['h1']), 6)).toBe('flexible')
  })

  it('treats a single-enemy lineup sensibly', () => {
    expect(classify(counter('a', ['h1']), 1)).toBe('core')
  })
})

describe('counterPlan', () => {
  const counters = [
    counter('broad', ['h1', 'h2', 'h3', 'h4']),
    counter('narrow', ['h1']),
    counter('mid', ['h1', 'h2']),
    counter('extra', ['h3']),
  ]

  it('takes the top few in engine order, never re-ranking', () => {
    // A lens on the shortlist, not a second opinion about it.
    expect(counterPlan(counters, 6).map((entry) => entry.counter.item.class_name)).toEqual([
      'broad',
      'narrow',
      'mid',
    ])
  })

  it('labels each entry', () => {
    expect(counterPlan(counters, 6).map((entry) => entry.tier)).toEqual([
      'core',
      'flexible',
      'flexible',
    ])
  })

  it('returns nothing when no enemies are selected', () => {
    expect(counterPlan(counters, 0)).toEqual([])
  })

  it('copes with fewer counters than plan slots', () => {
    expect(counterPlan([counters[0]!], 6)).toHaveLength(1)
  })
})
