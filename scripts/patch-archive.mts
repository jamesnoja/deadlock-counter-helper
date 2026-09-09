/**
 * Reads the committed patch note archive.
 *
 * Shared by `sync-patches.mts`, which merges into it, and `describe-changes.mts`,
 * which correlates against it. Reads the directory rather than trusting
 * `index.json`, so a note whose index entry is missing is still found — the
 * files are the record, the index is a convenience.
 */

import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { byNewest } from '../src/data/patches.ts'
import type { PatchNote } from '../src/data/patches-schema.ts'

export const PATCH_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'patches')
export const NOTES_DIR = join(PATCH_DIR, 'notes')

/** Newest first, which is what correlation expects. Empty before the first sync. */
export function readPatchArchive(): PatchNote[] {
  let files: string[]
  try {
    files = readdirSync(NOTES_DIR).filter((name) => name.endsWith('.json'))
  } catch {
    return []
  }

  const notes: PatchNote[] = []
  for (const file of files) {
    try {
      notes.push(JSON.parse(readFileSync(join(NOTES_DIR, file), 'utf8')) as PatchNote)
    } catch {
      // A half-written file should cost one note, not the whole changelog.
      console.warn(`Skipping unreadable patch note: ${file}`)
    }
  }

  return notes.sort(byNewest)
}
