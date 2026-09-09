import { describe, expect, it } from 'vitest'

import {
  correlate,
  describeCorrelation,
  findExplanation,
  noteExplains,
  numbersIn,
} from './correlate.ts'
import type { Retuned } from './diff.ts'
import type { PatchNote } from './patches-schema.ts'

const retune = (over: Partial<Retuned> = {}): Retuned => ({
  class_name: 'ability_unicorn_dazzlingorb',
  name: 'Shining Wonder',
  stat: 'Damage',
  from: 165,
  to: 140,
  ...over,
})

const note = (over: Partial<PatchNote> = {}): PatchNote => ({
  gid: '1',
  slug: '08-22-2026',
  title: 'Minor Update - 08-22-2026',
  published_at: '2026-08-22T21:40:46.000Z',
  url: 'https://steamcommunity.com/x',
  forum_url: null,
  blocks: [{ kind: 'note', text: 'Celeste: Shining Wonder damage reduced from 165 to 140' }],
  ...over,
})

describe('numbersIn', () => {
  it('reads values through the units and signs Valve writes', () => {
    // The same value appears as -22%, 32s, +8% and bare 165 across four posts.
    expect(numbersIn('increased from -22% to -25%')).toEqual([-22, -25])
    expect(numbersIn('cooldown increased from 32s to 34s')).toEqual([32, 34])
    expect(numbersIn('Spirit Amp per stack reduced from +8% to +7%')).toEqual([8, 7])
    expect(numbersIn('duration from 2 to 2.2')).toEqual([2, 2.2])
  })

  it('returns nothing for prose', () => {
    expect(numbersIn('Fixed a crash on map load')).toEqual([])
  })
})

describe('noteExplains', () => {
  it('accepts a line carrying the name and both endpoints', () => {
    expect(
      noteExplains('Celeste: Shining Wonder damage reduced from 165 to 140', retune()),
    ).toBe(true)
  })

  it('rejects a line that names the ability but describes another stat', () => {
    // Same ability, same patch, different change. Name alone is not enough.
    expect(
      noteExplains('Celeste: Shining Wonder bounce range reduced from 17.5m to 16.5m', retune()),
    ).toBe(false)
  })

  it('rejects a passing mention in an unrelated list', () => {
    // Real line from 2026-05-22, listing six abilities that shared a zoom bug.
    expect(
      noteExplains(
        'Fixed the following abilities taking you out of zoom: Blasted, Gloom Bombs, Shining Wonder',
        retune(),
      ),
    ).toBe(false)
  })

  it('rejects a near miss that shares only the from value', () => {
    // Stalker's Mark really went 24 -> 26 with no note, while an older post
    // says "cooldown increased from 20s to 24s". Matching on `from` alone would
    // credit the change to the wrong patch.
    const mark = retune({ name: "Stalker's Mark", stat: 'AbilityCooldown', from: 24, to: 26 })
    expect(noteExplains("Drifter: Stalker's Mark cooldown increased from 20s to 24s", mark)).toBe(
      false,
    )
  })

  it('matches a negative endpoint written with a percent sign', () => {
    const riposte = retune({ name: 'Riposte', stat: 'MeleeResistReduction', from: -22, to: -25 })
    expect(
      noteExplains('Apollo: Riposte melee resist reduction increased from -22% to -25%', riposte),
    ).toBe(true)
  })

  it('matches a sign flip, where both endpoints share a magnitude', () => {
    const card = retune({ name: 'Card Trick', stat: 'ClubSlowPercent', from: -30, to: 30 })
    expect(noteExplains('Wraith: Card Trick club slow changed from -30% to 30%', card)).toBe(true)
  })
})

describe('findExplanation', () => {
  it('returns the patch that explains the change', () => {
    const found = findExplanation(retune(), [note()])
    expect(found?.patch_slug).toBe('08-22-2026')
    expect(found?.text).toBe('Celeste: Shining Wonder damage reduced from 165 to 140')
  })

  it('takes the newest when the same change is described twice', () => {
    // Callers pass newest first. A hotfix restating a value should win over the
    // original post that introduced it.
    const older = note({ gid: '0', slug: '07-28-2026', published_at: '2026-07-28T00:00:00.000Z' })
    expect(findExplanation(retune(), [note(), older])?.patch_slug).toBe('08-22-2026')
  })

  it('returns null when nothing explains it', () => {
    expect(findExplanation(retune({ name: 'Mini Turret', from: 90, to: 100 }), [note()])).toBeNull()
  })

  it('ignores section headers and prose blocks', () => {
    const prose = note({
      blocks: [
        { kind: 'section', text: 'Shining Wonder damage reduced from 165 to 140' },
        { kind: 'text', text: 'Celeste: Shining Wonder damage reduced from 165 to 140' },
      ],
    })
    expect(findExplanation(retune(), [prose])).toBeNull()
  })
})

describe('correlate', () => {
  it('counts both halves', () => {
    const result = correlate(
      [retune(), retune({ name: 'Mini Turret', stat: 'TurretBaseHealth', from: 90, to: 100 })],
      [note()],
    )
    expect(result.explained).toBe(1)
    expect(result.unexplained).toBe(1)
    expect(result.retunes[1]?.explanation).toBeNull()
  })

  it('handles an empty diff without inventing entries', () => {
    expect(correlate([], [note()])).toEqual({ retunes: [], explained: 0, unexplained: 0 })
  })
})

describe('describeCorrelation', () => {
  it('leads with what nobody documented', () => {
    const summary = describeCorrelation(
      correlate([retune({ name: 'Mini Turret', from: 90, to: 100 }), retune()], [note()]),
    )
    // The silent change is the one a reviewer needs to see first.
    expect(summary.indexOf('no published note')).toBeLessThan(summary.indexOf('explained by'))
    expect(summary).toContain('Mini Turret')
  })

  it('says so plainly when there is nothing to correlate', () => {
    expect(describeCorrelation(correlate([], []))).toBe('No ability retunes to correlate.')
  })

  it('omits the unexplained heading when everything is accounted for', () => {
    const summary = describeCorrelation(correlate([retune()], [note()]))
    expect(summary).not.toContain('no published note')
    expect(summary).toContain('1 explained by patch notes')
  })
})
