/**
 * Joins what we measured to what Valve said about it.
 *
 * `diff.ts` reports that `Shining Wonder — Damage: 165 → 140`. The 2026-08-22
 * notes say "Celeste: Shining Wonder damage reduced from 165 to 140". Same
 * change, two independent sources, and pairing them is the reason this
 * changelog is worth building — the diff proves something moved, the note
 * explains why.
 *
 * The interesting half is what does *not* pair. Of the eight retunes detected
 * on 2026-09-08, four have no published note at all, including Card Trick's
 * `ClubSlowPercent: -30 → 30` sign flip. Those are not failures to be hidden:
 * "the game changed and nobody wrote it down" is the most useful thing this
 * page can tell a player.
 *
 * Pure and deterministic. The caller supplies both sides.
 */

import type { Retuned } from './diff.ts'
import type { PatchNote } from './patches-schema.ts'

/** Where a change was explained, if it was. */
export interface Explanation {
  patch_gid: string
  patch_slug: string
  patch_title: string
  published_at: string
  /** The note line, verbatim. */
  text: string
}

export interface CorrelatedRetune extends Retuned {
  explanation: Explanation | null
}

export interface Correlation {
  retunes: CorrelatedRetune[]
  explained: number
  unexplained: number
}

/**
 * Every number in a line, as numbers.
 *
 * Comparing numerically rather than by substring is what makes the match
 * survive Valve's formatting. The same value appears as `-22%`, `32s`, `+8%`
 * and bare `165` across four posts, and a substring test for "8" would also
 * hit "80" and "0.8".
 */
export function numbersIn(text: string): number[] {
  const found = text.match(/-?\d+(?:\.\d+)?/g)
  if (!found) return []
  return found.map(Number).filter((value) => !Number.isNaN(value))
}

/**
 * True when a note line describes this exact change.
 *
 * Requires the entity name **and both endpoints**. Name alone is far too loose:
 * "Shining Wonder" appears in a 2026-05-22 line listing six abilities that
 * shared an unrelated zoom bug. Requiring both numbers also rejects the near
 * miss that matters most — `Stalker's Mark` went 24 → 26 with no note, while an
 * older post reads "cooldown increased from 20s to 24s". Matching on the `from`
 * value alone would credit that change to the wrong patch.
 */
export function noteExplains(text: string, retune: Retuned): boolean {
  if (!text.includes(retune.name)) return false
  const numbers = numbersIn(text)
  return numbers.includes(retune.from) && numbers.includes(retune.to)
}

/**
 * The note that explains a change, or null.
 *
 * Searches newest first and takes the first hit. When Valve retunes the same
 * value twice — reverting a change, or a hotfix restating it — the most recent
 * post is the one that describes the state we just measured.
 */
export function findExplanation(
  retune: Retuned,
  notes: readonly PatchNote[],
): Explanation | null {
  for (const note of notes) {
    for (const block of note.blocks) {
      if (block.kind !== 'note') continue
      if (!noteExplains(block.text, retune)) continue
      return {
        patch_gid: note.gid,
        patch_slug: note.slug,
        patch_title: note.title,
        published_at: note.published_at,
        text: block.text,
      }
    }
  }
  return null
}

/**
 * Pairs every retune in a diff with its note.
 *
 * `notes` is expected newest first, which is what `byNewest` and the committed
 * index already guarantee.
 */
export function correlate(
  retunes: readonly Retuned[],
  notes: readonly PatchNote[],
): Correlation {
  const correlated = retunes.map((retune) => ({
    ...retune,
    explanation: findExplanation(retune, notes),
  }))

  return {
    retunes: correlated,
    explained: correlated.filter((r) => r.explanation !== null).length,
    unexplained: correlated.filter((r) => r.explanation === null).length,
  }
}

/**
 * Human-readable summary, for the sync pull request body.
 *
 * Leads with the unexplained count. A retune Valve documented is routine; one
 * they shipped silently is the thing worth a reviewer's attention.
 */
export function describeCorrelation(correlation: Correlation): string {
  if (correlation.retunes.length === 0) return 'No ability retunes to correlate.'

  const lines: string[] = []

  if (correlation.unexplained > 0) {
    lines.push(`### ${correlation.unexplained} retuned with no published note`)
    lines.push('')
    for (const retune of correlation.retunes) {
      if (retune.explanation) continue
      lines.push(`- ${retune.name} — ${retune.stat}: ${retune.from} → ${retune.to}`)
    }
    lines.push('')
  }

  if (correlation.explained > 0) {
    lines.push(`### ${correlation.explained} explained by patch notes`)
    lines.push('')
    for (const retune of correlation.retunes) {
      if (!retune.explanation) continue
      lines.push(
        `- ${retune.name} — ${retune.stat}: ${retune.from} → ${retune.to}` +
          `\n  ${retune.explanation.patch_title}: "${retune.explanation.text}"`,
      )
    }
  }

  return lines.join('\n').trim()
}
