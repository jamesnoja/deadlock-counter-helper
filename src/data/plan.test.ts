import { describe, expect, it } from 'vitest'
import { classify, counterPlan } from './plan.ts'
import { explainPair } from './explain.ts'
import type { HeroEffect, RankedCounter } from './derive.ts'
import type { Item } from './schema.ts'
import type { ItemCounters } from './tags.ts'

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

const counter = (className: string, coverage: string[]): RankedCounter => ({
  item: item(className),
  score: coverage.length,
  coverage,
  matches: [],
  perHero: [],
  strength: 'hard',
  why: 'because',
  source: 'derived',
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

describe('explainPair', () => {
  const abilityName = (className: string) =>
    ({ a_shot: 'Charged Shot', a_trap: 'Immobilize Trap' })[className]

  const effect = (overrides: Partial<HeroEffect> = {}): HeroEffect => ({
    hero: 'hero_orion',
    strength: 'strong',
    tags: ['high_dps_gun'],
    abilities: ['a_shot'],
    ...overrides,
  })

  it('names the specific ability and the threat', () => {
    expect(explainPair(effect(), 'Grey Talon', abilityName).text).toBe(
      "Answers Grey Talon's Charged Shot — Gun DPS.",
    )
  })

  it('lists several abilities readably', () => {
    const text = explainPair(
      effect({ abilities: ['a_shot', 'a_trap'] }),
      'Grey Talon',
      abilityName,
    ).text
    expect(text).toBe("Answers Grey Talon's Charged Shot and Immobilize Trap — Gun DPS.")
  })

  it('falls back to the threat when an ability cannot be named', () => {
    expect(explainPair(effect({ abilities: ['unknown'] }), 'Grey Talon', abilityName).text).toBe(
      "Answers Grey Talon's gun dps.",
    )
  })

  it('says plainly when the item does nothing', () => {
    // Silence would read as a missing explanation rather than a deliberate no.
    expect(
      explainPair(effect({ strength: 'none', tags: [], abilities: [] }), 'Abrams', abilityName).text,
    ).toBe('Does nothing about Abrams.')
  })

  it('prefers an authored line and marks it editorial', () => {
    const entry: ItemCounters = {
      answers: ['high_dps_gun'],
      why: 'w',
      strength: 'hard',
      review: 'curated',
      notes: { hero_orion: 'Pins him down before the shot goes off.' },
    }
    const result = explainPair(effect(), 'Grey Talon', abilityName, entry)
    expect(result).toEqual({ text: 'Pins him down before the shot goes off.', editorial: true })
  })

  it('ignores an authored line for a different hero', () => {
    const entry: ItemCounters = {
      answers: ['high_dps_gun'],
      why: 'w',
      strength: 'hard',
      review: 'curated',
      notes: { hero_someone_else: 'Irrelevant.' },
    }
    expect(explainPair(effect(), 'Grey Talon', abilityName, entry).editorial).toBe(false)
  })
})
