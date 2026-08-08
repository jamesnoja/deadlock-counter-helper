import { describe, expect, it } from 'vitest'
import { decodeToolState, encodeToolState, EMPTY_STATE } from './url-state.ts'
import { heroBySlug, HEROES } from './snapshot.ts'

/** Runs against the real roster — the point is that real shared links work. */
const decode = (query: string) =>
  decodeToolState(new URLSearchParams(query), heroBySlug, 6)

const slugFor = (className: string) =>
  HEROES.find((hero) => hero.class_name === className)?.slug

describe('decoding a shared link', () => {
  it('resolves enemies by slug, in order', () => {
    const state = decode('enemies=abrams,haze,bebop')
    expect(state.enemies.map(slugFor)).toEqual(['abrams', 'haze', 'bebop'])
  })

  it('accepts retired slugs, so old links keep working', () => {
    // "atlas" was Abrams' slug before the switch to display names.
    expect(decode('enemies=atlas').enemies.map(slugFor)).toEqual(['abrams'])
  })

  it('drops an unknown slug rather than failing the whole link', () => {
    // A stale name in a shared URL should cost you one hero, not the page.
    expect(decode('enemies=abrams,not-a-hero,haze').enemies.map(slugFor)).toEqual([
      'abrams',
      'haze',
    ])
  })

  it('ignores duplicates', () => {
    expect(decode('enemies=abrams,abrams').enemies).toHaveLength(1)
  })

  it('caps at the team size, so a crafted URL cannot exceed six', () => {
    const all = HEROES.slice(0, 10).map((hero) => hero.slug).join(',')
    expect(decode(`enemies=${all}`).enemies).toHaveLength(6)
  })

  it('reads the hero you are playing', () => {
    expect(slugFor(decode('as=haze').as!)).toBe('haze')
    expect(decode('as=not-a-hero').as).toBeNull()
  })

  it('reads phase only when it is a real phase', () => {
    expect(decode('phase=lane').phase).toBe('lane')
    expect(decode('phase=endgame').phase).toBeNull()
  })

  it('reads a positive budget only', () => {
    expect(decode('budget=1600').budget).toBe(1600)
    expect(decode('budget=0').budget).toBeNull()
    expect(decode('budget=-5').budget).toBeNull()
    expect(decode('budget=lots').budget).toBeNull()
  })

  it('returns empty state for an empty query', () => {
    expect(decode('')).toEqual(EMPTY_STATE)
  })

  it('accepts the plain object shape a server component receives', () => {
    const state = decodeToolState({ enemies: 'abrams', phase: 'mid' }, heroBySlug, 6)
    expect(state.enemies.map(slugFor)).toEqual(['abrams'])
    expect(state.phase).toBe('mid')
  })
})

describe('encoding', () => {
  it('writes nothing for default state, so a fresh page has a clean URL', () => {
    expect(encodeToolState(EMPTY_STATE, slugFor)).toBe('')
  })

  it('writes only what differs from default', () => {
    const abrams = HEROES.find((hero) => hero.slug === 'abrams')!
    expect(encodeToolState({ ...EMPTY_STATE, enemies: [abrams.class_name] }, slugFor)).toBe(
      'enemies=abrams',
    )
  })

  it('round-trips a full state', () => {
    const enemies = HEROES.slice(0, 3).map((hero) => hero.class_name)
    const original = { enemies, as: HEROES[5]!.class_name, phase: 'late' as const, budget: 3200 }
    const decoded = decodeToolState(
      new URLSearchParams(encodeToolState(original, slugFor)),
      heroBySlug,
      6,
    )
    expect(decoded).toEqual(original)
  })

  it('produces a URL a person can read', () => {
    const enemies = ['abrams', 'haze'].map((slug) => heroBySlug(slug)!.class_name)
    expect(encodeToolState({ ...EMPTY_STATE, enemies }, slugFor)).toBe('enemies=abrams%2Chaze')
  })
})
