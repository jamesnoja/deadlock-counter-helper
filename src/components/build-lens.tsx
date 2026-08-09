'use client'

/**
 * The build lens — E15.
 *
 * The shortlist grouped by category and capped at what you can actually buy,
 * so it reads as a loadout rather than a wishlist, with the opportunity cost of
 * the last pick stated rather than hidden.
 */

import { GameImage } from './game-image.tsx'
import { CategoryTag } from './item-meta.tsx'
import type { SourcedCounter } from '@/data/sourced.ts'
import { buildByCategory, MAX_PURCHASES_PER_CATEGORY, opportunityCost } from '@/data/build.ts'
import { itemArtwork } from '@/data/snapshot.ts'

interface BuildLensProps {
  counters: readonly SourcedCounter[]
  teamSize: number
  onSelectItem?: (className: string) => void
}

export function BuildLens({ counters, teamSize, onSelectItem }: BuildLensProps) {
  const builds = buildByCategory(counters)
  const total = builds.reduce((sum, build) => sum + build.cost, 0)

  return (
    <div className="flex flex-col gap-md">
      <p className="text-caption text-text-muted">
        Capped at {MAX_PURCHASES_PER_CATEGORY} purchases per category, the limit upstream
        actually models. Full loadout:{' '}
        <span className="text-tabular text-text">{total.toLocaleString()}</span> souls.
      </p>

      <div className="grid gap-md lg:grid-cols-3">
        {builds.map((build) => {
          const cost = opportunityCost(build)
          return (
            <section
              key={build.category}
              className="flex flex-col gap-sm rounded-card bg-surface p-card"
            >
              <header className="flex items-center justify-between gap-sm">
                <CategoryTag category={build.category} />
                <span className="text-tabular text-caption">
                  {build.cost.toLocaleString()}
                  <span className="sr-only"> souls</span>
                </span>
              </header>

              {build.picks.length === 0 ? (
                <p className="text-caption text-text-muted">
                  Nothing in this category answers the lineup.
                </p>
              ) : (
                <ol className="flex flex-col gap-xs">
                  {build.picks.map((counter, index) => (
                    <li key={counter.item.class_name}>
                      <button
                        type="button"
                        onClick={() => onSelectItem?.(counter.item.class_name)}
                        className="flex w-full items-center gap-sm rounded-md bg-surface-elevated p-xs text-left hover:opacity-80"
                      >
                        <span className="w-4 shrink-0 text-tabular text-micro text-text-muted">
                          {index + 1}
                        </span>
                        <GameImage
                          src={itemArtwork(counter.item)}
                          fallback={counter.item.name}
                          size={28}
                          className="shrink-0 rounded-sm"
                        />
                        <span className="min-w-0 flex-1 truncate text-caption">
                          {counter.item.name}
                        </span>
                        <span className="shrink-0 text-tabular text-micro text-text-muted">
                          {counter.coverage.length}/{teamSize}
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
              )}

              {cost ? (
                <p className="text-caption text-text-muted">
                  {/* The tradeoff, spelled out — the point of the whole lens. */}
                  Taking <span className="text-text">{cost.inFavourOf.item.name}</span> here means
                  dropping <span className="text-text">{cost.dropped.item.name}</span>.
                </p>
              ) : null}

              {build.runnersUp.length > 0 ? (
                <details>
                  <summary className="cursor-pointer text-micro text-text-muted marker:content-none hover:text-brand">
                    <span aria-hidden>▸ </span>
                    {build.runnersUp.length} runners-up
                  </summary>
                  <ul className="mt-xs flex flex-wrap gap-xs">
                    {build.runnersUp.map((counter) => (
                      <li
                        key={counter.item.class_name}
                        className="rounded-pill bg-surface-elevated px-sm py-px text-micro text-text-muted"
                      >
                        {counter.item.name}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </section>
          )
        })}
      </div>
    </div>
  )
}
