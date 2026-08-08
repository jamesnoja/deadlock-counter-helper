'use client'

/**
 * The heroes lens — the same derivation, grouped the other way.
 *
 * E11 exists because the original site *replaced* per-hero detail with a flat
 * shared list the moment you picked a second enemy, making the team view
 * strictly less useful than the single view. Here nothing is lost: every item
 * shown at one enemy is still shown at six, just filed under the hero it
 * answers.
 *
 * This reads the same `deriveCounters` output as the items lens. It never
 * re-ranks — two lenses disagreeing about what matters would be worse than
 * having one.
 */

import { useMemo, useState } from 'react'
import { STRENGTH_GLYPH, STRENGTH_LABEL } from './coverage-cell.tsx'
import type { PairStrength, RankedCounter } from '@/data/derive.ts'
import type { Hero } from '@/data/schema.ts'

interface HeroesLensProps {
  counters: readonly RankedCounter[]
  team: readonly Hero[]
  /** Which hero to focus, or null for the combined view. */
  focus: string | null
  onFocus: (className: string | null) => void
}

interface HeroCounters {
  core: RankedCounter[]
  situational: RankedCounter[]
}

/** Split a hero's answers at the line between "buy this" and "consider this". */
function forHero(counters: readonly RankedCounter[], className: string): HeroCounters {
  const strengthOf = (counter: RankedCounter): PairStrength =>
    counter.perHero.find((effect) => effect.hero === className)?.strength ?? 'none'

  const relevant = counters.filter((counter) => strengthOf(counter) !== 'none')
  return {
    core: relevant.filter((counter) => strengthOf(counter) === 'strong'),
    situational: relevant.filter((counter) => strengthOf(counter) !== 'strong'),
  }
}

function ItemGrid({
  counters,
  heroClassName,
}: {
  counters: readonly RankedCounter[]
  heroClassName?: string
}) {
  if (counters.length === 0) {
    return <p className="text-caption text-text-muted">Nothing here.</p>
  }
  return (
    <ul className="flex flex-wrap gap-xs">
      {counters.map((counter) => {
        const effect = heroClassName
          ? counter.perHero.find((entry) => entry.hero === heroClassName)
          : undefined
        return (
          <li
            key={counter.item.class_name}
            // Wide enough for two lines of a real item name. At w-20 every
            // label read "COUNTER…", which identifies nothing.
            className="flex w-28 flex-col items-center gap-px rounded-md bg-surface-elevated p-xs text-center"
            title={counter.why}
          >
            <span className="grid size-9 place-items-center overflow-hidden rounded-md bg-surface">
              {counter.item.icon ?? counter.item.shop_icon ? (
                // eslint-disable-next-line @next/next/no-img-element -- E12 swaps this for next/image
                <img
                  src={counter.item.icon ?? counter.item.shop_icon ?? ''}
                  alt=""
                  className="size-full object-cover"
                />
              ) : null}
            </span>
            <span className="line-clamp-2 w-full text-micro">{counter.item.name}</span>
            {effect ? (
              <span aria-hidden className="text-micro text-text-muted">
                {STRENGTH_GLYPH[effect.strength]}
              </span>
            ) : null}
            <span className="sr-only">
              {counter.item.name}
              {effect ? `, ${STRENGTH_LABEL[effect.strength]}` : ''}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

export function HeroesLens({ counters, team, focus, onFocus }: HeroesLensProps) {
  const [showAll, setShowAll] = useState(false)

  /** Highest-impact items across the lineup — the aggregate is never a click away. */
  const combined = useMemo(() => counters.slice(0, 6), [counters])

  const focused = team.find((hero) => hero.class_name === focus) ?? null
  const shown = focused ? [focused] : team

  return (
    <div className="flex flex-col gap-lg">
      <div role="group" aria-label="Focus a hero" className="flex flex-wrap gap-xs">
        <button
          type="button"
          aria-pressed={focus === null}
          onClick={() => onFocus(null)}
          className={[
            'rounded-pill border-2 px-md py-xs text-micro transition-colors',
            focus === null
              ? 'border-brand bg-brand-subdued text-brand-soft'
              : 'border-hairline text-text-muted hover:border-brand',
          ].join(' ')}
        >
          All threats
        </button>
        {team.map((hero) => (
          <button
            key={hero.class_name}
            type="button"
            aria-pressed={focus === hero.class_name}
            onClick={() => onFocus(hero.class_name)}
            className={[
              'rounded-pill border-2 px-md py-xs text-micro transition-colors',
              focus === hero.class_name
                ? 'border-brand bg-brand-subdued text-brand-soft'
                : 'border-hairline text-text-muted hover:border-brand',
            ].join(' ')}
          >
            {hero.name}
          </button>
        ))}
      </div>

      {focus === null ? (
        <section className="flex flex-col gap-sm rounded-card bg-surface p-card">
          <h3 className="text-micro text-text-muted">All {team.length} threats combined</h3>
          <ItemGrid counters={combined} />
          <p className="text-caption text-text-muted">
            Highest-impact items across the whole lineup. Pick a hero above for its own answers.
          </p>
        </section>
      ) : null}

      <div className="grid gap-md lg:grid-cols-2">
        {shown.map((hero) => {
          const { core, situational } = forHero(counters, hero.class_name)
          const total = core.length + situational.length
          return (
            <section
              key={hero.class_name}
              className="flex flex-col gap-sm rounded-card bg-surface p-card"
            >
              <header className="flex items-center gap-sm">
                <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-pill bg-surface-elevated">
                  {hero.images.minimap ?? hero.images.portrait ? (
                    // eslint-disable-next-line @next/next/no-img-element -- E12 swaps this for next/image
                    <img
                      src={hero.images.minimap ?? hero.images.portrait ?? ''}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : null}
                </span>
                <span>
                  <span className="block text-heading">{hero.name}</span>
                  <span className="block text-micro text-text-muted">
                    {hero.role} · {total} {total === 1 ? 'counter' : 'counters'}
                  </span>
                </span>
              </header>

              <h4 className="text-micro text-counter-hard">Core — {core.length}</h4>
              <ItemGrid
                counters={showAll || focus ? core : core.slice(0, 6)}
                heroClassName={hero.class_name}
              />

              <h4 className="text-micro text-counter-situational">
                Situational — {situational.length}
              </h4>
              <ItemGrid
                counters={showAll || focus ? situational : situational.slice(0, 6)}
                heroClassName={hero.class_name}
              />
            </section>
          )
        })}
      </div>

      {focus === null && counters.length > 6 ? (
        <button
          type="button"
          onClick={() => setShowAll((current) => !current)}
          className="self-start text-caption text-brand underline"
        >
          {showAll ? 'Show fewer per hero' : 'Show every counter per hero'}
        </button>
      ) : null}
    </div>
  )
}
