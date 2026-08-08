/**
 * Tool state in the URL — E20.
 *
 * On the original site `location.href` never changed, so a matchup could not be
 * bookmarked, shared or linked, and every visit started from zero. Here the URL
 * *is* the state.
 *
 * Encoded with hero **slugs**, not class_names: a link is something a person
 * reads and types, and `?enemies=abrams,haze` survives being pasted into chat
 * in a way `hero_atlas` does not. Decoding accepts retired slugs too, so links
 * shared before a rename keep working.
 */

import type { Hero } from './schema.ts'
import { GAME_PHASES, type GamePhase } from './tags.ts'

export interface ToolState {
  /** Enemy hero `class_name`s, in pick order. */
  enemies: string[]
  /** The hero you are playing, or null. */
  as: string | null
  phase: GamePhase | null
  budget: number | null
}

export const EMPTY_STATE: ToolState = { enemies: [], as: null, phase: null, budget: null }

const isPhase = (value: string): value is GamePhase =>
  (GAME_PHASES as readonly string[]).includes(value)

/**
 * Resolves a slug to a hero, honouring retired slugs.
 *
 * Deliberately injected rather than importing the snapshot, so this stays pure
 * and testable without the real roster.
 */
export type ResolveHero = (slug: string) => Hero | undefined

export function decodeToolState(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
  resolveHero: ResolveHero,
  maxEnemies: number,
): ToolState {
  const read = (key: string): string | null => {
    if (params instanceof URLSearchParams) return params.get(key)
    const value = params[key]
    return Array.isArray(value) ? (value[0] ?? null) : (value ?? null)
  }

  const enemies: string[] = []
  for (const slug of (read('enemies') ?? '').split(',')) {
    const hero = resolveHero(slug.trim())
    // Unknown slugs are dropped rather than failing the whole link — a stale
    // name in a shared URL should cost you one hero, not the page.
    if (!hero || enemies.includes(hero.class_name)) continue
    if (enemies.length >= maxEnemies) break
    enemies.push(hero.class_name)
  }

  const asSlug = read('as')
  const as = asSlug ? (resolveHero(asSlug.trim())?.class_name ?? null) : null

  const phaseRaw = (read('phase') ?? '').trim()
  const phase = isPhase(phaseRaw) ? phaseRaw : null

  const budgetRaw = Number(read('budget'))
  const budget = Number.isFinite(budgetRaw) && budgetRaw > 0 ? budgetRaw : null

  return { enemies, as, phase, budget }
}

/**
 * Only non-default values are written, so a fresh page has a clean URL and a
 * shared one carries exactly what differs from default.
 */
export function encodeToolState(
  state: ToolState,
  slugFor: (className: string) => string | undefined,
): string {
  const params = new URLSearchParams()
  const slugs = state.enemies.map(slugFor).filter((slug): slug is string => Boolean(slug))
  if (slugs.length) params.set('enemies', slugs.join(','))
  if (state.as) {
    const slug = slugFor(state.as)
    if (slug) params.set('as', slug)
  }
  if (state.phase) params.set('phase', state.phase)
  if (state.budget !== null) params.set('budget', String(state.budget))
  return params.toString()
}
