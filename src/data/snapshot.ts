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
export const ITEMS = items as unknown as Item[]
export const META = meta as unknown as SnapshotMeta

const heroesByClassName = new Map(HEROES.map((hero) => [hero.class_name, hero]))
const heroesBySlug = new Map(HEROES.map((hero) => [hero.slug, hero]))
const abilitiesByClassName = new Map(ABILITIES.map((ability) => [ability.class_name, ability]))
const itemsByClassName = new Map(ITEMS.map((item) => [item.class_name, item]))

export const heroByClassName = (className: string): Hero | undefined =>
  heroesByClassName.get(className)

export const heroBySlug = (slug: string): Hero | undefined => heroesBySlug.get(slug)

export const abilityByClassName = (className: string): Ability | undefined =>
  abilitiesByClassName.get(className)

export const itemByClassName = (className: string): Item | undefined => itemsByClassName.get(className)

/** A hero's four signature abilities, in slot order. */
export const abilitiesForHero = (hero: Hero): Ability[] =>
  hero.abilities
    .map((className) => abilitiesByClassName.get(className))
    .filter((ability): ability is Ability => ability !== undefined)
