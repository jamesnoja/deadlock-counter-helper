import { describe, expect, it } from 'vitest'
import { CHANGES, needsReview, provenanceFor, provenanceSummary } from './provenance.ts'
import { ABILITIES, HEROES, ITEMS } from './snapshot.ts'

describe('provenance', () => {
  it('reports verified for anything the last change did not touch', () => {
    expect(provenanceFor('definitely_not_in_the_change_record')).toBe('verified')
  })

  it('reports stale for everything the last change flagged', () => {
    for (const className of CHANGES.needsReview) {
      expect(provenanceFor(className)).toBe('stale')
      expect(needsReview(className)).toBe(true)
    }
  })

  it('only flags entities that exist in the snapshot', () => {
    // A flag pointing at nothing would render an amber dot next to no item.
    const known = new Set([
      ...HEROES.map((h) => h.class_name),
      ...ABILITIES.map((a) => a.class_name),
      ...ITEMS.map((i) => i.class_name),
    ])
    expect(CHANGES.needsReview.filter((className) => !known.has(className))).toEqual([])
  })

  it('summarises the patch stamp from snapshot metadata, never by hand', () => {
    const summary = provenanceSummary()
    expect(summary.patchTitle).not.toBe('')
    expect(summary.syncedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(summary.flaggedCount).toBe(CHANGES.needsReview.length)
  })
})
