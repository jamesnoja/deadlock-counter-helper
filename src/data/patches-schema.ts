/**
 * Patch notes — the narrative half of the changelog.
 *
 * The computed snapshot diff (`diff.ts`) is the reliable signal that something
 * moved. This is what Valve said about it, when they said anything at all. The
 * two are deliberately separate: game data changes without a post, and posts
 * arrive describing changes we already detected days earlier.
 *
 * **Source is Steam, not the forum RSS.** `/v1/patches` returns the XenForo
 * feed, whose `content_encoded` is a truncated preview ending in "Read more" or
 * a Steam unfurl card — 677 to 1847 characters where the real notes run to
 * 13,000. It is also stale: the newest entry there is `06-30-2026`, published
 * 2026-07-28, while Steam carries `Minor Update - 08-22-2026` describing the
 * exact Celeste retunes our own sync detected. We keep the forum link for
 * attribution and read the body from Steam.
 *
 * **No HTML reaches this model.** Steam announcements are BBCode (`[p]`, `[b]`),
 * not markup, so parsing produces plain text in typed blocks. Same reasoning as
 * `toPlainText` in `normalise.ts`: nothing downstream is ever tempted to reach
 * for dangerouslySetInnerHTML, and diffs stay readable.
 */

/**
 * One line of a patch note.
 *
 * `section` is a `[ General ]` style header, `note` a `- ` prefixed change, and
 * `text` anything else — an intro line, a sign-off. Blank spacer paragraphs are
 * dropped at parse time rather than modelled.
 */
export interface PatchBlock {
  kind: 'section' | 'note' | 'text'
  text: string
}

export interface PatchNote {
  /** Stable id. Steam's `gid`, which survives edits to the title. */
  gid: string
  /** URL slug, derived from the title. `Minor Update - 08-22-2026` -> `08-22-2026`. */
  slug: string
  title: string
  /** ISO 8601, converted from Steam's unix seconds. */
  published_at: string
  /** Steam's own permalink. Canonical, and where attribution points. */
  url: string
  /**
   * The matching forum thread, when `/v1/patches` carries one. Matched on date
   * rather than title, because the two sources word titles differently
   * (`06-30-2026 Update` against `Minor Update - 06-30-2026`).
   */
  forum_url: string | null
  blocks: PatchBlock[]
}

/**
 * Index entry. Deliberately not the whole note — the list page renders 30 of
 * these and has no use for several thousand lines of body text.
 */
export interface PatchIndexEntry {
  gid: string
  slug: string
  title: string
  published_at: string
  /** Count of `note` blocks, so the list can say how large a patch was. */
  note_count: number
}

export interface PatchArchiveMeta {
  sources: Record<string, string>
  /** Newest first, so the list page needs no sorting. */
  patches: PatchIndexEntry[]
  fetched_at: string
}
