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
import type { RankedCounter } from '@/data/derive.ts'
import { explainPair } from '@/data/explain.ts'
import { countersForItem } from '@/data/overlay.ts'
import { provenanceFor } from '@/data/provenance.ts'
import type { Hero } from '@/data/schema.ts'
import { ProvenanceDot } from './primitives.tsx'

interface ItemDetailProps {
  counter: RankedCounter
  team: readonly Hero[]
  abilityName: (className: string) => string | undefined
  onClose: () => void
}

export function ItemDetail({ counter, team, abilityName, onClose }: ItemDetailProps) {
  const entry = countersForItem(counter.item.class_name)
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
          src={counter.item.icon ?? counter.item.shop_icon}
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
            const { text, editorial } = explainPair(effect, heroName, abilityName, entry)
            const addressed = effect.strength !== 'none'
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
                      {STRENGTH_GLYPH[effect.strength]}
                    </span>
                    <span className="text-micro text-text-muted">
                      {STRENGTH_LABEL[effect.strength]}
                    </span>
                    {/* Editorial lines are marked, per the provenance rules in E07. */}
                    {editorial ? (
                      <span className="rounded-pill bg-brand-subdued px-sm text-micro text-brand-soft">
                        editorial
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
        {counter.source === 'editorial' && counter.overrideReason ? (
          <span className="text-caption text-brand-soft">
            Editorial override: {counter.overrideReason}
          </span>
        ) : null}
      </footer>
    </aside>
  )
}
