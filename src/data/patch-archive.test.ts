import { describe, expect, it } from 'vitest'

import {
  LATEST_PATCH,
  PATCH_NOTES,
  PATCH_SOURCES,
  PATCH_SUMMARIES,
  patchBySlug,
  patchSlugs,
} from './patch-archive.ts'

/**
 * Validates the committed archive, the way `snapshot.test.ts` validates the
 * committed snapshot. The type assertion in the loader is not the safety net;
 * this is — it runs in CI against whatever the sync actually wrote.
 */
describe('the committed patch archive', () => {
  it('has notes', () => {
    expect(PATCH_NOTES.length).toBeGreaterThan(0)
  })

  it('records where it came from', () => {
    expect(PATCH_SOURCES.steam).toContain('ISteamNews')
  })

  it('is newest first', () => {
    const dates = PATCH_NOTES.map((note) => Date.parse(note.published_at))
    expect(dates).toEqual([...dates].sort((a, b) => b - a))
  })

  it('gives every note the fields the routes read', () => {
    for (const note of PATCH_NOTES) {
      expect(note.gid, note.title).toBeTruthy()
      expect(note.slug, note.title).toBeTruthy()
      expect(note.url, note.title).toContain('http')
      expect(Number.isNaN(Date.parse(note.published_at)), note.title).toBe(false)
    }
  })

  it('has unique gids', () => {
    const gids = PATCH_NOTES.map((note) => note.gid)
    expect(new Set(gids).size).toBe(gids.length)
  })

  it('generates one page per slug even when two patches share one', () => {
    // Slugs come from titles, so a same-date pair would collide. The route must
    // never be asked to build the same path twice.
    const slugs = patchSlugs()
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('resolves every generated slug to a note', () => {
    for (const slug of patchSlugs()) expect(patchBySlug(slug), slug).toBeDefined()
  })

  it('returns undefined for an unknown slug rather than throwing', () => {
    expect(patchBySlug('not-a-patch')).toBeUndefined()
  })

  it('summarises without losing anything', () => {
    expect(PATCH_SUMMARIES).toHaveLength(PATCH_NOTES.length)
    expect(PATCH_SUMMARIES[0]?.gid).toBe(LATEST_PATCH?.gid)
  })

  it('counts only note blocks in a summary', () => {
    const summary = PATCH_SUMMARIES[0]!
    const note = PATCH_NOTES[0]!
    expect(summary.note_count).toBe(note.blocks.filter((b) => b.kind === 'note').length)
  })

  it('parsed real bodies into changes, not one merged blob', () => {
    // Regression guard for the [p]-versus-newline bug: before it was fixed the
    // 08-12 post parsed as a single note containing thirty changes.
    const biggest = Math.max(...PATCH_SUMMARIES.map((p) => p.note_count))
    expect(biggest).toBeGreaterThan(20)
    for (const note of PATCH_NOTES) {
      for (const block of note.blocks) {
        expect(block.text, `${note.title}: block should be one line`).not.toContain('\n')
      }
    }
  })
})
