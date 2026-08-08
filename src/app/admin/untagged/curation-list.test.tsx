import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { CurationList } from './curation-list.tsx'
import type { CurationEntry } from '@/data/overlay.ts'

/**
 * The strength worklist rests on one non-obvious claim: that agreeing with the
 * default is expressible. Selecting `situational` on an entry already set to
 * `situational` fires no change event, so without "Confirm as-is" the entry
 * could never be marked curated and would reappear on every visit.
 *
 * These test that claim, not the markup.
 */

const entry: CurationEntry = {
  class_name: 'upgrade_health_stimpak',
  name: 'Healing Rite',
  description: 'Grant Regen and Sprint Speed to the target.',
  bucket: 'suggested',
  tags: ['hard_cc'],
  strength: 'situational',
  why: 'Grant Regen and Sprint Speed to the target',
  cost: 800,
}

// This config does not set `globals`, so testing-library's automatic cleanup
// never registers and renders accumulate across tests. Explicit here rather
// than switching the whole suite to globals for one file.
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('CurationList confirm-as-is', () => {
  it('offers no confirm button unless asked for one', () => {
    render(<CurationList entries={[entry]} kind="item" />)
    expect(screen.queryByRole('button', { name: 'Confirm as-is' })).toBeNull()
  })

  it('counts an unchanged entry as edited once confirmed', () => {
    render(<CurationList entries={[entry]} kind="item" confirmable />)

    expect(screen.getByText('0 edited')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Confirm as-is' }))
    expect(screen.getByText('1 edited')).toBeTruthy()
  })

  it('emits the entry as curated with its strength and tags untouched', async () => {
    // The component's only output is the clipboard, so that is what we read.
    let payload = ''
    const writeText = vi.fn((text: string) => {
      payload = text
      return Promise.resolve()
    })
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })

    render(<CurationList entries={[entry]} kind="item" confirmable />)
    fireEvent.click(screen.getByRole('button', { name: 'Confirm as-is' }))
    fireEvent.click(screen.getByRole('button', { name: 'Copy 1 entry' }))

    await vi.waitFor(() => expect(writeText).toHaveBeenCalled())
    expect(payload).toContain('"upgrade_health_stimpak"')
    expect(payload).toContain('"review":"curated"')
    expect(payload).toContain('"strength":"situational"')
    expect(payload).toContain('"answers":["hard_cc"]')
  })

  it('withdraws the confirm button once the entry is dirty by any route', () => {
    render(<CurationList entries={[entry]} kind="item" confirmable />)

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'hard' } })
    // Already decided — offering "confirm as-is" now would be asking twice.
    expect(screen.queryByRole('button', { name: 'Confirm as-is' })).toBeNull()
  })
})
