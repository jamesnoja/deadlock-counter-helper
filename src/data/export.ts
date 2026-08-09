/**
 * Team chat export — E19.
 *
 * The real workflow is telling four teammates what to buy, in chat, in about
 * eight seconds. That means plain text that survives a game chat box: no
 * markdown, no box drawing, no alignment that collapses in a proportional font.
 */

import type { SourcedCounter } from './sourced.ts'
import type { Hero } from './schema.ts'

/**
 * In-game chat truncates. Keeping the whole message short enough to land in one
 * piece matters more than listing everything — a message cut mid-item is worse
 * than a shorter complete one.
 */
export const CHAT_LIMIT = 300

export function formatForChat(
  counters: readonly SourcedCounter[],
  team: readonly Hero[],
  limit: number = CHAT_LIMIT,
): string {
  if (team.length === 0) return ''

  const header = `vs ${team.map((hero) => hero.name).join(', ')}: `
  const parts: string[] = []

  for (const counter of counters) {
    // "Name (4/6)" — the coverage is what justifies the pick to a teammate.
    const part = `${counter.item.name} (${counter.coverage.length}/${team.length})`
    const candidate = [...parts, part].join(', ')
    if (header.length + candidate.length > limit) break
    parts.push(part)
  }

  if (parts.length === 0) return header.trim()
  return header + parts.join(', ')
}
