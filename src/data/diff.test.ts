import { describe, expect, it } from 'vitest'
import { describeDiff, diffSnapshots, isEmptyDiff } from './diff.ts'
import type { Ability, Hero, Item, Snapshot } from './schema.ts'
import type { AbilityThreats, ItemCounters } from './tags.ts'

const hero = (className: string, name = className): Hero => ({
  class_name: className,
  name,
  slug: name.toLowerCase(),
  aliases: [],
  images: { card: null, portrait: null, minimap: null },
  abilities: [`${className}_a1`],
})

const ability = (className: string, name = className, cooldown = 30): Ability => ({
  class_name: className,
  name,
  hero: 'hero_a',
  slot: 1,
  description: '',
  icon: null,
  stats: { AbilityCooldown: { label: 'Cooldown', value: cooldown, unit: 's' } },
})

const item = (className: string, name = className): Item => ({
  class_name: className,
  name,
  slug: name.toLowerCase(),
  cost: 1000,
  tier: 2,
  category: 'vitality',
  ranked: true,
  is_active: false,
  description: '',
  icon: null,
  shop_icon: null,
})

const snapshot = (parts: Partial<Snapshot> = {}): Snapshot => ({
  heroes: [],
  abilities: [],
  items: [],
  ...parts,
})

const tagged: Record<string, AbilityThreats> = {
  hero_a_a1: { tags: ['hard_cc'], review: 'curated' },
  untagged_ability: { tags: [], untagged: true, review: 'suggested' },
}
const itemCounters: Record<string, ItemCounters> = {
  upgrade_known: { answers: ['hard_cc'], why: 'w', strength: 'hard', review: 'curated' },
}
const OVERLAY = { abilityThreats: tagged, itemCounters }

describe('no change', () => {
  it('reports an empty diff for identical snapshots', () => {
    const before = snapshot({ heroes: [hero('hero_a')], items: [item('upgrade_known')] })
    const diff = diffSnapshots(before, before, OVERLAY)
    expect(isEmptyDiff(diff)).toBe(true)
    expect(describeDiff(diff)).toBe('')
  })
})

describe('presence changes', () => {
  it('detects a new hero and flags it for review', () => {
    const diff = diffSnapshots(
      snapshot({ heroes: [hero('hero_a')] }),
      snapshot({ heroes: [hero('hero_a'), hero('hero_b')] }),
      OVERLAY,
    )
    expect(diff.heroes.added).toEqual(['hero_b'])
    expect(diff.needsReview).toContain('hero_b')
  })

  it('detects a removed item without flagging it for review', () => {
    // A removed entity cannot need re-checking — it is gone.
    const diff = diffSnapshots(
      snapshot({ items: [item('upgrade_known'), item('upgrade_gone')] }),
      snapshot({ items: [item('upgrade_known')] }),
      OVERLAY,
    )
    expect(diff.items.removed).toEqual(['upgrade_gone'])
    expect(diff.needsReview).not.toContain('upgrade_gone')
  })

  it('detects a rename without flagging it, because nothing keys on display name', () => {
    const diff = diffSnapshots(
      snapshot({ items: [item('upgrade_known', 'Debuff Remover')] }),
      snapshot({ items: [item('upgrade_known', 'Dispel Magic')] }),
      OVERLAY,
    )
    expect(diff.items.renamed).toEqual([
      { class_name: 'upgrade_known', from: 'Debuff Remover', to: 'Dispel Magic' },
    ])
    expect(diff.needsReview).toEqual([])
    expect(isEmptyDiff(diff)).toBe(false)
  })

  it('surfaces new entities that no overlay entry covers', () => {
    const diff = diffSnapshots(
      snapshot({ items: [item('upgrade_known')] }),
      snapshot({ items: [item('upgrade_known'), item('upgrade_brand_new')] }),
      OVERLAY,
    )
    expect(diff.untaggedAdditions).toEqual(['upgrade_brand_new'])
    expect(describeDiff(diff)).toContain('New and untagged')
  })
})

describe('ability retuning', () => {
  it('flags a stat change on a tagged ability', () => {
    const diff = diffSnapshots(
      snapshot({ abilities: [ability('hero_a_a1', 'Shoulder Charge', 33)] }),
      snapshot({ abilities: [ability('hero_a_a1', 'Shoulder Charge', 26)] }),
      OVERLAY,
    )
    expect(diff.abilities.retuned).toEqual([
      { class_name: 'hero_a_a1', name: 'Shoulder Charge', stat: 'AbilityCooldown', from: 33, to: 26 },
    ])
    expect(diff.needsReview).toContain('hero_a_a1')
  })

  it('ignores a stat change on an untagged ability', () => {
    // We made no claim about it, so a retune invalidates nothing.
    const diff = diffSnapshots(
      snapshot({ abilities: [ability('untagged_ability', 'Whatever', 10)] }),
      snapshot({ abilities: [ability('untagged_ability', 'Whatever', 99)] }),
      OVERLAY,
    )
    expect(diff.abilities.retuned).toEqual([])
    expect(isEmptyDiff(diff)).toBe(true)
  })

  it('ignores an ability with no overlay entry at all', () => {
    const diff = diffSnapshots(
      snapshot({ abilities: [ability('unknown_ability', 'X', 10)] }),
      snapshot({ abilities: [ability('unknown_ability', 'X', 20)] }),
      OVERLAY,
    )
    expect(diff.abilities.retuned).toEqual([])
  })

  it('does not treat a brand new ability as retuned', () => {
    const diff = diffSnapshots(
      snapshot({ abilities: [] }),
      snapshot({ abilities: [ability('hero_a_a1', 'New', 20)] }),
      OVERLAY,
    )
    expect(diff.abilities.retuned).toEqual([])
    expect(diff.abilities.added).toEqual(['hero_a_a1'])
  })
})

describe('simulated upstream patch', () => {
  /**
   * E06's acceptance criterion: a simulated upstream change produces a
   * readable, reviewable summary.
   */
  const before = snapshot({
    heroes: [hero('hero_a', 'Abrams')],
    abilities: [ability('hero_a_a1', 'Shoulder Charge', 33)],
    items: [item('upgrade_known', 'Debuff Remover'), item('upgrade_retired', 'Old Thing')],
  })
  const after = snapshot({
    heroes: [hero('hero_a', 'Abrams'), hero('hero_new', 'Newcomer')],
    abilities: [ability('hero_a_a1', 'Shoulder Charge', 26)],
    items: [item('upgrade_known', 'Dispel Magic'), item('upgrade_fresh', 'Fresh Item')],
  })
  const diff = diffSnapshots(before, after, OVERLAY)

  it('catches every category of change at once', () => {
    expect(diff.heroes.added).toEqual(['hero_new'])
    expect(diff.items.added).toEqual(['upgrade_fresh'])
    expect(diff.items.removed).toEqual(['upgrade_retired'])
    expect(diff.items.renamed.map((r) => r.to)).toEqual(['Dispel Magic'])
    expect(diff.abilities.retuned).toHaveLength(1)
  })

  it('writes a summary a human can act on', () => {
    const summary = describeDiff(diff)
    expect(summary).toContain('New heroes')
    expect(summary).toContain('"Debuff Remover" → "Dispel Magic"')
    expect(summary).toContain('Shoulder Charge — AbilityCooldown: 33 → 26')
    expect(summary).toContain('New and untagged')
    expect(summary).toContain('flagged for review')
  })

  it('flags exactly the things whose curation might no longer hold', () => {
    expect(diff.needsReview).toEqual(['hero_a_a1', 'hero_new', 'upgrade_fresh'])
  })
})

describe('determinism', () => {
  it('sorts every list, so the same patch always produces the same diff', () => {
    const before = snapshot({ items: [item('a'), item('b')] })
    const after = snapshot({ items: [item('z'), item('b'), item('a'), item('m')] })
    const forwards = diffSnapshots(before, after, OVERLAY)
    const backwards = diffSnapshots(before, snapshot({ items: [...after.items].reverse() }), OVERLAY)
    expect(forwards).toEqual(backwards)
    expect(forwards.items.added).toEqual(['m', 'z'])
  })
})
