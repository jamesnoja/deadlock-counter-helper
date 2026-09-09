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
 * once they fall off the feed's 100-entry window. Existing files are rewritten
 * only when their content actually differs, so re-running produces no diff.
 */

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { byNewest, isPatchAnnouncement, toPatchNote } from '../src/data/patches.ts'
import type { PatchArchiveMeta, PatchIndexEntry, PatchNote } from '../src/data/patches-schema.ts'
import {
  ENDPOINTS,
  STEAM_NEWS_ENDPOINT,
  type UpstreamForumPatch,
  type UpstreamSteamNews,
} from '../src/data/upstream.ts'

const PATCH_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'patches')
const NOTES_DIR = join(PATCH_DIR, 'notes')

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

/** Notes already committed, so entries that fall off the feed are not lost. */
function readArchived(): PatchNote[] {
  let files: string[]
  try {
    files = readdirSync(NOTES_DIR).filter((name) => name.endsWith('.json'))
  } catch {
    return []
  }

  const notes: PatchNote[] = []
  for (const file of files) {
    const raw = readIfPresent(join(NOTES_DIR, file))
    if (raw) notes.push(JSON.parse(raw) as PatchNote)
  }
  return notes
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
  for (const note of readArchived()) merged.set(note.gid, note)
  for (const note of fetched) merged.set(note.gid, note)

  const notes = [...merged.values()].sort(byNewest)

  mkdirSync(NOTES_DIR, { recursive: true })

  let written = 0
  for (const note of notes) {
    const path = join(NOTES_DIR, `${note.gid}.json`)
    const next = serialise(note)
    if (readIfPresent(path) === next) continue
    writeFileSync(path, next, 'utf8')
    written++
  }

  const index: PatchIndexEntry[] = notes.map((note) => ({
    gid: note.gid,
    slug: note.slug,
    title: note.title,
    published_at: note.published_at,
    note_count: note.blocks.filter((block) => block.kind === 'note').length,
  }))

  const metaPath = join(PATCH_DIR, 'index.json')
  const previousMeta = readIfPresent(metaPath)
  const previousIndex = previousMeta
    ? (JSON.parse(previousMeta) as PatchArchiveMeta).patches
    : null

  // Same reasoning as the snapshot's synced_at: only advance the clock when
  // something moved, so the daily job does not open a pull request whose entire
  // diff is a timestamp.
  const indexUnchanged = previousIndex !== null && serialise(previousIndex) === serialise(index)
  const fetchedAt = indexUnchanged
    ? (JSON.parse(previousMeta!) as PatchArchiveMeta).fetched_at
    : new Date().toISOString()

  const meta: PatchArchiveMeta = {
    sources: { steam: STEAM_NEWS_ENDPOINT, forum: ENDPOINTS.patches },
    patches: index,
    fetched_at: fetchedAt,
  }
  writeFileSync(metaPath, serialise(meta), 'utf8')

  const newest = notes[0]
  console.log(
    written === 0
      ? `No change. ${notes.length} notes archived.`
      : `Wrote ${written} note${written === 1 ? '' : 's'}. ${notes.length} archived.`,
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
