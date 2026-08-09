'use client'

/**
 * One item in a shortlist, with the source's own reasoning inside it.
 *
 * Shared by the one-enemy and whole-team views so a card cannot start meaning
 * two different things. The only difference between them is the coverage strip,
 * which the team view passes and the single view omits — against one enemy
 * "answers 1 of 1" is noise.
 */

import { useState } from 'react'
import { GameImage } from './game-image.tsx'
import { CategoryTag } from './item-meta.tsx'
import type { Hero } from '@/data/schema.ts'
import { itemArtwork } from '@/data/snapshot.ts'
import type { CounterSituation } from '@/data/published-schema.ts'
import type { SourcedCounter } from '@/data/sourced.ts'

export interface CounterCardProps {
  counter: SourcedCounter
  /** 1-based position in the list being shown. */
  rank: number
  highlighted: boolean
  /** Shown when a situation is picked and this is the item that answers it. */
  situation?: CounterSituation
  /**
   * The selected enemies, for the coverage strip. Omit for a single enemy.
   *
   * Portraits rather than a count: "3 of 6" tells you how many, and *which*
   * three is the thing that decides whether you buy it.
   */
  team?: readonly Hero[]
  /**
   * Start collapsed, with the source's prose behind a control.
   *
   * Against one enemy every card can be open: there are six to nine of them and
   * one subject. Against six there can be thirty, and a wall of open cards
   * buries what the list is actually for. The ranking decides which few are
   * open; the rest stay one click away.
   */
  collapsible?: boolean
  onRef?: (node: HTMLLIElement | null) => void
}

export function CounterCard({
  counter,
  rank,
  highlighted,
  situation,
  team,
  collapsible = false,
  onRef,
}: CounterCardProps) {
  const [open, setOpen] = useState(false)
  const answered = new Set(counter.coverage)
  // Picking a situation reveals the card it answers, whatever its rank.
  const showDetail = !collapsible || open || highlighted
  const detailId = `counter-detail-${counter.item.class_name}`

  return (
    <li
      ref={onRef}
      aria-current={highlighted ? 'true' : undefined}
      className={[
        'flex flex-col gap-sm rounded-card p-card transition-colors',
        highlighted ? 'bg-brand-subdued ring-2 ring-brand' : 'bg-surface',
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
            <span className="text-tabular text-caption">{counter.item.cost.toLocaleString()}</span>
            <CategoryTag category={counter.item.category} />
          </p>
        </div>
        <span aria-hidden className="shrink-0 text-tabular text-micro text-text-muted">
          #{rank}
        </span>
      </div>

      {team && team.length > 1 ? (
        <p className="flex flex-wrap items-center gap-xs">
          <span className="text-micro text-text-muted">
            Answers {answered.size} of {team.length}
          </span>
          {team.map((hero) => {
            const covered = answered.has(hero.class_name)
            return (
              <span
                key={hero.class_name}
                title={`${hero.name} — ${covered ? 'answered' : 'not answered'}`}
                className={covered ? '' : 'opacity-25 grayscale'}
              >
                <GameImage
                  src={hero.images.minimap ?? hero.images.portrait}
                  fallback={hero.name}
                  size={22}
                  className="rounded-pill"
                />
              </span>
            )
          })}
          {/* The portraits are decorative; this is what a screen reader reads. */}
          <span className="sr-only">
            {team
              .filter((hero) => answered.has(hero.class_name))
              .map((hero) => hero.name)
              .join(', ') || 'none of the selected enemies'}
          </span>
        </p>
      ) : null}

      {showDetail ? (
        <div id={detailId} className="flex flex-col gap-sm">
          {counter.note?.description ? (
            <p className="text-caption text-text-muted">{counter.note.description}</p>
          ) : null}

          {counter.note?.why.length ? (
            <ul className="flex flex-col gap-px">
              {counter.note.why.map((line) => (
                <li key={line} className="text-caption text-text-muted">
                  {line}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {collapsible && !highlighted ? (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={detailId}
          onClick={() => setOpen((current) => !current)}
          className="self-start text-caption text-brand underline"
        >
          {open ? `Hide why ${counter.item.name} works` : `Why ${counter.item.name} works`}
        </button>
      ) : null}

      {highlighted && situation ? (
        <p className="rounded-md bg-surface-elevated p-sm text-caption">
          <span className="text-text-muted">{situation.label}: </span>
          {situation.reason}
        </p>
      ) : null}
    </li>
  )
}
