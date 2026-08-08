import { describe, expect, it } from 'vitest'
import {
  NormaliseError,
  isPlayable,
  isPurchasable,
  normalise,
  toDisplaySlug,
  toPlainText,
  toSlug,
  toStats,
} from './normalise.ts'
import type { UpstreamHero, UpstreamItem } from './upstream.ts'

const ability = (className: string, overrides: Partial<UpstreamItem> = {}): UpstreamItem => ({
  class_name: className,
  name: `Ability ${className}`,
  type: 'ability',
  description: { desc: 'Does a thing.' },
  ...overrides,
})

const hero = (className: string, overrides: Partial<UpstreamHero> = {}): UpstreamHero => ({
  class_name: className,
  name: 'Display Name',
  player_selectable: true,
  disabled: false,
  in_development: false,
  images: { icon_hero_card_webp: 'card.webp', icon_image_small: 'small.png' },
  items: {
    signature1: `${className}_a1`,
    signature2: `${className}_a2`,
    signature3: `${className}_a3`,
    signature4: `${className}_a4`,
  },
  ...overrides,
})

const abilitiesFor = (className: string) =>
  [1, 2, 3, 4].map((slot) => ability(`${className}_a${slot}`))

const upgrade = (className: string, overrides: Partial<UpstreamItem> = {}): UpstreamItem => ({
  class_name: className,
  name: 'Metal Skin',
  type: 'upgrade',
  shopable: true,
  disabled: false,
  cost: 3200,
  item_tier: 3,
  item_slot_type: 'vitality',
  is_active_item: true,
  description: { desc: 'Become <span class="highlight">immune to bullets</span>.' },
  image_webp: 'icon.webp',
  ...overrides,
})

describe('toPlainText', () => {
  it('strips markup and keeps the words', () => {
    expect(toPlainText({ desc: 'Become <span class="highlight">immune</span>.' })).toBe(
      'Become immune.',
    )
  })

  it('removes inline SVG entirely', () => {
    // Some ability descriptions embed multi-kilobyte SVG blobs mid-sentence.
    const desc = 'Charge forward, <svg width="128"><path d="M9.5 108Z"/></svg> knocking back.'
    expect(toPlainText({ desc })).toBe('Charge forward, knocking back.')
  })

  it('decodes entities and collapses whitespace', () => {
    expect(toPlainText({ desc: 'Fire &amp;\n\n  ice&nbsp;damage' })).toBe('Fire & ice damage')
  })

  it('returns empty string for missing descriptions', () => {
    expect(toPlainText(undefined)).toBe('')
    expect(toPlainText({})).toBe('')
  })
})

describe('toSlug', () => {
  it('derives item slugs from class_name', () => {
    expect(toSlug('upgrade_metal_skin')).toBe('metal-skin')
    expect(toSlug('citadel_ability_bull_charge')).toBe('bull-charge')
  })
})

describe('toDisplaySlug', () => {
  it('derives hero slugs from the display name people search for', () => {
    expect(toDisplaySlug('Abrams')).toBe('abrams')
    expect(toDisplaySlug('The Doorman')).toBe('the-doorman')
    expect(toDisplaySlug('Lady Geist')).toBe('lady-geist')
  })

  it('strips punctuation and collapses separators', () => {
    expect(toDisplaySlug("Mo & Krill")).toBe('mo-krill')
    expect(toDisplaySlug('  Spaced  Out  ')).toBe('spaced-out')
  })
})

describe('toStats', () => {
  it('keeps labelled numeric properties and coerces string numbers', () => {
    const stats = toStats({
      AbilityCooldown: { value: 33, label: 'Cooldown', postfix: 's' },
      AbilityDuration: { value: '1.4', label: 'Duration', postfix: 's' },
    })
    expect(stats).toEqual({
      AbilityCooldown: { label: 'Cooldown', value: 33, unit: 's' },
      AbilityDuration: { label: 'Duration', value: 1.4, unit: 's' },
    })
  })

  it('drops properties with no label or no numeric value', () => {
    const stats = toStats({
      NoLabel: { value: 5 },
      NotNumeric: { value: 'sometimes', label: 'Vibes' },
      Empty: { label: 'Nothing' },
    })
    expect(Object.keys(stats)).toEqual([])
  })
})

describe('filters', () => {
  it('excludes heroes a player cannot select today', () => {
    expect(isPlayable(hero('hero_ok'))).toBe(true)
    expect(isPlayable(hero('hero_x', { player_selectable: false }))).toBe(false)
    expect(isPlayable(hero('hero_x', { disabled: true }))).toBe(false)
    expect(isPlayable(hero('hero_x', { in_development: true }))).toBe(false)
  })

  it('excludes items that cannot be bought today', () => {
    expect(isPurchasable(upgrade('upgrade_ok'))).toBe(true)
    expect(isPurchasable(upgrade('upgrade_x', { shopable: false }))).toBe(false)
    expect(isPurchasable(upgrade('upgrade_x', { disabled: true }))).toBe(false)
    expect(isPurchasable(ability('citadel_ability_x'))).toBe(false)
  })
})

describe('normalise', () => {
  const heroes = [hero('hero_atlas'), hero('hero_dev', { in_development: true })]
  const items = [
    ...abilitiesFor('hero_atlas'),
    ...abilitiesFor('hero_dev'),
    upgrade('upgrade_metal_skin'),
    upgrade('upgrade_gone', { shopable: false }),
  ]

  it('keeps only playable heroes and their abilities', () => {
    const snapshot = normalise(heroes, items)
    expect(snapshot.heroes.map((h) => h.class_name)).toEqual(['hero_atlas'])
    expect(snapshot.abilities).toHaveLength(4)
    expect(snapshot.abilities.every((a) => a.hero === 'hero_atlas')).toBe(true)
  })

  it('numbers ability slots in signature order', () => {
    const snapshot = normalise(heroes, items)
    const slots = snapshot.abilities
      .slice()
      .sort((a, b) => a.slot - b.slot)
      .map((a) => [a.slot, a.class_name])
    expect(slots).toEqual([
      [1, 'hero_atlas_a1'],
      [2, 'hero_atlas_a2'],
      [3, 'hero_atlas_a3'],
      [4, 'hero_atlas_a4'],
    ])
  })

  it('keeps only purchasable items', () => {
    const snapshot = normalise(heroes, items)
    expect(snapshot.items.map((i) => i.class_name)).toEqual(['upgrade_metal_skin'])
  })

  it('prefers webp images and falls back to png', () => {
    const snapshot = normalise(heroes, items)
    expect(snapshot.heroes[0]?.images.card).toBe('card.webp')
    expect(snapshot.heroes[0]?.images.portrait).toBe('small.png')
    expect(snapshot.heroes[0]?.images.minimap).toBeNull()
  })

  it('starts with no aliases when there is no previous snapshot', () => {
    expect(normalise(heroes, items).heroes[0]?.aliases).toEqual([])
  })

  it('keeps the old slug as an alias when a hero is renamed', () => {
    const before = normalise([hero('hero_atlas', { name: 'Atlas' })], items)
    const after = normalise([hero('hero_atlas', { name: 'Abrams' })], items, before.heroes)
    expect(after.heroes[0]?.slug).toBe('abrams')
    expect(after.heroes[0]?.aliases).toEqual(['atlas'])
  })

  it('accumulates aliases across successive renames', () => {
    const v1 = normalise([hero('hero_atlas', { name: 'Atlas' })], items)
    const v2 = normalise([hero('hero_atlas', { name: 'Abrams' })], items, v1.heroes)
    const v3 = normalise([hero('hero_atlas', { name: 'Bull' })], items, v2.heroes)
    expect(v3.heroes[0]?.aliases).toEqual(['abrams', 'atlas'])
  })

  it('never lists the current slug as its own alias', () => {
    const v1 = normalise([hero('hero_atlas', { name: 'Abrams' })], items)
    const v2 = normalise([hero('hero_atlas', { name: 'Abrams' })], items, v1.heroes)
    expect(v2.heroes[0]?.aliases).toEqual([])
  })

  it('is deterministic — same input, identical output', () => {
    expect(normalise(heroes, items)).toEqual(normalise(heroes, items))
  })

  it('sorts every collection by class_name', () => {
    const shuffled = normalise([hero('hero_zed'), hero('hero_abe')], [
      ...abilitiesFor('hero_zed'),
      ...abilitiesFor('hero_abe'),
    ])
    expect(shuffled.heroes.map((h) => h.class_name)).toEqual(['hero_abe', 'hero_zed'])
  })

  it('throws when a hero references an ability that does not exist', () => {
    // A patch that renames an ability must fail loudly, not silently drop it.
    expect(() => normalise([hero('hero_atlas')], [])).toThrow(NormaliseError)
    expect(() => normalise([hero('hero_atlas')], [])).toThrow(/hero_atlas_a1/)
  })

  it('throws on an unknown item category or tier', () => {
    const withItem = (overrides: Partial<UpstreamItem>) =>
      normalise([hero('hero_atlas')], [...abilitiesFor('hero_atlas'), upgrade('upgrade_x', overrides)])

    expect(() => withItem({ item_slot_type: 'cosmetic' })).toThrow(/unknown item_slot_type/)
    expect(() => withItem({ item_tier: 9 })).toThrow(/unknown item_tier/)
  })
})
