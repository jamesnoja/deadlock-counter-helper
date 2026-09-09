/**
 * Parses Steam announcements into the patch note model.
 *
 * Pure and deterministic: no fetching, no filesystem. `scripts/sync-patches.mts`
 * supplies the payload, this decides what it means. Same split as
 * `normalise.ts` against `sync.mts`, and for the same reason — the interesting
 * logic stays testable against fixtures.
 */

import type { PatchBlock, PatchNote } from './patches-schema.ts'
import type { UpstreamForumPatch, UpstreamSteamNewsItem } from './upstream.ts'

/**
 * Titles we treat as patch notes.
 *
 * Valve's announcement feed also carries playtest invites, tournament news and
 * matchmaking essays. Matching on "update" keeps the changelog about changes,
 * and `Matchmaking Update` is genuinely one of those.
 */
const PATCH_TITLE = /update/i

/**
 * Steam BBCode we understand. Anything else is stripped to its text.
 *
 * Valve is not consistent about which they use. Most posts wrap each change in
 * its own `[p]`; the 08-12-2026 post puts all thirty in a single `[p]` separated
 * by newlines. Splitting on both is what makes the two shapes parse alike —
 * without it that post yields one 2,000-character "note" whose text mentions
 * half the roster, which then matches almost any correlation query.
 */
const BLOCK_SPLIT = /\[\/?p\]|\n/i

/**
 * `[ Urn / King of the Hill ]` — a section header. Steam escapes the opening
 * bracket, so the raw text is `\[ Urn / King of the Hill ]`.
 */
const SECTION = /^\\?\[\s*(.+?)\s*\]$/

/** A change line. Valve uses `-`; a few older posts use a bullet character. */
const NOTE = /^[-•]\s*/

/**
 * Strip BBCode tags and decode the handful of entities Steam emits.
 *
 * Deliberately total: an unrecognised tag loses its markup and keeps its text,
 * rather than throwing or leaking `[tag]` into the page.
 */
export function stripBbcode(input: string): string {
  return input
    .replace(/\[\/?(?:b|i|u|strike|h[1-6]|list|olist|quote|spoiler|noparse)\]/gi, '')
    .replace(/\[url=[^\]]*\]/gi, '')
    .replace(/\[\/url\]/gi, '')
    .replace(/\[img\][^[]*\[\/img\]/gi, '')
    .replace(/\[\*\]/gi, '- ')
    .replace(/\[\/?[a-z][^\]]*\]/gi, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

/**
 * `Minor Update - 08-22-2026` -> `08-22-2026`.
 *
 * The date is the distinguishing part; every title is otherwise some variation
 * of "update". Falls back to slugifying the whole title when there is no date,
 * so `Matchmaking Update` still gets a usable URL.
 */
export function toPatchSlug(title: string): string {
  const date = title.match(/(\d{2}-\d{2}-\d{4})/)
  if (date?.[1]) return date[1]
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Splits a BBCode body into typed, plain-text blocks. */
export function parseBlocks(contents: string): PatchBlock[] {
  const blocks: PatchBlock[] = []

  for (const raw of contents.split(BLOCK_SPLIT)) {
    const text = stripBbcode(raw)
    if (!text) continue

    const section = text.match(SECTION)
    if (section?.[1]) {
      blocks.push({ kind: 'section', text: section[1] })
      continue
    }

    if (NOTE.test(text)) {
      const body = text.replace(NOTE, '').trim()
      if (body) blocks.push({ kind: 'note', text: body })
      continue
    }

    blocks.push({ kind: 'text', text })
  }

  return blocks
}

/** True when an announcement looks like patch notes rather than an ad. */
export function isPatchAnnouncement(item: UpstreamSteamNewsItem): boolean {
  return PATCH_TITLE.test(item.title ?? '')
}

/**
 * Pairs a Steam announcement with its forum thread by publication date.
 *
 * Titles cannot be matched directly: Steam says `Minor Update - 06-30-2026`
 * where the forum says `06-30-2026 Update`. Dates are close but not equal —
 * the forum post is written after the Steam one — so this allows a window
 * rather than requiring an exact match, and takes the nearest inside it.
 */
export function findForumUrl(
  publishedAt: string,
  forumPatches: readonly UpstreamForumPatch[],
  windowDays = 3,
): string | null {
  const target = Date.parse(publishedAt)
  if (Number.isNaN(target)) return null

  const windowMs = windowDays * 24 * 60 * 60 * 1000
  let best: { link: string; distance: number } | null = null

  for (const patch of forumPatches) {
    if (!patch.link || !patch.pub_date) continue
    const at = Date.parse(patch.pub_date)
    if (Number.isNaN(at)) continue

    const distance = Math.abs(at - target)
    if (distance > windowMs) continue
    if (!best || distance < best.distance) best = { link: patch.link, distance }
  }

  return best?.link ?? null
}

/** Converts one Steam announcement into a patch note. */
export function toPatchNote(
  item: UpstreamSteamNewsItem,
  forumPatches: readonly UpstreamForumPatch[] = [],
): PatchNote | null {
  const title = item.title?.trim()
  const gid = item.gid?.trim()
  if (!title || !gid || !item.date) return null

  const publishedAt = new Date(item.date * 1000).toISOString()

  return {
    gid,
    slug: toPatchSlug(title),
    title,
    published_at: publishedAt,
    url: item.url ?? '',
    forum_url: findForumUrl(publishedAt, forumPatches),
    blocks: parseBlocks(item.contents ?? ''),
  }
}

/**
 * Newest first, then by gid so ordering is total.
 *
 * Two announcements sharing a timestamp is not hypothetical — Valve has posted
 * a patch and its hotfix in the same minute — and an unstable sort would make
 * the committed archive churn between syncs for no reason.
 */
export function byNewest(a: PatchNote, b: PatchNote): number {
  const delta = Date.parse(b.published_at) - Date.parse(a.published_at)
  return delta !== 0 ? delta : a.gid.localeCompare(b.gid)
}
