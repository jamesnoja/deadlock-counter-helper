'use client'

/**
 * The item detail panel — E34.
 *
 * "Knockdown counters 5 of 6" tells you to buy it. It does not tell you that it
 * is a core answer to one enemy and an afterthought against another, and that
 * difference decides whether you buy it first or third.
 *
 * Every selected enemy appears, including the ones this item does nothing
 * about. Omitting them would leave the reader unsure whether a hero was
 * considered and dismissed, or simply forgotten.
 */

import { STRENGTH_GLYPH, STRENGTH_LABEL } from './coverage-cell.tsx'
import { GameImage } from './game-image.tsx'
import { pairStrength, type SourcedCounter } from '@/data/sourced.ts'
import { itemArtwork } from '@/data/snapshot.ts'
import { provenanceFor } from '@/data/provenance.ts'
import type { Hero } from '@/data/schema.ts'
import { ProvenanceDot } from './primitives.tsx'

interface ItemDetailProps {
  counter: SourcedCounter
  team: readonly Hero[]
  onClose: () => void
}

export function ItemDetail({ counter, team, onClose }: ItemDetailProps) {
  /**
   * Keyed on the upstream property name, not the label. Some items carry two
   * distinct properties with the same label — Counterspell has "Spirit Power"
   * twice, at 20 and 5 — so labels are not unique and would collide as keys.
   */
  const stats = Object.entries(counter.item.stats)

  return (
    <aside
      aria-label={`${counter.item.name} detail`}
      className="flex flex-col gap-md rounded-card bg-surface p-card shadow-2"
    >
      <header className="flex items-start gap-md">
        <GameImage
          src={itemArtwork(counter.item)}
          fallback={counter.item.name}
          size={48}
          className="shrink-0 rounded-md"
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-heading">{counter.item.name}</h3>
          <p className="text-micro text-text-muted">
            {counter.item.category} · T{counter.item.tier} ·{' '}
            <span className="text-tabular">{counter.item.cost.toLocaleString()}</span> souls
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span className="text-tabular text-heading text-brand">{counter.coverage.length}</span>
          <span className="text-caption text-text-muted">/{team.length}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-caption text-text-muted hover:text-text"
        >
          <span aria-hidden>×</span>
          <span className="sr-only">Close detail</span>
        </button>
      </header>

      {counter.item.description ? (
        <p className="text-caption text-text-muted">{counter.item.description}</p>
      ) : null}

      <section className="flex flex-col gap-xs">
        <h4 className="text-micro text-text-muted">Per-hero effectiveness</h4>
        <ul className="flex flex-col gap-xs">
          {counter.perHero.map((effect) => {
            const hero = team.find((candidate) => candidate.class_name === effect.hero)
            const heroName = hero?.name ?? effect.hero
            const addressed = pairStrength(effect) !== 'none'
            // The source's own words: its reason for this exact matchup where it
            // gave one, its general note otherwise. No sentence is synthesised —
            // an item it simply listed says so rather than inventing a rationale.
            const text =
              effect.situations[0]?.reason ??
              (addressed
                ? (counter.note?.description ??
                  `Listed as a counter to ${heroName}, without a stated reason.`)
                : `Not listed as an answer to ${heroName}.`)
            return (
              <li
                key={effect.hero}
                className={`flex items-start gap-sm rounded-md p-sm ${
                  addressed ? 'bg-surface-elevated' : 'opacity-60'
                }`}
              >
                <GameImage
                  src={hero?.images.minimap ?? hero?.images.portrait}
                  fallback={heroName}
                  size={28}
                  className="shrink-0 rounded-pill"
                />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-xs">
                    <span className="text-caption">{heroName}</span>
                    <span aria-hidden className="text-micro text-text-muted">
                      {STRENGTH_GLYPH[pairStrength(effect)]}
                    </span>
                    <span className="text-micro text-text-muted">
                      {STRENGTH_LABEL[pairStrength(effect)]}
                    </span>
                    {effect.situations.length > 0 ? (
                      <span className="rounded-pill bg-brand-subdued px-sm text-micro text-brand-soft">
                        {effect.situations[0]!.label}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-caption text-text-muted">{text}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      {stats.length > 0 ? (
        <section className="flex flex-col gap-xs">
          <h4 className="text-micro text-text-muted">Stats</h4>
          <dl className="grid grid-cols-2 gap-x-md gap-y-xs">
            {stats.map(([property, stat]) => (
              <div key={property} className="flex justify-between gap-sm">
                <dt className="text-caption text-text-muted">{stat.label}</dt>
                <dd className="text-tabular">
                  {stat.value}
                  {stat.unit}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <footer className="flex flex-wrap items-center gap-md">
        <ProvenanceDot state={provenanceFor(counter.item.class_name)} />
        {counter.note?.why.length ? (
          <ul className="flex flex-col gap-xs text-caption text-text-muted">
            {counter.note.why.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}
      </footer>
    </aside>
  )
}
