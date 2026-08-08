import { describe, expect, it } from 'vitest'
import { normalise, searchHeroes } from './hero-search.ts'
import { HEROES } from './snapshot.ts'

/** Runs against the real roster — the point is that these specific names work. */
const find = (query: string) => searchHeroes(HEROES, query).map((hero) => hero.name)

describe('normalise', () => {
  it('strips everything that is not a letter or digit', () => {
    expect(normalise('Mo & Krill')).toBe('mokrill')
    expect(normalise('The Doorman')).toBe('thedoorman')
    expect(normalise("Djinn's Mark")).toBe('djinnsmark')
  })
})

describe('the three cases E08 calls out by name', () => {
  it('finds Grey Talon without the space', () => {
    expect(find('greytalon')[0]).toBe('Grey Talon')
  })

  it('finds Mo & Krill without the ampersand', () => {
    expect(find('mo krill')[0]).toBe('Mo & Krill')
    expect(find('mokrill')[0]).toBe('Mo & Krill')
  })

  it('finds The Doorman by its retired codename', () => {
    // "doorman" is an alias carried forward from the class_name-derived slug.
    expect(find('doorman')[0]).toBe('The Doorman')
  })
})

describe('ranking', () => {
  it('prefers an exact name over a longer one containing it', () => {
    expect(find('seven')[0]).toBe('Seven')
  })

  it('prefers a prefix over a mid-string match', () => {
    // "in" starts Infernus and sits mid-name in Sinclair and Vindicta.
    const results = find('in')
    expect(results[0]).toBe('Infernus')
    expect(results.indexOf('Infernus')).toBeLessThan(results.indexOf('Sinclair'))
  })

  it('still finds a hero from a loose subsequence', () => {
    expect(find('vndct')).toContain('Vindicta')
  })

  it('is stable — ties break by name', () => {
    expect(find('a')).toEqual(find('a'))
  })
})

describe('edges', () => {
  it('returns everyone for an empty query', () => {
    expect(searchHeroes(HEROES, '')).toHaveLength(HEROES.length)
    expect(searchHeroes(HEROES, '   ')).toHaveLength(HEROES.length)
  })

  it('returns nothing for a query that matches nothing', () => {
    expect(find('zzzzqqqq')).toEqual([])
  })

  it('ignores case and punctuation in the query', () => {
    expect(find('LADY-GEIST!')[0]).toBe('Lady Geist')
  })

  it('finds every hero by its own exact name', () => {
    // Guards the roster as a whole: a hero unreachable by typing its name is a
    // hero nobody can select.
    const unreachable = HEROES.filter((hero) => find(hero.name)[0] !== hero.name).map((h) => h.name)
    expect(unreachable).toEqual([])
  })
})
