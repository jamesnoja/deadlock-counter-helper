/**
 * The app's only door to game data.
 *
 * Reads the committed snapshot — never the network. `npm run sync` is the only
 * thing that talks to upstream, which is what makes builds reproducible and
 * keeps the site alive when the assets API is not.
 */

import abilities from '../../data/snapshot/abilities.json' with { type: 'json' }
import heroes from '../../data/snapshot/heroes.json' with { type: 'json' }
import items from '../../data/snapshot/items.json' with { type: 'json' }
import meta from '../../data/snapshot/meta.json' with { type: 'json' }

import type { Ability, Hero, Item, SnapshotMeta } from './schema.ts'

/**
 * JSON imports widen to structural literal types that will not narrow to our
 * unions (`slot: number` is not `AbilitySlot`), so these assert through
 * `unknown`. The assertion is not the safety net — `snapshot.test.ts` validates
 * the committed files against the schema on every CI run, which is what
 * actually catches a bad sync.
 */
export const HEROES = heroes as unknown as Hero[]
export const ABILITIES = abilities as unknown as Ability[]
/** Every purchasable item upstream lists, including ones ranked play cannot buy. */
export const ITEMS = items as unknown as Item[]
export const META = meta as unknown as SnapshotMeta

/**
 * The items recommendations may draw from.
 *
 * Everything at 9999 souls is mode-restricted or not yet live. They stay in
 * `ITEMS` so they remain inspectable, but recommending an item nobody can buy
 * is worse than recommending nothing.
 */
export const RANKED_ITEMS = ITEMS.filter((item) => item.ranked)

/** Kept for reference: what ranked play cannot buy, and why it is not shown. */
export const NON_RANKED_ITEMS = ITEMS.filter((item) => !item.ranked)

const heroesByClassName = new Map(HEROES.map((hero) => [hero.class_name, hero]))
// Current slugs plus every slug a hero has ever had, so an old shared link
// still resolves. Current slugs are inserted last and win any collision.
const heroesBySlug = new Map([
  ...HEROES.flatMap((hero) => hero.aliases.map((alias) => [alias, hero] as const)),
  ...HEROES.map((hero) => [hero.slug, hero] as const),
])
const abilitiesByClassName = new Map(ABILITIES.map((ability) => [ability.class_name, ability]))
const itemsByClassName = new Map(ITEMS.map((item) => [item.class_name, item]))

export const heroByClassName = (className: string): Hero | undefined =>
  heroesByClassName.get(className)

/** Resolves current slugs and retired ones. E20 can 301 when `slug` differs. */
export const heroBySlug = (slug: string): Hero | undefined => heroesBySlug.get(slug)

export const abilityByClassName = (className: string): Ability | undefined =>
  abilitiesByClassName.get(className)

export const itemByClassName = (className: string): Item | undefined => itemsByClassName.get(className)

/**
 * The artwork to show for an item.
 *
 * `shop_image` first: it is the art players actually recognise from the shop,
 * and it is the more consistently sized of the two. `image` is the fallback for
 * the handful of items that lack a shop asset.
 *
 * Stated once here rather than repeated at each call site, so the preference
 * cannot drift between the table, the plan cards and the detail panel.
 */
export const itemArtwork = (item: Item): string | null => item.shop_icon ?? item.icon

/** A hero's four signature abilities, in slot order. */
export const abilitiesForHero = (hero: Hero): Ability[] =>
  hero.abilities
    .map((className) => abilitiesByClassName.get(className))
    .filter((ability): ability is Ability => ability !== undefined)
