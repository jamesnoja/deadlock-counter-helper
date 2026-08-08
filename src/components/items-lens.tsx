'use client'

/**
 * The items lens — every recommended item as a row, with one coverage cell per
 * selected enemy.
 *
 * Columns are fixed and shared by every row, which is what lets the table be
 * read down a column ("what answers Abrams?") as well as across ("what does
 * this item cover?"). A pile of portraits per row cannot do that.
 */

import { useMemo, useState } from 'react'
import { CoverageCell, CoverageLegend } from './coverage-cell.tsx'
import type { RankedCounter } from '@/data/derive.ts'
import { ITEM_CATEGORIES, type ItemCategory, type Hero } from '@/data/schema.ts'
import { normalise } from '@/data/hero-search.ts'

interface ItemsLensProps {
  counters: readonly RankedCounter[]
  /** Selection order — the column order for every row. */
  team: readonly Hero[]
  onSelectHero?: (className: string) => void
}

const CATEGORY_CLASS: Record<ItemCategory, string> = {
  weapon: 'text-category-weapon',
  vitality: 'text-category-vitality',
  spirit: 'text-category-spirit',
}

export function ItemsLens({ counters, team, onSelectHero }: ItemsLensProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<ItemCategory | 'all'>('all')

  const counts = useMemo(() => {
    const tally: Record<string, number> = { all: counters.length }
    for (const item of ITEM_CATEGORIES) {
      tally[item] = counters.filter((counter) => counter.item.category === item).length
    }
    return tally
  }, [counters])

  const visible = useMemo(() => {
    const needle = normalise(query)
    return counters.filter((counter) => {
      if (category !== 'all' && counter.item.category !== category) return false
      if (!needle) return true
      return normalise(counter.item.name).includes(needle)
    })
  }, [counters, category, query])

  return (
    <div className="flex flex-col gap-md">
      <div className="flex flex-wrap items-center gap-sm">
        <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-xs">
          {(['all', ...ITEM_CATEGORIES] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={category === value}
              onClick={() => setCategory(value)}
              className={[
                'rounded-pill border-2 px-md py-xs text-micro transition-colors',
                category === value
                  ? 'border-brand bg-brand-subdued text-brand-soft'
                  : 'border-hairline text-text-muted hover:border-brand',
              ].join(' ')}
            >
              {value} {counts[value] ?? 0}
            </button>
          ))}
        </div>
        <label className="ml-auto flex items-center gap-xs">
          <span className="sr-only">Filter items by name</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter items…"
            className="rounded-md bg-surface-elevated p-sm text-caption text-text placeholder:text-text-muted"
          />
        </label>
      </div>

      {visible.length === 0 ? (
        <p className="text-caption text-text-muted">
          No item matches those filters. {counters.length} are available in total.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">
              Recommended items and how strongly each answers every selected enemy
            </caption>
            <thead>
              <tr className="border-b border-hairline">
                {/* Explicit widths: auto layout starved the purpose column down
                    to three words, which is worse than not showing it. */}
                <th scope="col" className="w-1/4 p-sm text-micro text-text-muted">
                  Item
                </th>
                <th scope="col" className="w-2/5 p-sm text-micro text-text-muted">
                  Purpose
                </th>
                {team.map((hero) => (
                  <th key={hero.class_name} scope="col" className="p-xs">
                    <span
                      className="grid size-7 place-items-center overflow-hidden rounded-pill bg-surface-elevated"
                      title={hero.name}
                    >
                      {hero.images.minimap ?? hero.images.portrait ? (
                        // eslint-disable-next-line @next/next/no-img-element -- E12 swaps this for next/image
                        <img
                          src={hero.images.minimap ?? hero.images.portrait ?? ''}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <span className="text-micro">{hero.name.slice(0, 2)}</span>
                      )}
                    </span>
                    <span className="sr-only">{hero.name}</span>
                  </th>
                ))}
                <th scope="col" className="p-sm text-micro text-text-muted">
                  Cov.
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((counter, index) => (
                <tr
                  key={counter.item.class_name}
                  className="border-b border-hairline align-middle hover:bg-surface-elevated"
                >
                  <th scope="row" className="p-sm font-normal">
                    <span className="flex items-center gap-sm">
                      <span className="text-caption text-text-muted">{index + 1}</span>
                      <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-md bg-surface-elevated">
                        {counter.item.icon ?? counter.item.shop_icon ? (
                          // eslint-disable-next-line @next/next/no-img-element -- E12 swaps this for next/image
                          <img
                            src={counter.item.icon ?? counter.item.shop_icon ?? ''}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : null}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-caption">{counter.item.name}</span>
                        <span
                          className={`block text-micro ${CATEGORY_CLASS[counter.item.category]}`}
                        >
                          {counter.item.category} T{counter.item.tier} ·{' '}
                          <span className="text-tabular text-text-muted">
                            {counter.item.cost.toLocaleString()}
                          </span>
                        </span>
                      </span>
                    </span>
                  </th>
                  <td className="p-sm text-caption text-text-muted">
                    <span className="line-clamp-3">{counter.why}</span>
                  </td>
                  {counter.perHero.map((effect) => {
                    const hero = team.find((candidate) => candidate.class_name === effect.hero)
                    return (
                      <td key={effect.hero} className="p-xs text-center">
                        <CoverageCell
                          strength={effect.strength}
                          heroName={hero?.name ?? effect.hero}
                          portrait={hero?.images.minimap ?? hero?.images.portrait ?? null}
                          itemName={counter.item.name}
                          onSelect={onSelectHero ? () => onSelectHero(effect.hero) : undefined}
                        />
                      </td>
                    )
                  })}
                  <td className="p-sm text-tabular">
                    {counter.coverage.length}/{team.length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CoverageLegend />
    </div>
  )
}
