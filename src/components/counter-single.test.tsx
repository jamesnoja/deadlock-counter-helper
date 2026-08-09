import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { CounterSingle } from './counter-single.tsx'
import { planForTeam } from '@/data/counters.ts'
import { HEROES } from '@/data/snapshot.ts'
import { HERO_COUNTERS } from '@/data/published.ts'

/**
 * The situation buttons are the only real interaction here. Everything else is
 * layout, which a test would assert without proving.
 */

// jsdom has no scrollIntoView, and the component calls it on every click.
// jsdom implements neither, and the reduced-motion-aware scroll needs both.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
})

afterEach(cleanup)

const entry = HERO_COUNTERS.find((candidate) => candidate.situations.length > 0)!
const hero = HEROES.find((candidate) => candidate.class_name === entry.hero)!
const plan = planForTeam([hero.class_name])

describe('CounterSingle situations', () => {
  it('leads with the items, before any prose', () => {
    render(<CounterSingle hero={hero} counters={plan.counters} advice={plan.heroes[0]} />)
    const headings = screen.getAllByRole('heading').map((node) => node.textContent ?? '')
    const items = headings.findIndex((text) => text.startsWith('Best items'))
    const overview = headings.findIndex((text) => text === 'Matchup overview')
    expect(items).toBeGreaterThanOrEqual(0)
    expect(items).toBeLessThan(overview)
  })

  it('highlights the answering item when a situation is picked', () => {
    render(<CounterSingle hero={hero} counters={plan.counters} advice={plan.heroes[0]} />)
    const situation = entry.situations[0]!
    const button = screen.getByRole('button', { name: new RegExp(situation.label, 'i') })

    expect(button).toHaveProperty('ariaPressed', 'false')
    fireEvent.click(button)
    expect(button).toHaveProperty('ariaPressed', 'true')

    // The highlight has to land on a card, not just flip the button.
    expect(document.querySelectorAll('[aria-current="true"]')).toHaveLength(1)
  })

  it('lets a picked situation be unpicked', () => {
    render(<CounterSingle hero={hero} counters={plan.counters} advice={plan.heroes[0]} />)
    const button = screen.getByRole('button', { name: new RegExp(entry.situations[0]!.label, 'i') })
    fireEvent.click(button)
    fireEvent.click(button)
    expect(document.querySelectorAll('[aria-current="true"]')).toHaveLength(0)
  })

  it('scrolls the answering card into view, not just recolours it', () => {
    // Highlighting something off-screen is indistinguishable from doing nothing.
    render(<CounterSingle hero={hero} counters={plan.counters} advice={plan.heroes[0]} />)
    fireEvent.click(screen.getByRole('button', { name: new RegExp(entry.situations[0]!.label, 'i') }))
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
  })
})

describe('CounterSingle without published advice', () => {
  it('says nobody has written the hero up, rather than showing nothing', () => {
    render(<CounterSingle hero={hero} counters={plan.counters} advice={undefined} />)
    expect(screen.getByText(/No published write-up yet/i)).toBeTruthy()
    expect(screen.queryByText('Matchup overview')).toBeNull()
  })

  it('distinguishes an empty filter result from an unwritten hero', () => {
    // "Your budget hid everything" and "nobody has published this" are different
    // problems with different fixes, and the copy has to tell them apart.
    const { unmount } = render(<CounterSingle hero={hero} counters={[]} advice={plan.heroes[0]} />)
    expect(screen.getByText(/match the current filters/i)).toBeTruthy()
    unmount()

    render(<CounterSingle hero={hero} counters={[]} advice={undefined} />)
    expect(screen.getByText(/No published counters for .* yet/i)).toBeTruthy()
  })
})

describe('CounterSingle accessibility', () => {
  it('announces the ranking that sighted users read off the badge', () => {
    render(<CounterSingle hero={hero} counters={plan.counters} advice={plan.heroes[0]} />)
    // The #N badge is aria-hidden, so without this the list sounds unordered.
    expect(screen.getByText('Ranked 1')).toBeTruthy()
    expect(screen.getByText(`Ranked ${plan.counters.length}`)).toBeTruthy()
  })
})
