import { describe, expect, it } from 'vitest'
import { filterByPhase, phasesFor, splitByBudget, weightForRole } from './context.ts'
import { buildByCategory, opportunityCost } from './build.ts'
import { formatForChat } from './export.ts'
import type { RankedCounter } from './derive.ts'
import type { Hero, Item, ItemCategory } from './schema.ts'
import type { ItemCounters } from './tags.ts'

const item = (className: string, over: Partial<Item> = {}): Item => ({
  class_name: className,
  name: className,
  slug: className,
  cost: 1600,
  tier: 2,
  category: 'vitality',
  ranked: true,
  is_active: false,
  description: '',
  icon: null,
  shop_icon: null,
  stats: {},
  ...over,
})

const counter = (className: string, over: Partial<Item> = {}, coverage = ['h1']): RankedCounter => ({
  item: item(className, over),
  score: coverage.length,
  coverage,
  matches: [],
  perHero: [],
  strength: 'hard',
  why: 'because',
  source: 'derived',
})

const hero = (name: string): Hero => ({
  class_name: `hero_${name}`,
  name,
  role: 'brawler',
  slug: name,
  aliases: [],
  images: { card: null, portrait: null, minimap: null },
  abilities: [],
})

describe('splitByBudget', () => {
  const counters = [
    counter('cheap', { cost: 800, tier: 1 }),
    counter('mid', { cost: 3200, tier: 3 }),
    counter('dear', { cost: 6400, tier: 4 }),
    counter('dear2', { cost: 6400, tier: 4 }),
  ]

  it('returns everything when there is no budget', () => {
    expect(splitByBudget(counters, null).affordable).toHaveLength(4)
    expect(splitByBudget(counters, null).outOfReach).toEqual([])
  })

  it('keeps what you can afford', () => {
    expect(splitByBudget(counters, 3200).affordable.map((c) => c.item.class_name)).toEqual([
      'cheap',
      'mid',
    ])
  })

  it('surfaces only the next rung up, not everything unaffordable', () => {
    // "Just out of reach" is for planning the next back; listing every
    // expensive item would just be the unfiltered list again.
    const split = splitByBudget([...counters, counter('vast', { cost: 9999, tier: 5 })], 3200)
    expect(split.outOfReach.map((c) => c.item.class_name)).toEqual(['dear', 'dear2'])
  })

  it('has nothing out of reach when everything is affordable', () => {
    expect(splitByBudget(counters, 99999).outOfReach).toEqual([])
  })

  it('copes with a budget below everything', () => {
    const split = splitByBudget(counters, 0)
    expect(split.affordable).toEqual([])
    expect(split.outOfReach.map((c) => c.item.class_name)).toEqual(['cheap'])
  })
})

describe('phases', () => {
  const entryFor = (className: string): ItemCounters | undefined =>
    className === 'authored'
      ? { answers: [], why: '', strength: 'hard', review: 'curated', phases: ['lane'] }
      : undefined

  it('defaults from tier when the overlay says nothing', () => {
    expect(phasesFor(counter('a', { tier: 1 }))).toEqual(['lane', 'mid'])
    expect(phasesFor(counter('a', { tier: 4 }))).toEqual(['late'])
  })

  it('lets the overlay override the tier default', () => {
    // A tier-4 item a curator judges a lane pick must be able to say so.
    const entry = entryFor('authored')
    expect(phasesFor(counter('authored', { tier: 4 }), entry)).toEqual(['lane'])
  })

  it('filters to the chosen phase', () => {
    const counters = [
      counter('early', { tier: 1 }),
      counter('late', { tier: 4 }),
      counter('authored', { tier: 4 }),
    ]
    expect(filterByPhase(counters, 'lane', entryFor).map((c) => c.item.class_name)).toEqual([
      'early',
      'authored',
    ])
    expect(filterByPhase(counters, 'late', entryFor).map((c) => c.item.class_name)).toEqual(['late'])
  })

  it('returns everything when no phase is chosen', () => {
    expect(filterByPhase([counter('a')], null, entryFor)).toHaveLength(1)
  })
})

describe('weightForRole', () => {
  const byCategory = (category: ItemCategory) => counter(category, { category })
  const counters = [byCategory('weapon'), byCategory('vitality'), byCategory('spirit')]

  it('leaves the order alone when no hero is chosen', () => {
    expect(weightForRole(counters, null).map((c) => c.item.class_name)).toEqual([
      'weapon',
      'vitality',
      'spirit',
    ])
  })

  it('promotes what the role wants', () => {
    expect(weightForRole(counters, 'marksman')[0]?.item.class_name).toBe('weapon')
    expect(weightForRole(counters, 'mystic')[0]?.item.class_name).toBe('spirit')
    expect(weightForRole(counters, 'brawler')[0]?.item.class_name).toBe('vitality')
  })

  it('changes nothing for a hero with no known role', () => {
    expect(weightForRole(counters, 'unknown').map((c) => c.item.class_name)).toEqual([
      'weapon',
      'vitality',
      'spirit',
    ])
  })

  it('nudges rather than rewrites — coverage still dominates', () => {
    // A vitality item answering one enemy must not outrank a weapon item
    // answering four just because you are playing a brawler.
    const broad = counter('broad_weapon', { category: 'weapon' }, ['h1', 'h2', 'h3', 'h4'])
    const narrow = counter('narrow_vitality', { category: 'vitality' }, ['h1'])
    expect(weightForRole([broad, narrow], 'brawler')[0]?.item.class_name).toBe('broad_weapon')
  })
})

describe('buildByCategory', () => {
  const counters = [
    ...Array.from({ length: 8 }, (_, i) => counter(`v${i}`, { category: 'vitality' })),
    counter('w0', { category: 'weapon' }),
  ]

  it('caps each category at the purchase limit', () => {
    const build = buildByCategory(counters, 6).find((b) => b.category === 'vitality')!
    expect(build.picks).toHaveLength(6)
    expect(build.runnersUp).toHaveLength(2)
  })

  it('totals the cost of the picks, not the runners-up', () => {
    const build = buildByCategory(counters, 6).find((b) => b.category === 'vitality')!
    expect(build.cost).toBe(6 * 1600)
  })

  it('returns a column per category even when empty', () => {
    expect(buildByCategory([]).map((b) => b.category)).toEqual(['weapon', 'vitality', 'spirit'])
  })

  it('names the tradeoff behind the last pick', () => {
    const build = buildByCategory(counters, 6).find((b) => b.category === 'vitality')!
    const cost = opportunityCost(build)
    expect(cost?.inFavourOf.item.class_name).toBe('v5')
    expect(cost?.dropped.item.class_name).toBe('v6')
  })

  it('reports no tradeoff when nothing was displaced', () => {
    const build = buildByCategory([counter('w0', { category: 'weapon' })], 6).find(
      (b) => b.category === 'weapon',
    )!
    expect(opportunityCost(build)).toBeNull()
  })
})

describe('formatForChat', () => {
  const team = [hero('Abrams'), hero('Haze')]
  const counters = [
    counter('Metal Skin', {}, ['h1', 'h2']),
    counter('Healbane', {}, ['h1']),
    counter('Debuff Reducer', {}, ['h1']),
  ]

  it('produces plain text with coverage', () => {
    expect(formatForChat(counters, team)).toBe(
      'vs Abrams, Haze: Metal Skin (2/2), Healbane (1/2), Debuff Reducer (1/2)',
    )
  })

  it('is empty with no team', () => {
    expect(formatForChat(counters, [])).toBe('')
  })

  it('truncates on whole items, never mid-name', () => {
    // A message cut mid-item is worse than a shorter complete one.
    const output = formatForChat(counters, team, 60)
    expect(output.length).toBeLessThanOrEqual(60)
    expect(output.endsWith(')')).toBe(true)
  })

  it('still names the enemies when nothing fits', () => {
    expect(formatForChat(counters, team, 10)).toBe('vs Abrams, Haze:')
  })

  it('contains no markup that a game chat box would mangle', () => {
    expect(formatForChat(counters, team)).not.toMatch(/[*_`|]/)
  })
})
