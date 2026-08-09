import { describe, expect, it } from 'vitest'
import {
  COUNTER_GROUPS,
  HERO_COUNTERS,
  ITEM_NOTES,
  PUBLISHED_META,
  counterFor,
  groupFor,
  heroesWithoutCounters,
  noteFor,
  unacknowledgedGaps,
  ACKNOWLEDGED_GAPS,
} from './published.ts'
import { HEROES, ITEMS } from './snapshot.ts'

/**
 * The committed import, validated against the snapshot on every CI run.
 *
 * The point of resolving display names to `class_name` at import is that a
 * rename becomes a loud failure instead of silently missing advice. These are
 * what make it loud: the sync script can only check the data it fetched, but
 * the snapshot moves independently, so a rename landing tomorrow breaks here.
 */

const heroClassNames = new Set(HEROES.map((hero) => hero.class_name))
const itemClassNames = new Set(ITEMS.map((item) => item.class_name))
const rankedClassNames = new Set(ITEMS.filter((item) => item.ranked).map((item) => item.class_name))

describe('published references resolve against the snapshot', () => {
  it('names a hero that exists for every entry', () => {
    const unknown = HERO_COUNTERS.map((entry) => entry.hero).filter((name) => !heroClassNames.has(name))
    expect(unknown).toEqual([])
  })

  it('names an item that exists in every topCounters list', () => {
    const unknown = HERO_COUNTERS.flatMap((entry) =>
      entry.topCounters.filter((item) => !itemClassNames.has(item)),
    )
    expect([...new Set(unknown)]).toEqual([])
  })

  it('names an item that exists in every situation', () => {
    const unknown = HERO_COUNTERS.flatMap((entry) =>
      entry.situations.map((s) => s.priorityItem).filter((item) => !itemClassNames.has(item)),
    )
    expect([...new Set(unknown)]).toEqual([])
  })

  it('names an item that exists in every group and in every item note', () => {
    const unknown = [
      ...COUNTER_GROUPS.flatMap((group) => group.items),
      ...ITEM_NOTES.map((note) => note.item),
    ].filter((item) => !itemClassNames.has(item))
    expect([...new Set(unknown)]).toEqual([])
  })

  it('recommends only items ranked play can buy', () => {
    // Pointing someone at an item they cannot buy is worse than saying nothing —
    // the same rule the tag engine held to.
    const unbuyable = HERO_COUNTERS.flatMap((entry) =>
      entry.topCounters.filter((item) => !rankedClassNames.has(item)),
    )
    expect([...new Set(unbuyable)]).toEqual([])
  })

  it('references only groups it also defines', () => {
    const defined = new Set(COUNTER_GROUPS.map((group) => group.key))
    const unknown = HERO_COUNTERS.flatMap((entry) => entry.groups.filter((key) => !defined.has(key)))
    expect([...new Set(unknown)]).toEqual([])
  })
})

describe('published entries carry the content that justified the change', () => {
  it('gives every hero a summary, lane advice and at least one situation', () => {
    // This is the reason for replacing derivation. An entry without it is worth
    // less than the tags it replaced.
    const thin = HERO_COUNTERS.filter(
      (entry) => !entry.summary.trim() || entry.lanePhase.length === 0 || entry.situations.length === 0,
    ).map((entry) => entry.hero)
    expect(thin).toEqual([])
  })

  it('gives every hero at least three ranked counters to act on', () => {
    const thin = HERO_COUNTERS.filter((entry) => entry.topCounters.length < 3).map((entry) => entry.hero)
    expect(thin).toEqual([])
  })

  it('gives every situation a reason, since the UI shows it', () => {
    const missing = HERO_COUNTERS.flatMap((entry) =>
      entry.situations.filter((s) => !s.reason.trim()).map(() => entry.hero),
    )
    expect(missing).toEqual([])
  })
})

describe('provenance is recorded, not assumed', () => {
  it('records where the data came from and when', () => {
    expect(PUBLISHED_META.source_url).toMatch(/^https:\/\//)
    expect(PUBLISHED_META.source_name.trim().length).toBeGreaterThan(0)
    expect(Number.isNaN(Date.parse(PUBLISHED_META.retrieved_at))).toBe(false)
  })

  it('gives every hand-mapped name its evidence', () => {
    // An alias is a judgement. Without the reasoning it is indistinguishable
    // from a guess, and nobody can check it later.
    for (const alias of PUBLISHED_META.aliases) {
      expect(alias.evidence.trim().length, `no evidence for ${alias.from}`).toBeGreaterThan(0)
      expect(alias.from).not.toBe(alias.to)
    }
  })

  it('records what was dropped and which heroes it shortened', () => {
    for (const dropped of PUBLISHED_META.dropped) {
      expect(dropped.reason.trim().length, `no reason for ${dropped.name}`).toBeGreaterThan(0)
      expect(dropped.affected.length, `nothing affected by ${dropped.name}`).toBeGreaterThan(0)
    }
  })

  it('counts what it actually holds', () => {
    expect(PUBLISHED_META.counts).toEqual({
      heroes: HERO_COUNTERS.length,
      items: ITEM_NOTES.length,
      groups: COUNTER_GROUPS.length,
    })
  })
})

describe('lookups', () => {
  it('finds a hero, an item note and a group by key', () => {
    const first = HERO_COUNTERS[0]
    expect(first).toBeDefined()
    expect(counterFor(first!.hero)).toEqual(first)
    expect(noteFor(ITEM_NOTES[0]!.item)).toEqual(ITEM_NOTES[0])
    expect(groupFor(COUNTER_GROUPS[0]!.key)).toEqual(COUNTER_GROUPS[0])
  })

  it('returns undefined rather than throwing for something absent', () => {
    expect(counterFor('hero_not_real')).toBeUndefined()
    expect(noteFor('upgrade_not_real')).toBeUndefined()
    expect(groupFor('not_a_group')).toBeUndefined()
  })

  it('has no coverage gap nobody has looked at', () => {
    // Fails once when a hero arrives uncovered, and is cleared either by the
    // source publishing them or by acknowledging the gap in
    // data/counters/acknowledged-gaps.json. See docs/NEW-HERO.md.
    expect(unacknowledgedGaps()).toEqual([])
  })

  it('reports the uncovered heroes it knows about', () => {
    // heroesWithoutCounters is what the UI reads to decide whether to show the
    // empty state, so it must keep listing an acknowledged gap. Acknowledging
    // one silences the build, not the page.
    for (const className of ACKNOWLEDGED_GAPS) {
      expect(heroesWithoutCounters()).toContain(className)
    }
  })
})
