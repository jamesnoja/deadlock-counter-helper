import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { ENHANCEMENTS, EPICS, PRIORITIES, STATUSES } from './enhancements.mjs'
import { BACKLOG_PATH, renderBacklog } from './render-backlog.mjs'

/**
 * `enhancements.mjs` is the source of truth for both docs/BACKLOG.md and the seeded
 * GitHub issues. A bad `depends` reference or a duplicate id otherwise surfaces as a
 * confusing failure at seed time, against a live repo. Catch it here instead.
 */

const ids = ENHANCEMENTS.map((e) => e.id)
const idSet = new Set(ids)

describe('enhancement ids', () => {
  it('are unique', () => {
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i)
    expect(duplicates).toEqual([])
  })

  it('match the E<nn> format', () => {
    expect(ids.filter((id) => !/^E\d{2}$/.test(id))).toEqual([])
  })
})

describe('enhancement fields', () => {
  it('reference a known epic', () => {
    const unknown = ENHANCEMENTS.filter((e) => !(e.epic in EPICS)).map((e) => `${e.id}:${e.epic}`)
    expect(unknown).toEqual([])
  })

  it('reference a known priority', () => {
    const unknown = ENHANCEMENTS.filter((e) => !(e.priority in PRIORITIES)).map(
      (e) => `${e.id}:${e.priority}`,
    )
    expect(unknown).toEqual([])
  })

  it('use a known status when they declare one', () => {
    const unknown = ENHANCEMENTS.filter((e) => e.status !== undefined && !(e.status in STATUSES)).map(
      (e) => `${e.id}:${e.status}`,
    )
    expect(unknown).toEqual([])
  })

  it('have a non-empty title and body', () => {
    const empty = ENHANCEMENTS.filter((e) => !e.title?.trim() || !e.body?.trim()).map((e) => e.id)
    expect(empty).toEqual([])
  })
})

describe('dependencies', () => {
  it('resolve to enhancements that exist', () => {
    const dangling = ENHANCEMENTS.flatMap((e) =>
      e.depends.filter((d) => !idSet.has(d)).map((d) => `${e.id} -> ${d}`),
    )
    expect(dangling).toEqual([])
  })

  it('are never self-referential', () => {
    expect(ENHANCEMENTS.filter((e) => e.depends.includes(e.id)).map((e) => e.id)).toEqual([])
  })

  it('form no cycles', () => {
    const byId = new Map(ENHANCEMENTS.map((e) => [e.id, e]))
    const state = new Map<string, 'visiting' | 'done'>()
    const cycles: string[] = []

    const walk = (id: string, path: string[]) => {
      if (state.get(id) === 'done') return
      if (state.get(id) === 'visiting') {
        cycles.push([...path.slice(path.indexOf(id)), id].join(' -> '))
        return
      }
      state.set(id, 'visiting')
      for (const dep of byId.get(id)?.depends ?? []) walk(dep, [...path, id])
      state.set(id, 'done')
    }

    for (const id of ids) walk(id, [])
    expect(cycles).toEqual([])
  })

  it('point backwards, so the backlog reads in dependency order', () => {
    const forwards = ENHANCEMENTS.flatMap((e) =>
      e.depends.filter((d) => d >= e.id).map((d) => `${e.id} -> ${d}`),
    )
    expect(forwards).toEqual([])
  })
})

describe('status', () => {
  it('is never `done` while something it depends on is not', () => {
    const byId = new Map(ENHANCEMENTS.map((e) => [e.id, e]))
    const inconsistent = ENHANCEMENTS.filter((e) => e.status === 'done').flatMap((e) =>
      e.depends.filter((d) => byId.get(d)?.status !== 'done').map((d) => `${e.id} done but ${d} is not`),
    )
    expect(inconsistent).toEqual([])
  })
})

describe('docs/BACKLOG.md', () => {
  it('matches what the renderer produces', () => {
    // Fails when enhancements.mjs changed without running `npm run backlog`.
    const committed = readFileSync(BACKLOG_PATH, 'utf8').replace(/\r\n/g, '\n')
    expect(renderBacklog()).toEqual(committed)
  })
})

describe('label metadata', () => {
  it('gives every epic and priority a 6-digit hex colour', () => {
    const bad = [...Object.values(EPICS), ...Object.values(PRIORITIES)]
      .filter((v) => !/^[0-9a-f]{6}$/.test(v.color))
      .map((v) => v.label)
    expect(bad).toEqual([])
  })
})
