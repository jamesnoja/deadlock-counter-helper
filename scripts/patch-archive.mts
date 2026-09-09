/**
 * Reads the committed patch note archive from the script side.
 *
 * `src/data/patch-archive.ts` is the app's door to the same file; this one
 * exists because the sync scripts run before the file is guaranteed to exist and
 * must degrade to empty rather than fail to import.
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { PatchArchive, PatchNote } from '../src/data/patches-schema.ts'

export const PATCH_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'patches')
export const NOTES_PATH = join(PATCH_DIR, 'notes.json')

/** Newest first, which is what correlation expects. Empty before the first sync. */
export function readPatchArchive(): PatchNote[] {
  try {
    return (JSON.parse(readFileSync(NOTES_PATH, 'utf8')) as PatchArchive).notes ?? []
  } catch {
    return []
  }
}
