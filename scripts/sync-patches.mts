#!/usr/bin/env node
/**
 * Refreshes data/patches/ from Valve's Steam announcement feed.
 *
 *   npm run sync:patches
 *
 * Run by hand, and daily by CI alongside `npm run sync`. Like the snapshot, the
 * result is committed so builds are reproducible and a Steam outage cannot take
 * the changelog down.
 *
 * **Append-only.** A patch note is a historical record — once Valve has posted
 * it, it does not change, and the archive is the only place early notes exist
 * once they fall off the feed's window. Merging keeps what the feed has
 * forgotten, and the file is rewritten only when its content actually differs,
 * so re-running produces no diff.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { byNewest, isPatchAnnouncement, toPatchNote } from '../src/data/patches.ts'
import type { PatchArchive, PatchNote } from '../src/data/patches-schema.ts'
import {
  ENDPOINTS,
  STEAM_NEWS_ENDPOINT,
  type UpstreamForumPatch,
  type UpstreamSteamNews,
} from '../src/data/upstream.ts'
import { PATCH_DIR, readPatchArchive } from './patch-archive.mts'

const serialise = (value: unknown) => JSON.stringify(value, null, 2) + '\n'

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { accept: 'application/json' } })
  if (!response.ok) throw new Error(`GET ${url} -> ${response.status} ${response.statusText}`)
  return (await response.json()) as T
}

function readIfPresent(path: string): string | null {
  try {
    return readFileSync(path, 'utf8')
  } catch {
    return null
  }
}

async function main() {
  console.log('Fetching Steam announcements...')

  const [news, forumPatches] = await Promise.all([
    fetchJson<UpstreamSteamNews>(STEAM_NEWS_ENDPOINT),
    // Only for the forum permalink. A failure here costs attribution, not the
    // notes themselves, so it must not fail the sync.
    fetchJson<UpstreamForumPatch[]>(ENDPOINTS.patches).catch(() => [] as UpstreamForumPatch[]),
  ])

  const items = news.appnews?.newsitems ?? []
  const announcements = items.filter(isPatchAnnouncement)
  console.log(`  announcements: ${items.length}  patch notes: ${announcements.length}`)

  const fetched = announcements
    .map((item) => toPatchNote(item, forumPatches))
    .filter((note): note is PatchNote => note !== null)

  if (fetched.length === 0) throw new Error('No patch notes parsed — refusing to write an empty archive.')

  /**
   * Fetched wins on conflict, so a corrected post is picked up, but archived
   * entries the feed no longer carries are kept. Keyed on gid rather than slug:
   * Valve has titled two posts the same date before, and a slug collision would
   * silently drop one.
   */
  const merged = new Map<string, PatchNote>()
  for (const note of readPatchArchive()) merged.set(note.gid, note)
  for (const note of fetched) merged.set(note.gid, note)

  const notes = [...merged.values()].sort(byNewest)

  /**
   * One file, not one per patch.
   *
   * The archive started as `notes/<gid>.json`, which diffs beautifully but
   * cannot be read by the app: `src/` loads data through static JSON imports
   * (see `snapshot.ts`) and there is no way to statically import a directory
   * that grows. The alternatives were an `fs` read inside a server component,
   * breaking that convention, or committing a combined bundle alongside the
   * per-file archive and carrying 490KB of the same notes twice. Consolidating
   * is the honest fix: one source of truth, loadable the same way as everything
   * else. Insertions land at the top of a newest-first array, so the diff for a
   * new patch is still just the new block.
   */
  mkdirSync(PATCH_DIR, { recursive: true })

  const archive: PatchArchive = {
    sources: { steam: STEAM_NEWS_ENDPOINT, forum: ENDPOINTS.patches },
    notes,
  }

  const notesPath = join(PATCH_DIR, 'notes.json')
  const next = serialise(archive)
  const written = readIfPresent(notesPath) === next ? 0 : notes.length
  if (written > 0) writeFileSync(notesPath, next, 'utf8')

  const newest = notes[0]
  console.log(
    written === 0
      ? `No change. ${notes.length} notes archived.`
      : `Updated. ${notes.length} notes archived.`,
  )
  if (newest) console.log(`  newest: ${newest.title} (${newest.published_at.slice(0, 10)})`)

  const orphans = notes.filter((note) => note.forum_url === null).length
  if (orphans) console.log(`  ${orphans} without a matching forum thread (Steam link only).`)

  if (process.env.GITHUB_OUTPUT) {
    writeFileSync(process.env.GITHUB_OUTPUT, `patches_changed=${written > 0 ? 'true' : 'false'}\n`, {
      flag: 'a',
    })
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
