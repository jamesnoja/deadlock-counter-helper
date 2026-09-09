/**
 * The app's only door to patch notes.
 *
 * Reads the committed archive — never the network, same rule as `snapshot.ts`.
 * `npm run sync:patches` is the only thing that talks to Steam, which is what
 * makes builds reproducible and keeps the changelog up when Steam is not.
 */

import archive from '../../data/patches/notes.json' with { type: 'json' }

import { correlate, type Correlation } from './correlate.ts'
import type { Retuned } from './diff.ts'
import type { PatchArchive, PatchNote, PatchSummary } from './patches-schema.ts'

/** See `snapshot.ts` for why this asserts through `unknown`. */
const ARCHIVE = archive as unknown as PatchArchive

/** Newest first. */
export const PATCH_NOTES: PatchNote[] = ARCHIVE.notes ?? []

export const PATCH_SOURCES: Record<string, string> = ARCHIVE.sources ?? {}

const countNotes = (note: PatchNote) =>
  note.blocks.filter((block) => block.kind === 'note').length

/**
 * List view. Derived rather than committed, so it cannot disagree with the
 * notes it summarises.
 */
export const PATCH_SUMMARIES: PatchSummary[] = PATCH_NOTES.map((note) => ({
  gid: note.gid,
  slug: note.slug,
  title: note.title,
  published_at: note.published_at,
  note_count: countNotes(note),
}))

/**
 * Slugs are derived from titles, so two posts on one date would collide. Valve
 * has done that. First wins, which is the newest — and `patchSlugs` de-duplicates
 * so the route never tries to generate the same page twice.
 */
export function patchBySlug(slug: string): PatchNote | undefined {
  return PATCH_NOTES.find((note) => note.slug === slug)
}

export function patchSlugs(): string[] {
  return [...new Set(PATCH_NOTES.map((note) => note.slug))]
}

/** The most recent patch, for the homepage stamp and the changelog header. */
export const LATEST_PATCH: PatchNote | undefined = PATCH_NOTES[0]

/**
 * What the current snapshot diff means, in terms of what Valve published.
 *
 * Memoised because every changelog page asks the same question of the same two
 * committed files, and the answer cannot change between requests on a static
 * build.
 */
let cached: { key: readonly Retuned[]; value: Correlation } | null = null
export function correlateRetunes(retunes: readonly Retuned[]): Correlation {
  // Keyed on the array itself, not just "have we run once". There is only one
  // diff today, but a memo that ignores its argument is a trap for whoever adds
  // the second caller.
  if (cached?.key === retunes) return cached.value
  const value = correlate(retunes, PATCH_NOTES)
  cached = { key: retunes, value }
  return value
}
