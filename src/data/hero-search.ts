/**
 * Hero search.
 *
 * Pure, so the matching rules can be tested without a browser. The bar is set
 * by E08: "greytalon", "mo krill" and "doorman" must all find the right hero.
 * Each is a different failure of naive matching — a missing space, a stripped
 * ampersand, and an old codename respectively.
 */

import type { Hero } from './schema.ts'

/** Everything down to bare letters and digits, so punctuation and spacing stop mattering. */
export const normalise = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, '')

/** Does every character of `query` appear in `candidate`, in order? */
function isSubsequence(query: string, candidate: string): boolean {
  let index = 0
  for (const character of candidate) {
    if (character === query[index]) index++
    if (index === query.length) return true
  }
  return query.length === 0
}

/**
 * Higher is better; 0 means no match.
 *
 * Ranked so an exact name beats a prefix, a prefix beats a substring, and a
 * loose subsequence comes last — otherwise typing "sev" could rank a hero that
 * merely contains those letters above Seven.
 */
export function scoreHero(hero: Hero, query: string): number {
  const needle = normalise(query)
  if (!needle) return 1

  // Aliases are retired slugs — this is what makes old codenames still work.
  const haystacks = [normalise(hero.name), normalise(hero.slug), ...hero.aliases.map(normalise)]

  let best = 0
  for (const haystack of haystacks) {
    if (haystack === needle) best = Math.max(best, 100)
    else if (haystack.startsWith(needle)) best = Math.max(best, 80)
    else if (haystack.includes(needle)) best = Math.max(best, 60)
    else if (isSubsequence(needle, haystack)) best = Math.max(best, 30)
  }
  return best
}

/** Matching heroes, best first, ties broken by name so the order never wobbles. */
export function searchHeroes(heroes: readonly Hero[], query: string): Hero[] {
  return heroes
    .map((hero) => ({ hero, score: scoreHero(hero, query) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.hero.name.localeCompare(b.hero.name))
    .map((entry) => entry.hero)
}
