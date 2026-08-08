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
import { GameImage } from './game-image.tsx'
import type { RankedCounter } from '@/data/derive.ts'
import { ITEM_CATEGORIES, type ItemCategory, type Hero } from '@/data/schema.ts'
import { normalise } from '@/data/hero-search.ts'

interface ItemsLensProps {
  counters: readonly RankedCounter[]
  /** Selection order — the column order for every row. */
  team: readonly Hero[]
  onSelectHero?: (className: string) => void
  /** Opens the detail panel for an item. */
  onSelectItem?: (className: string) => void
}

const CATEGORY_CLASS: Record<ItemCategory, string> = {
  weapon: 'text-category-weapon',
  vitality: 'text-category-vitality',
  spirit: 'text-category-spirit',
}

export function ItemsLens({ counters, team, onSelectHero, onSelectItem }: ItemsLensProps) {
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
          {/*
            border-separate with row spacing, not border-collapse with hairlines.
            The design guide is explicit that depth comes from layered charcoal
            and soft shadows rather than rules, and that a square corner reads as
            third-party — so each row is a rounded surface floating on the canvas.
          */}
          <table className="w-full border-separate border-spacing-y-xs text-left">
            <caption className="sr-only">
              Recommended items and how strongly each answers every selected enemy
            </caption>
            <thead>
              <tr>
                {/* Explicit widths: auto layout starved the purpose column down
                    to three words, which is worse than not showing it. */}
                <th scope="col" className="w-1/4 px-md pb-xs text-micro text-text-muted">
                  Item
                </th>
                <th scope="col" className="w-2/5 px-md pb-xs text-micro text-text-muted">
                  Purpose
                </th>
                {team.map((hero) => (
                  <th key={hero.class_name} scope="col" className="px-xs pb-xs">
                    <span className="mx-auto grid w-fit" title={hero.name}>
                      <GameImage
                        src={hero.images.minimap ?? hero.images.portrait}
                        fallback={hero.name}
                        size={28}
                        className="rounded-pill"
                      />
                    </span>
                    <span className="sr-only">{hero.name}</span>
                  </th>
                ))}
                <th scope="col" className="px-md pb-xs text-right text-micro text-text-muted">
                  Cov.
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((counter, index) => (
                <tr key={counter.item.class_name} className="group align-middle">
                  {/* Rounding lives on the end cells, because border-separate
                      gives no box to round on the row itself. */}
                  <th
                    scope="row"
                    className="rounded-l-lg bg-surface p-row font-normal transition-colors group-hover:bg-surface-elevated"
                  >
                    <span className="flex items-center gap-md">
                      <span className="w-4 shrink-0 text-tabular text-text-muted">{index + 1}</span>
                      <GameImage
                        src={counter.item.icon ?? counter.item.shop_icon}
                        fallback={counter.item.name}
                        size={40}
                        className="shrink-0 rounded-md"
                      />
                      <span className="flex min-w-0 flex-col gap-xs">
                        {onSelectItem ? (
                          <button
                            type="button"
                            onClick={() => onSelectItem(counter.item.class_name)}
                            className="truncate text-left text-heading hover:text-brand"
                          >
                            {counter.item.name}
                            <span className="sr-only"> — open details</span>
                          </button>
                        ) : (
                          <span className="truncate text-heading">{counter.item.name}</span>
                        )}
                        <span className="flex flex-wrap items-center gap-xs">
                          {/* pill-tag from the design guide: subdued fill, soft text. */}
                          <span
                            className={`rounded-pill bg-surface-elevated px-sm py-px text-micro ${CATEGORY_CLASS[counter.item.category]}`}
                          >
                            {counter.item.category}
                          </span>
                          <span className="text-micro text-text-muted">T{counter.item.tier}</span>
                          <span className="text-tabular">
                            {counter.item.cost.toLocaleString()}
                          </span>
                        </span>
                      </span>
                    </span>
                  </th>
                  <td className="bg-surface p-row text-caption text-text-muted transition-colors group-hover:bg-surface-elevated">
                    <span className="line-clamp-3">{counter.why}</span>
                  </td>
                  {counter.perHero.map((effect) => {
                    const hero = team.find((candidate) => candidate.class_name === effect.hero)
                    return (
                      <td
                        key={effect.hero}
                        className="bg-surface px-xs py-row text-center transition-colors group-hover:bg-surface-elevated"
                      >
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
                  <td className="rounded-r-lg bg-surface p-row text-right transition-colors group-hover:bg-surface-elevated">
                    {/* The count is the row's hero number — sized to be the
                        thing you see first when scanning the column. */}
                    <span className="text-tabular text-heading text-brand">
                      {counter.coverage.length}
                    </span>
                    <span className="text-caption text-text-muted">/{team.length}</span>
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
