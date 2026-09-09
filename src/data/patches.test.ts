import { describe, expect, it } from 'vitest'

import {
  byNewest,
  findForumUrl,
  isPatchAnnouncement,
  parseBlocks,
  stripBbcode,
  toPatchNote,
  toPatchSlug,
} from './patches.ts'
import type { PatchNote } from './patches-schema.ts'
import type { UpstreamForumPatch, UpstreamSteamNewsItem } from './upstream.ts'

/**
 * Verbatim from the Steam announcement feed, 2026-08-22. Kept exact — the
 * escaped `\[` and run-together `[/p][p]` are the two things most likely to
 * break a parser, and paraphrasing the fixture would hide that.
 */
const REAL_BODY =
  '[p][b]\\[ Urn / King of the Hill ][/b][/p][p][/p]' +
  '[p]- King of the Hill objective has been rethemed and renamed to "Unstable Rift"[/p]' +
  '[p]- Celeste: Dazzling Trick cooldown increased from 32s to 34s[/p]' +
  '[p]- Celeste: Shining Wonder damage reduced from 165 to 140[/p]'

const steamItem = (over: Partial<UpstreamSteamNewsItem> = {}): UpstreamSteamNewsItem => ({
  gid: '5390000000000000001',
  title: 'Minor Update - 08-22-2026',
  url: 'https://steamcommunity.com/games/1422450/announcements/detail/1',
  contents: REAL_BODY,
  feedname: 'steam_community_announcements',
  date: Date.parse('2026-08-22T21:40:46Z') / 1000,
  ...over,
})

describe('stripBbcode', () => {
  it('removes formatting tags but keeps their text', () => {
    expect(stripBbcode('[b]General[/b]')).toBe('General')
  })

  it('decodes the entities Steam emits', () => {
    expect(stripBbcode('&quot;Unstable Rift&quot; &amp; friends')).toBe('"Unstable Rift" & friends')
    expect(stripBbcode('Valve&#039;s update')).toBe("Valve's update")
  })

  it('drops images rather than leaking their urls as text', () => {
    expect(stripBbcode('before[img]https://example.com/a.png[/img]after')).toBe('beforeafter')
  })

  it('keeps link text and drops the url wrapper', () => {
    expect(stripBbcode('[url=https://example.com]patch notes[/url]')).toBe('patch notes')
  })

  it('strips an unrecognised tag without losing its content', () => {
    // Total by design: a new Steam tag should cost formatting, never text.
    expect(stripBbcode('[newtag]still readable[/newtag]')).toBe('still readable')
  })
})

describe('parseBlocks', () => {
  it('classifies sections, notes and prose from a real body', () => {
    expect(parseBlocks(REAL_BODY)).toEqual([
      { kind: 'section', text: 'Urn / King of the Hill' },
      { kind: 'note', text: 'King of the Hill objective has been rethemed and renamed to "Unstable Rift"' },
      { kind: 'note', text: 'Celeste: Dazzling Trick cooldown increased from 32s to 34s' },
      { kind: 'note', text: 'Celeste: Shining Wonder damage reduced from 165 to 140' },
    ])
  })

  it('drops the empty spacer paragraphs Valve puts under section headers', () => {
    expect(parseBlocks('[p][/p][p][/p]')).toEqual([])
  })

  it('treats a bullet character as a note, not prose', () => {
    expect(parseBlocks('[p]• Something changed[/p]')).toEqual([
      { kind: 'note', text: 'Something changed' },
    ])
  })

  it('keeps unprefixed prose as text', () => {
    expect(parseBlocks('[p]Thanks for playing.[/p]')).toEqual([
      { kind: 'text', text: 'Thanks for playing.' },
    ])
  })

  it('returns nothing for an empty body rather than throwing', () => {
    expect(parseBlocks('')).toEqual([])
  })
})

describe('toPatchSlug', () => {
  it('uses the date, which is the only distinguishing part of a title', () => {
    expect(toPatchSlug('Minor Update - 08-22-2026')).toBe('08-22-2026')
    expect(toPatchSlug('Gameplay Update - 03-06-2026')).toBe('03-06-2026')
  })

  it('falls back to the title when there is no date', () => {
    expect(toPatchSlug('Matchmaking Update')).toBe('matchmaking-update')
  })
})

describe('isPatchAnnouncement', () => {
  it('accepts updates', () => {
    expect(isPatchAnnouncement(steamItem())).toBe(true)
    expect(isPatchAnnouncement(steamItem({ title: 'Matchmaking Update' }))).toBe(true)
  })

  it('rejects the press coverage and tournament posts on the same feed', () => {
    expect(isPatchAnnouncement(steamItem({ title: 'Deadlock Playtest Invites' }))).toBe(false)
    expect(isPatchAnnouncement(steamItem({ title: '' }))).toBe(false)
  })
})

describe('findForumUrl', () => {
  const forum: UpstreamForumPatch[] = [
    {
      title: '08-22-2026 Update',
      pub_date: '2026-08-23T10:00:00Z',
      link: 'https://forums.playdeadlock.com/threads/a.1/',
    },
    {
      title: '06-30-2026 Update',
      pub_date: '2026-07-28T20:28:07Z',
      link: 'https://forums.playdeadlock.com/threads/b.2/',
    },
  ]

  it('matches on date, because the two sources word titles differently', () => {
    // Steam: "Minor Update - 08-22-2026". Forum: "08-22-2026 Update".
    expect(findForumUrl('2026-08-22T21:40:46Z', forum)).toBe(
      'https://forums.playdeadlock.com/threads/a.1/',
    )
  })

  it('returns null when nothing falls inside the window', () => {
    expect(findForumUrl('2026-01-01T00:00:00Z', forum)).toBeNull()
  })

  it('returns null rather than guessing when the forum feed is empty', () => {
    // The forum RSS lags weeks behind Steam, so this is the common case.
    expect(findForumUrl('2026-08-22T21:40:46Z', [])).toBeNull()
  })

  it('takes the nearest when two threads fall inside the window', () => {
    const crowded: UpstreamForumPatch[] = [
      { pub_date: '2026-08-24T00:00:00Z', link: 'far' },
      { pub_date: '2026-08-22T23:00:00Z', link: 'near' },
    ]
    expect(findForumUrl('2026-08-22T21:40:46Z', crowded)).toBe('near')
  })
})

describe('toPatchNote', () => {
  it('converts a real announcement', () => {
    const note = toPatchNote(steamItem())
    expect(note).not.toBeNull()
    expect(note?.slug).toBe('08-22-2026')
    expect(note?.published_at).toBe('2026-08-22T21:40:46.000Z')
    expect(note?.blocks.filter((b) => b.kind === 'note')).toHaveLength(3)
  })

  it('rejects an item with no gid, so the archive is never keyed on undefined', () => {
    expect(toPatchNote(steamItem({ gid: undefined }))).toBeNull()
    expect(toPatchNote(steamItem({ date: undefined }))).toBeNull()
    expect(toPatchNote(steamItem({ title: '   ' }))).toBeNull()
  })

  it('leaves forum_url null when there is no match', () => {
    expect(toPatchNote(steamItem())?.forum_url).toBeNull()
  })
})

describe('byNewest', () => {
  const note = (gid: string, published_at: string): PatchNote => ({
    gid,
    slug: gid,
    title: gid,
    published_at,
    url: '',
    forum_url: null,
    blocks: [],
  })

  it('sorts newest first', () => {
    const sorted = [
      note('a', '2026-01-01T00:00:00.000Z'),
      note('b', '2026-08-22T00:00:00.000Z'),
    ].sort(byNewest)
    expect(sorted.map((n) => n.gid)).toEqual(['b', 'a'])
  })

  it('breaks ties on gid so the committed archive does not churn', () => {
    const same = '2026-08-22T00:00:00.000Z'
    const sorted = [note('z', same), note('a', same)].sort(byNewest)
    expect(sorted.map((n) => n.gid)).toEqual(['a', 'z'])
  })
})
