import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { CounterTeam } from './counter-team.tsx'
import { planForTeam } from '@/data/counters.ts'
import { HEROES } from '@/data/snapshot.ts'
import { HERO_COUNTERS } from '@/data/published.ts'

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})
afterEach(cleanup)

const picked = HERO_COUNTERS.slice(0, 4).map(
  (entry) => HEROES.find((hero) => hero.class_name === entry.hero)!,
)
const plan = planForTeam(picked.map((hero) => hero.class_name))

describe('CounterTeam threat profile', () => {
  it('orders what the lineup demands by how many enemies want it', () => {
    render(<CounterTeam team={picked} counters={plan.counters} plan={plan} />)
    const counts = screen
      .getAllByText(/^\d+ of \d+$/)
      .map((node) => Number.parseInt(node.textContent ?? '0', 10))
    expect(counts.length).toBeGreaterThan(0)
    expect([...counts].sort((a, b) => b - a)).toEqual(counts)
  })

  it('never claims more heroes want something than are selected', () => {
    render(<CounterTeam team={picked} counters={plan.counters} plan={plan} />)
    for (const node of screen.getAllByText(/^\d+ of \d+$/)) {
      const [want, total] = (node.textContent ?? '').split(' of ').map(Number)
      expect(want).toBeLessThanOrEqual(total!)
      expect(total).toBe(picked.length)
    }
  })
})

describe('CounterTeam hero panels', () => {
  it('gives every selected enemy a panel, including any with no write-up', () => {
    // Hero names also appear in the threat profile, so this asserts on the
    // disclosures rather than on the text.
    const { container } = render(
      <CounterTeam team={picked} counters={plan.counters} plan={plan} />,
    )
    const summaries = [...container.querySelectorAll('details > summary')].map(
      (node) => node.textContent ?? '',
    )
    expect(summaries).toHaveLength(picked.length)
    for (const hero of picked) {
      expect(summaries.some((text) => text.includes(hero.name))).toBe(true)
    }
  })

  it('highlights the answering item when a situation inside a panel is picked', () => {
    render(<CounterTeam team={picked} counters={plan.counters} plan={plan} />)
    const situation = plan.heroes[0]!.situations[0]!
    fireEvent.click(screen.getByRole('button', { name: new RegExp(situation.label, 'i') }))
    expect(document.querySelectorAll('[aria-current="true"]')).toHaveLength(1)
  })
})

describe('CounterTeam coverage strip', () => {
  it('reports how many of the selected enemies each item answers', () => {
    render(<CounterTeam team={picked} counters={plan.counters} plan={plan} />)
    const strips = screen.getAllByText(/^Answers \d+ of \d+:$/)
    expect(strips.length).toBe(plan.counters.length)
    // The top item should answer more of the lineup than the last one — that is
    // the whole claim of a team view.
    const first = Number.parseInt(strips[0]!.textContent!.replace('Answers ', ''), 10)
    const last = Number.parseInt(strips[strips.length - 1]!.textContent!.replace('Answers ', ''), 10)
    expect(first).toBeGreaterThanOrEqual(last)
  })
})
