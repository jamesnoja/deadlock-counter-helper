'use client'

/**
 * The one-enemy view, shared by the tool and the per-hero pages.
 *
 * Order is deliberate and taken from what the reference site does well: the
 * answer first, the reasoning after. Someone alt-tabbing mid-match wants the
 * item, not the essay — so the grid leads, and the prose is there for the
 * person who has time to read it.
 *
 * Where this differs from the reference: it publishes each item's description
 * and why-bullets *inside* the item card rather than in a parallel right-hand
 * rail. A rail makes you match a name on the left to a name on the right, which
 * is work the layout should be doing for you.
 *
 * Client-side because of the situation highlight. `/counter/[hero]` is static,
 * so the interactivity has to live below the page rather than in it.
 */

import { useRef, useState } from 'react'
import { GameImage } from './game-image.tsx'
import { CategoryTag } from './item-meta.tsx'
import type { Hero } from '@/data/schema.ts'
import { itemArtwork } from '@/data/snapshot.ts'
import type { HeroPlan, SourcedCounter } from '@/data/sourced.ts'

interface CounterSingleProps {
  hero: Hero
  counters: readonly SourcedCounter[]
  /** Absent when the source has not written this hero up. */
  advice?: HeroPlan
  /**
   * The hero pages already announce the matchup in their own header, so they
   * suppress this. The tool has no such header and needs it.
   */
  showHeading?: boolean
}

export function CounterSingle({ hero, counters, advice, showHeading = true }: CounterSingleProps) {
  const [highlighted, setHighlighted] = useState<string | null>(null)
  const cardRefs = useRef(new Map<string, HTMLLIElement>())

  /**
   * Jump to the item that answers a situation.
   *
   * Scrolling without highlighting leaves you looking at a grid wondering which
   * card moved you; highlighting without scrolling changes something offscreen.
   * Both, or neither.
   */
  const showAnswer = (itemClassName: string) => {
    setHighlighted((current) => (current === itemClassName ? null : itemClassName))
    cardRefs.current.get(itemClassName)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }

  /** The situation an item answers, if one is currently selected against it. */
  const reasonFor = (counter: SourcedCounter) =>
    counter.perHero.flatMap((effect) => effect.situations).find(() => true)

  return (
    <div className="flex flex-col gap-xl">
      {showHeading ? <h2 className="text-display">How to counter {hero.name}</h2> : null}

      {counters.length === 0 ? (
        <p className="rounded-card bg-surface p-card text-caption text-text-muted">
          No published counters for {hero.name}
          {advice ? ' match the current filters' : ' yet'}. That is not the same as nothing
          countering them.
        </p>
      ) : (
        <section className="flex flex-col gap-md">
          <h3 className="text-heading">Best items against {hero.name}</h3>
          <ul className="grid gap-md sm:grid-cols-2">
            {counters.map((counter, index) => {
              const situation = reasonFor(counter)
              const isHighlighted = highlighted === counter.item.class_name
              return (
                <li
                  key={counter.item.class_name}
                  ref={(node) => {
                    if (node) cardRefs.current.set(counter.item.class_name, node)
                    else cardRefs.current.delete(counter.item.class_name)
                  }}
                  aria-current={isHighlighted ? 'true' : undefined}
                  className={[
                    'flex flex-col gap-sm rounded-card p-card transition-colors',
                    isHighlighted ? 'bg-brand-subdued ring-2 ring-brand' : 'bg-surface',
                  ].join(' ')}
                >
                  <div className="flex items-start gap-md">
                    <GameImage
                      src={itemArtwork(counter.item)}
                      fallback={counter.item.name}
                      size={44}
                      className="shrink-0 rounded-md"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-heading">{counter.item.name}</h4>
                      <p className="flex flex-wrap items-center gap-sm">
                        <span className="text-tabular text-caption">
                          {counter.item.cost.toLocaleString()}
                        </span>
                        <CategoryTag category={counter.item.category} />
                      </p>
                    </div>
                    <span
                      aria-hidden
                      className="shrink-0 text-tabular text-micro text-text-muted"
                      title={`Ranked ${index + 1} against ${hero.name}`}
                    >
                      #{index + 1}
                    </span>
                  </div>

                  {counter.note?.description ? (
                    <p className="text-caption text-text-muted">{counter.note.description}</p>
                  ) : null}

                  {counter.note?.why.length ? (
                    <ul className="flex flex-col gap-px">
                      {counter.note.why.map((line) => (
                        <li key={line} className="text-micro text-text-muted">
                          — {line}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {isHighlighted && situation ? (
                    <p className="rounded-md bg-surface-elevated p-sm text-caption">
                      <span className="text-text-muted">{situation.label}: </span>
                      {situation.reason}
                    </p>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {advice ? (
        <>
          <section className="rounded-card bg-surface p-card">
            <h3 className="text-heading">Matchup overview</h3>
            <p className="text-caption text-text-muted">{advice.summary}</p>
          </section>

          {advice.lanePhase.length > 0 ? (
            <section className="rounded-card bg-surface p-card">
              <h3 className="text-heading">In the lane phase</h3>
              <ul className="mt-sm flex flex-col gap-xs">
                {advice.lanePhase.map((tip) => (
                  <li key={tip} className="text-caption text-text-muted">
                    {tip}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {advice.situations.length > 0 ? (
            <section className="flex flex-col gap-sm">
              <h3 className="text-heading">What are you struggling with?</h3>
              <p className="text-caption text-text-muted">
                Pick the problem and the item that answers it is highlighted above.
              </p>
              <div className="flex flex-col gap-xs">
                {advice.situations.map((situation) => {
                  const active = highlighted === situation.priorityItem
                  return (
                    <button
                      key={situation.label}
                      type="button"
                      aria-pressed={active}
                      onClick={() => showAnswer(situation.priorityItem)}
                      className={[
                        'rounded-card border-2 p-card text-left transition-colors',
                        active
                          ? 'border-brand bg-brand-subdued'
                          : 'border-hairline hover:border-brand',
                      ].join(' ')}
                    >
                      <span className="block text-caption">{situation.label}</span>
                      <span className="block text-micro text-text-muted">{situation.reason}</span>
                    </button>
                  )
                })}
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <section className="rounded-card bg-surface p-card">
          <h3 className="text-heading">No published write-up yet</h3>
          <p className="text-caption text-text-muted">
            Our source has not written {hero.name} up, so there is no matchup overview or lane
            advice for them. That is not the same as nothing countering them — it means nobody has
            published what does.
          </p>
        </section>
      )}
    </div>
  )
}
