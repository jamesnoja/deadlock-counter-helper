import { describe, expect, it } from 'vitest'
import {
  ABILITIES,
  HEROES,
  ITEMS,
  META,
  NON_RANKED_ITEMS,
  RANKED_ITEMS,
  abilitiesForHero,
  heroBySlug,
  itemArtwork,
  itemByClassName,
} from './snapshot.ts'
import { ITEM_CATEGORIES, ITEM_TIERS, RANKED_MAX_COST } from './schema.ts'
import { toDisplaySlug } from './normalise.ts'

/**
 * Validates the committed snapshot itself, not the transform. These are the
 * assertions that catch a bad sync landing in the repo — a patch that removes
 * an ability, renames a category, or drops a hero's artwork.
 */

describe('snapshot integrity', () => {
  it('has heroes, abilities, and items', () => {
    expect(HEROES.length).toBeGreaterThan(0)
    expect(ABILITIES.length).toBeGreaterThan(0)
    expect(ITEMS.length).toBeGreaterThan(0)
  })

  it('agrees with the counts recorded in meta', () => {
    expect(META.counts).toEqual({
      heroes: HEROES.length,
      abilities: ABILITIES.length,
      items: ITEMS.length,
    })
  })

  it('keys every entity uniquely on class_name', () => {
    for (const [label, rows] of [
      ['heroes', HEROES],
      ['abilities', ABILITIES],
      ['items', ITEMS],
    ] as const) {
      const names = rows.map((r) => r.class_name)
      expect(`${label}:${new Set(names).size}`).toBe(`${label}:${names.length}`)
    }
  })

  it('gives every hero a unique slug derived from its display name', () => {
    const slugs = HEROES.map((h) => h.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(HEROES.filter((h) => h.slug !== toDisplaySlug(h.name)).map((h) => h.class_name)).toEqual(
      [],
    )
  })

  it('keeps aliases distinct from current slugs and from each other', () => {
    // An alias colliding with a live slug would silently hijack that hero's page.
    const current = new Set(HEROES.map((h) => h.slug))
    const collisions = HEROES.flatMap((h) =>
      h.aliases.filter((alias) => current.has(alias)).map((alias) => `${h.class_name}:${alias}`),
    )
    const allAliases = HEROES.flatMap((h) => h.aliases)
    expect(collisions).toEqual([])
    expect(new Set(allAliases).size).toBe(allAliases.length)
  })

  it('resolves retired codename slugs to the right hero', () => {
    // Every hero carries its old class_name-derived slug from before the switch
    // to display names, so links shared under the old scheme still work.
    const withAlias = HEROES.filter((h) => h.aliases.length > 0)
    expect(withAlias.length).toBeGreaterThan(0)
    for (const hero of withAlias) {
      for (const alias of hero.aliases) {
        expect(heroBySlug(alias)?.class_name).toBe(hero.class_name)
      }
    }
  })

  it('resolves every ability a hero references', () => {
    const dangling = HEROES.flatMap((hero) =>
      hero.abilities
        .filter((className) => !ABILITIES.some((a) => a.class_name === className))
        .map((className) => `${hero.class_name} -> ${className}`),
    )
    expect(dangling).toEqual([])
  })

  it('gives every hero exactly four signature abilities', () => {
    const wrong = HEROES.filter((h) => abilitiesForHero(h).length !== 4).map(
      (h) => `${h.class_name}:${h.abilities.length}`,
    )
    expect(wrong).toEqual([])
  })

  it('owns every ability by a hero in the snapshot', () => {
    const orphans = ABILITIES.filter((a) => !HEROES.some((h) => h.class_name === a.hero)).map(
      (a) => a.class_name,
    )
    expect(orphans).toEqual([])
  })

  it('gives every item a known category and tier, and a non-negative cost', () => {
    const bad = ITEMS.filter(
      (i) =>
        !(ITEM_CATEGORIES as readonly string[]).includes(i.category) ||
        !(ITEM_TIERS as readonly number[]).includes(i.tier) ||
        typeof i.cost !== 'number' ||
        i.cost < 0,
    ).map((i) => i.class_name)
    expect(bad).toEqual([])
  })

  it('splits items on the ranked cost ceiling', () => {
    // Everything above 6400 is mode-restricted or not yet live. Kept in the
    // snapshot for reference, excluded from recommendations.
    expect(RANKED_ITEMS.every((item) => item.cost <= RANKED_MAX_COST)).toBe(true)
    expect(NON_RANKED_ITEMS.every((item) => item.cost > RANKED_MAX_COST)).toBe(true)
    expect(RANKED_ITEMS.length + NON_RANKED_ITEMS.length).toBe(ITEMS.length)
    expect(NON_RANKED_ITEMS.length).toBeGreaterThan(0)
  })

  it('keeps excluded items in the snapshot rather than dropping them', () => {
    // They stay inspectable so the exclusion can be revisited when the mode
    // restriction lifts — losing them would mean a re-sync to get them back.
    for (const item of NON_RANKED_ITEMS) {
      expect(itemByClassName(item.class_name)).toBeDefined()
    }
  })

  it('prices every item purely by its tier', () => {
    /**
     * Cost is a function of tier upstream: 800 / 1600 / 3200 / 6400 / 9999.
     *
     * The 9999 tier is not a real price — those items are mode-restricted or
     * not yet live, and `ranked` excludes them from recommendations. The
     * one-cost-per-tier invariant is what makes that filter safe to express as
     * a cost ceiling, so it is worth pinning.
     */
    const costsByTier = new Map<number, Set<number>>()
    for (const item of ITEMS) {
      costsByTier.set(item.tier, (costsByTier.get(item.tier) ?? new Set()).add(item.cost))
    }
    const multiPriced = [...costsByTier.entries()]
      .filter(([, costs]) => costs.size !== 1)
      .map(([tier, costs]) => `tier ${tier}: ${[...costs].join('/')}`)
    expect(multiPriced).toEqual([])
    expect([...costsByTier.keys()].sort()).toEqual([1, 2, 3, 4, 5])
  })

  it('strips markup out of every description', () => {
    const withMarkup = [...ABILITIES, ...ITEMS]
      .filter((entity) => /<[a-z/]/i.test(entity.description))
      .map((entity) => entity.class_name)
    expect(withMarkup).toEqual([])
  })

  it('records provenance', () => {
    expect(META.content_hash).toMatch(/^[0-9a-f]{64}$/)
    expect(META.synced_at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(Object.keys(META.sources).length).toBeGreaterThan(0)
  })

  it('finds a hero by slug', () => {
    const first = HEROES[0]
    expect(first).toBeDefined()
    expect(heroBySlug(first!.slug)?.class_name).toBe(first!.class_name)
    expect(heroBySlug('not-a-hero')).toBeUndefined()
  })
})

describe('artwork coverage', () => {
  it('gives every item at least one image source', () => {
    // 15 items have no `image`/`image_webp` but do have `shop_image`, which is
    // why the normaliser keeps both. Currently every item resolves to something.
    // If a patch breaks that, this fails on the sync PR — which is the moment
    // E12's placeholder stops being optional.
    const missing = ITEMS.filter((i) => !i.icon && !i.shop_icon).map((i) => i.class_name)
    expect(missing).toEqual([])
  })

  it('prefers shop art for items, falling back to the plain icon', () => {
    // Shop art is what players recognise from the shop and is more consistently
    // framed. Asserted so the preference cannot drift back at one call site.
    const withBoth = ITEMS.find((item) => item.shop_icon && item.icon)
    expect(withBoth).toBeDefined()
    expect(itemArtwork(withBoth!)).toBe(withBoth!.shop_icon)
    expect(itemArtwork({ ...withBoth!, shop_icon: null })).toBe(withBoth!.icon)
    expect(itemArtwork({ ...withBoth!, shop_icon: null, icon: null })).toBeNull()
  })

  it('resolves artwork for every item', () => {
    expect(ITEMS.filter((item) => !itemArtwork(item)).map((item) => item.class_name)).toEqual([])
  })

  it('gives every hero a portrait', () => {
    const missing = HEROES.filter((h) => !h.images.portrait && !h.images.card).map(
      (h) => h.class_name,
    )
    expect(missing).toEqual([])
  })
})
