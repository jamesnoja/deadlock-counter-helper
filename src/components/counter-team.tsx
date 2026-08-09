'use client'

/**
 * The whole-lineup view — the single-hero layout, scaled up.
 *
 * Same 60/40 shape, because the two questions do not change with the number of
 * enemies: what do I buy, and why. What changes is that "why" now has six
 * answers, so the right column leads with what the lineup *collectively*
 * demands and keeps each hero's write-up behind a disclosure underneath.
 *
 * The threat profile is the thing the single view cannot tell you and the old
 * lens switcher never did: not "here are 30 items" but "four of these six want
 * you to hold a cleanse". That is the shape of the draft, and it is the first
 * thing worth knowing.
 */

import { useRef, useState } from 'react'
import { CounterCard } from './counter-card.tsx'
import { scrollCardIntoView } from './scroll-into-view.ts'
import { GameImage } from './game-image.tsx'
import { COUNTER_GROUPS } from '@/data/published.ts'
import type { Hero } from '@/data/schema.ts'
import type { CounterPlan, SourcedCounter } from '@/data/sourced.ts'

interface CounterTeamProps {
  team: readonly Hero[]
  counters: readonly SourcedCounter[]
  plan: CounterPlan
}

/** How many of the selected enemies want each kind of answer, most-wanted first. */
function threatProfile(plan: CounterPlan, team: readonly Hero[]) {
  const nameOf = new Map(team.map((hero) => [hero.class_name, hero.name]))
  const wanted = new Map<string, string[]>()

  for (const hero of plan.heroes) {
    for (const key of hero.groups) {
      wanted.set(key, [...(wanted.get(key) ?? []), nameOf.get(hero.hero) ?? hero.hero])
    }
  }

  return COUNTER_GROUPS.filter((group) => wanted.has(group.key))
    .map((group) => ({ group, heroes: wanted.get(group.key) ?? [] }))
    .sort((a, b) => b.heroes.length - a.heroes.length || a.group.name.localeCompare(b.group.name))
}

/**
 * How many cards open on arrival.
 *
 * Four is the working-memory ceiling, and it matches the number of items a
 * player realistically buys in one back.
 */
const OPEN_BY_DEFAULT = 4

export function CounterTeam({ team, counters, plan }: CounterTeamProps) {
  const [highlighted, setHighlighted] = useState<string | null>(null)
  const cardRefs = useRef(new Map<string, HTMLLIElement>())
  const profile = threatProfile(plan, team)
  const nameOf = new Map(team.map((hero) => [hero.class_name, hero.name]))

  const showAnswer = (itemClassName: string) => {
    setHighlighted((current) => (current === itemClassName ? null : itemClassName))
    scrollCardIntoView(cardRefs.current.get(itemClassName))
  }

  /** The situation currently driving the highlight, so the card can show its reason. */
  const situationFor = (counter: SourcedCounter) =>
    counter.perHero.flatMap((effect) => effect.situations).find(() => true)

  return (
    <div className="grid items-start gap-lg lg:grid-cols-[3fr_2fr]">
      {counters.length === 0 ? (
        <p className="rounded-card bg-surface p-card text-caption text-text-muted">
          No published counters match the current filters. Widen the budget or phase.
        </p>
      ) : (
        <section className="flex flex-col gap-md">
          <h3 className="text-heading">Best items against this lineup</h3>
          <p className="text-caption text-text-muted">
            Ranked by how much of the lineup each one answers. The portraits under an item show
            which of your enemies it works against; dimmed means it does nothing there.
          </p>
          <ul className="grid gap-md sm:grid-cols-2">
            {counters.map((counter, index) => (
              <CounterCard
                key={counter.item.class_name}
                counter={counter}
                rank={index + 1}
                highlighted={highlighted === counter.item.class_name}
                collapsible={index >= OPEN_BY_DEFAULT}
                situation={situationFor(counter)}
                team={team}
                onRef={(node) => {
                  if (node) cardRefs.current.set(counter.item.class_name, node)
                  else cardRefs.current.delete(counter.item.class_name)
                }}
              />
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-col gap-lg">
        {profile.length > 0 ? (
          <section className="flex flex-col gap-md">
            <h3 className="text-heading">What this lineup demands</h3>
            <ul className="flex flex-col gap-xs">
              {profile.map(({ group, heroes }) => (
                <li key={group.key} className="rounded-card bg-surface p-card">
                  <p className="flex flex-wrap items-baseline justify-between gap-sm">
                    <span className="text-caption">{group.name}</span>
                    <span className="text-tabular text-micro text-text-muted">
                      {heroes.length} of {team.length}
                    </span>
                  </p>
                  <p className="text-caption text-text-muted">{group.desc}</p>
                  <p className="text-caption text-text-muted">{heroes.join(', ')}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="flex flex-col gap-md">
          <h3 className="text-heading">Hero by hero</h3>
          <p className="text-caption text-text-muted">
            One panel each. Picking a problem highlights the item that answers it.
          </p>
          <div className="flex flex-col gap-xs">
            {team.map((hero) => {
              const advice = plan.heroes.find((entry) => entry.hero === hero.class_name)
              return (
                <details key={hero.class_name} className="rounded-card bg-surface p-card">
                  <summary className="flex cursor-pointer items-center gap-sm text-heading marker:content-none">
                    <GameImage
                      src={hero.images.minimap ?? hero.images.portrait}
                      fallback={hero.name}
                      size={28}
                      className="shrink-0 rounded-pill"
                    />
                    {hero.name}
                  </summary>

                  {advice ? (
                    <div className="mt-sm flex flex-col gap-sm">
                      <p className="text-caption text-text-muted">{advice.summary}</p>

                      {advice.lanePhase.length > 0 ? (
                        <ul className="flex flex-col gap-xs">
                          {advice.lanePhase.map((tip) => (
                            <li key={tip} className="text-caption text-text-muted">
                              {tip}
                            </li>
                          ))}
                        </ul>
                      ) : null}

                      {advice.situations.map((situation) => (
                        <button
                          key={situation.label}
                          type="button"
                          aria-pressed={highlighted === situation.priorityItem}
                          onClick={() => showAnswer(situation.priorityItem)}
                          className={[
                            'rounded-md border-2 p-sm text-left transition-colors',
                            highlighted === situation.priorityItem
                              ? 'border-brand bg-brand-subdued'
                              : 'border-hairline hover:border-brand',
                          ].join(' ')}
                        >
                          <span className="block text-caption">{situation.label}</span>
                          <span className="block text-caption text-text-muted">
                            {situation.reason}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-sm text-caption text-text-muted">
                      Nobody has published a write-up for {nameOf.get(hero.class_name) ?? hero.name}{' '}
                      yet. That is not the same as nothing countering them.
                    </p>
                  )}
                </details>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
