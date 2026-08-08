import { describe, expect, it } from 'vitest'
import { deriveCounters, type CounterOverride, type DeriveContext } from './derive.ts'
import type { Hero, Item } from './schema.ts'
import type { AbilityThreats, ItemCounters, ThreatTag } from './tags.ts'

/**
 * Fixtures, not the real snapshot. The engine must be provably correct
 * independently of whatever the overlay happens to contain today — otherwise a
 * curation change could turn a green test red, or worse, keep it green while
 * the logic rots.
 */

const hero = (className: string, abilities: string[]): Hero => ({
  class_name: className,
  name: className,
  slug: className,
  aliases: [],
  role: 'brawler',
  images: { card: null, portrait: null, minimap: null },
  abilities,
})

const item = (className: string): Item => ({
  class_name: className,
  name: className,
  slug: className,
  cost: 1000,
  tier: 2,
  category: 'vitality',
  ranked: true,
  stats: {},
  is_active: false,
  description: '',
  icon: null,
  shop_icon: null,
})

const threatens = (tags: ThreatTag[]): AbilityThreats => ({ tags, review: 'curated' })

const answers = (
  tags: ThreatTag[],
  strength: ItemCounters['strength'] = 'hard',
): ItemCounters => ({ answers: tags, why: 'because', strength, review: 'curated' })

/**
 * Two enemies. `enemy_cc` brings hard CC, `enemy_gun` brings gun DPS, and both
 * bring sustain — so `cleanse` answers one, `armor` answers one, and `antiheal`
 * answers both.
 */
const CONTEXT: DeriveContext = {
  items: [item('cleanse'), item('armor'), item('antiheal'), item('irrelevant')],
  abilityThreats: {
    a_stun: threatens(['hard_cc']),
    a_heal: threatens(['sustain']),
    a_shoot: threatens(['high_dps_gun']),
    a_leech: threatens(['sustain']),
    a_none: threatens([]),
  },
  itemCounters: {
    cleanse: answers(['hard_cc']),
    armor: answers(['high_dps_gun']),
    antiheal: answers(['sustain']),
    irrelevant: answers(['stealth']),
  },
}

const CC_HERO = hero('enemy_cc', ['a_stun', 'a_heal'])
const GUN_HERO = hero('enemy_gun', ['a_shoot', 'a_leech'])

describe('deriveCounters', () => {
  it('returns nothing for an empty team', () => {
    expect(deriveCounters([], CONTEXT)).toEqual([])
  })

  it('returns nothing when no enemy presents a tagged threat', () => {
    expect(deriveCounters([hero('blank', ['a_none'])], CONTEXT)).toEqual([])
  })

  it('omits items that answer nothing the team presents', () => {
    const names = deriveCounters([CC_HERO], CONTEXT).map((c) => c.item.class_name)
    expect(names).not.toContain('irrelevant')
    expect(names).not.toContain('armor')
  })

  it('reports which enemies each item answers, and through which tag', () => {
    const result = deriveCounters([CC_HERO, GUN_HERO], CONTEXT)
    const antiheal = result.find((c) => c.item.class_name === 'antiheal')
    expect(antiheal?.coverage).toEqual(['enemy_cc', 'enemy_gun'])
    expect(antiheal?.matches).toEqual([{ tag: 'sustain', heroes: ['enemy_cc', 'enemy_gun'] }])
  })

  it('ranks broader coverage above narrower', () => {
    // antiheal answers both enemies; cleanse answers one, albeit a nastier tag.
    const result = deriveCounters([CC_HERO, GUN_HERO], CONTEXT)
    expect(result[0]?.item.class_name).toBe('antiheal')
  })

  it('weights a severe threat above a mild one at equal coverage', () => {
    const context: DeriveContext = {
      ...CONTEXT,
      items: [item('vs_severe'), item('vs_mild')],
      itemCounters: {
        vs_severe: answers(['hard_cc']), // severity 3
        vs_mild: answers(['melee_pressure']), // severity 1
      },
      abilityThreats: { a_both: threatens(['hard_cc', 'melee_pressure']) },
    }
    const result = deriveCounters([hero('e', ['a_both'])], context)
    expect(result.map((c) => c.item.class_name)).toEqual(['vs_severe', 'vs_mild'])
  })

  it('weights a hard counter above a situational one at equal coverage', () => {
    const context: DeriveContext = {
      ...CONTEXT,
      items: [item('hard_answer'), item('situational_answer')],
      itemCounters: {
        hard_answer: answers(['hard_cc'], 'hard'),
        situational_answer: answers(['hard_cc'], 'situational'),
      },
      abilityThreats: { a_stun: threatens(['hard_cc']) },
    }
    const result = deriveCounters([hero('e', ['a_stun'])], context)
    expect(result.map((c) => c.item.class_name)).toEqual(['hard_answer', 'situational_answer'])
  })

  it('counts a hero once even when several of its abilities share a tag', () => {
    const doubled = hero('e', ['a_stun', 'a_stun2'])
    const context: DeriveContext = {
      ...CONTEXT,
      abilityThreats: { a_stun: threatens(['hard_cc']), a_stun2: threatens(['hard_cc']) },
    }
    const cleanse = deriveCounters([doubled], context).find((c) => c.item.class_name === 'cleanse')
    expect(cleanse?.coverage).toEqual(['e'])
  })

  it('ignores items whose overlay entry is explicitly untagged', () => {
    const context: DeriveContext = {
      ...CONTEXT,
      itemCounters: {
        cleanse: { answers: ['hard_cc'], untagged: true, why: '', strength: 'hard', review: 'curated' },
      },
    }
    expect(deriveCounters([CC_HERO], context)).toEqual([])
  })
})

describe('per-hero effect — the coverage matrix and detail panel', () => {
  it('returns one entry per selected hero, in selection order', () => {
    // Fixed columns are what make the matrix readable down as well as across,
    // so every row must carry every selected hero whether addressed or not.
    const result = deriveCounters([CC_HERO, GUN_HERO], CONTEXT)
    for (const counter of result) {
      expect(counter.perHero.map((p) => p.hero)).toEqual(['enemy_cc', 'enemy_gun'])
    }
  })

  it('marks heroes the item does nothing about as `none`', () => {
    const cleanse = deriveCounters([CC_HERO, GUN_HERO], CONTEXT).find(
      (c) => c.item.class_name === 'cleanse',
    )
    expect(cleanse?.perHero.find((p) => p.hero === 'enemy_gun')).toEqual({
      hero: 'enemy_gun',
      strength: 'none',
      tags: [],
      abilities: [],
    })
  })

  it('names the specific abilities that carry the matched tag', () => {
    // This is what makes a derived explanation concrete rather than generic —
    // and it cannot orphan on a rename, because it resolves through class_name.
    const cleanse = deriveCounters([CC_HERO], CONTEXT).find((c) => c.item.class_name === 'cleanse')
    expect(cleanse?.perHero[0]).toEqual({
      hero: 'enemy_cc',
      strength: 'strong',
      tags: ['hard_cc'],
      abilities: ['a_stun'],
    })
  })

  it('grades the same item differently against different heroes', () => {
    const context: DeriveContext = {
      ...CONTEXT,
      items: [item('mixed')],
      itemCounters: { mixed: answers(['hard_cc', 'melee_pressure'], 'soft') },
      abilityThreats: {
        a_severe: threatens(['hard_cc']), // soft(2) x severity 3 = 6 -> strong
        a_mild: threatens(['melee_pressure']), // soft(2) x severity 1 = 2 -> situational
      },
    }
    const result = deriveCounters(
      [hero('severe', ['a_severe']), hero('mild', ['a_mild'])],
      context,
    )
    expect(result[0]?.perHero.map((p) => [p.hero, p.strength])).toEqual([
      ['severe', 'strong'],
      ['mild', 'situational'],
    ])
  })

  it('grades by the worst threat answered, not the average', () => {
    // An item that shuts down a hero's ultimate is a strong answer even if it
    // also happens to nick a trivial passive.
    const context: DeriveContext = {
      ...CONTEXT,
      items: [item('broad')],
      itemCounters: { broad: answers(['hard_cc', 'melee_pressure'], 'soft') },
      abilityThreats: { a_both: threatens(['hard_cc', 'melee_pressure']) },
    }
    const result = deriveCounters([hero('e', ['a_both'])], context)
    expect(result[0]?.perHero[0]?.strength).toBe('strong')
  })
})

describe('determinism', () => {
  it('produces identical output for identical input', () => {
    const first = deriveCounters([CC_HERO, GUN_HERO], CONTEXT)
    const second = deriveCounters([CC_HERO, GUN_HERO], CONTEXT)
    expect(first).toEqual(second)
  })

  it('does not depend on the order items arrive in', () => {
    const reversed: DeriveContext = { ...CONTEXT, items: [...CONTEXT.items].reverse() }
    const a = deriveCounters([CC_HERO, GUN_HERO], CONTEXT).map((c) => c.item.class_name)
    const b = deriveCounters([CC_HERO, GUN_HERO], reversed).map((c) => c.item.class_name)
    expect(a).toEqual(b)
  })

  it('ranks identically regardless of the order heroes arrive in', () => {
    /**
     * Ranking must not depend on selection order. `perHero` deliberately does —
     * it is the matrix's column order, and columns follow the user's slots.
     * So compare everything except that.
     */
    const strip = (counters: ReturnType<typeof deriveCounters>) =>
      counters.map((counter) => ({ ...counter, perHero: undefined }))

    expect(strip(deriveCounters([CC_HERO, GUN_HERO], CONTEXT))).toEqual(
      strip(deriveCounters([GUN_HERO, CC_HERO], CONTEXT)),
    )
  })

  it('orders per-hero columns by selection, not alphabetically', () => {
    const reversed = deriveCounters([GUN_HERO, CC_HERO], CONTEXT)
    expect(reversed[0]?.perHero.map((p) => p.hero)).toEqual(['enemy_gun', 'enemy_cc'])
  })

  it('breaks score ties by class_name, so equal items never shuffle', () => {
    const context: DeriveContext = {
      ...CONTEXT,
      items: [item('zulu'), item('alpha'), item('mike')],
      itemCounters: {
        zulu: answers(['hard_cc']),
        alpha: answers(['hard_cc']),
        mike: answers(['hard_cc']),
      },
      abilityThreats: { a_stun: threatens(['hard_cc']) },
    }
    const result = deriveCounters([hero('e', ['a_stun'])], context)
    expect(result.map((c) => c.item.class_name)).toEqual(['alpha', 'mike', 'zulu'])
  })
})

describe('adding a hero', () => {
  /** E05's acceptance criterion: a new tagged hero produces counters with no other change. */
  it('produces counters for a brand new hero with no edit beyond its tags', () => {
    const newcomer = hero('enemy_new', ['a_stun'])
    const result = deriveCounters([newcomer], CONTEXT)
    expect(result.map((c) => c.item.class_name)).toEqual(['cleanse'])
    expect(result[0]?.coverage).toEqual(['enemy_new'])
  })

  it('widens coverage rather than replacing it when a hero is added', () => {
    const one = deriveCounters([CC_HERO], CONTEXT)
    const two = deriveCounters([CC_HERO, GUN_HERO], CONTEXT)
    const before = one.find((c) => c.item.class_name === 'antiheal')
    const after = two.find((c) => c.item.class_name === 'antiheal')
    expect(before?.coverage).toEqual(['enemy_cc'])
    expect(after?.coverage).toEqual(['enemy_cc', 'enemy_gun'])
    expect(after!.score).toBeGreaterThan(before!.score)
  })
})

describe('editorial overrides', () => {
  const withOverrides = (overrides: CounterOverride[]): DeriveContext => ({ ...CONTEXT, overrides })

  it('excludes an item entirely', () => {
    const context = withOverrides([
      { item: 'cleanse', effect: 'exclude', reason: 'Reworked in this patch.' },
    ])
    expect(deriveCounters([CC_HERO], context).map((c) => c.item.class_name)).not.toContain('cleanse')
  })

  it('includes an item the tags would not have surfaced', () => {
    const context = withOverrides([
      { item: 'irrelevant', effect: 'include', reason: 'Works in practice; tags miss it.' },
    ])
    const forced = deriveCounters([CC_HERO], context).find((c) => c.item.class_name === 'irrelevant')
    expect(forced).toBeDefined()
    expect(forced?.source).toBe('editorial')
    expect(forced?.overrideReason).toBe('Works in practice; tags miss it.')
  })

  it('marks overridden entries editorial and everything else derived', () => {
    const context = withOverrides([
      { item: 'cleanse', effect: 'boost', reason: 'Underrated into this comp.' },
    ])
    const result = deriveCounters([CC_HERO, GUN_HERO], context)
    expect(result.find((c) => c.item.class_name === 'cleanse')?.source).toBe('editorial')
    expect(result.find((c) => c.item.class_name === 'antiheal')?.source).toBe('derived')
  })

  it('boosts and demotes the score', () => {
    const base = deriveCounters([CC_HERO], CONTEXT).find((c) => c.item.class_name === 'cleanse')!
    const boosted = deriveCounters(
      [CC_HERO],
      withOverrides([{ item: 'cleanse', effect: 'boost', reason: 'r' }]),
    ).find((c) => c.item.class_name === 'cleanse')!
    const demoted = deriveCounters(
      [CC_HERO],
      withOverrides([{ item: 'cleanse', effect: 'demote', reason: 'r' }]),
    ).find((c) => c.item.class_name === 'cleanse')!
    expect(boosted.score).toBeGreaterThan(base.score)
    expect(demoted.score).toBeLessThan(base.score)
  })

  it('lets exclusion win over a contradictory include', () => {
    // A contradictory pair is a curation mistake; failing to the safer reading
    // beats showing an item someone explicitly banned.
    const context = withOverrides([
      { item: 'cleanse', effect: 'include', reason: 'a' },
      { item: 'cleanse', effect: 'exclude', reason: 'b' },
    ])
    expect(deriveCounters([CC_HERO], context).map((c) => c.item.class_name)).not.toContain('cleanse')
  })

  it('applies a hero-scoped override only when that hero is selected', () => {
    const context = withOverrides([
      { item: 'cleanse', hero: 'enemy_gun', effect: 'exclude', reason: 'Useless into this one.' },
    ])
    expect(deriveCounters([CC_HERO], context).map((c) => c.item.class_name)).toContain('cleanse')
    expect(deriveCounters([CC_HERO, GUN_HERO], context).map((c) => c.item.class_name)).not.toContain(
      'cleanse',
    )
  })
})
