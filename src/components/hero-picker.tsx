'use client'

/**
 * The hero picker.
 *
 * The original site built every chip as a `div` with no tabindex and no role,
 * and had exactly one real `<button>` on the page. This is the opposite: real
 * buttons, a labelled group, roving tabindex, and arrow keys that follow the
 * visual layout rather than the DOM order.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GameImage } from './game-image.tsx'
import { searchHeroes } from '@/data/hero-search.ts'
import type { Hero } from '@/data/schema.ts'

interface HeroPickerProps {
  heroes: readonly Hero[]
  /** Selected hero `class_name`s. */
  selected: readonly string[]
  onToggle: (className: string) => void
  /**
   * Why picking is currently blocked, if it is. Shown as visible text — the
   * original disabled chips silently, which tells the user nothing.
   */
  blockedReason?: string
}

export function HeroPicker({ heroes, selected, onToggle, blockedReason }: HeroPickerProps) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const searchRef = useRef<HTMLInputElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  const results = useMemo(() => searchHeroes(heroes, query), [heroes, query])
  const selectedSet = useMemo(() => new Set(selected), [selected])

  /**
   * Filtering can strand the roving index past the end of the list. Clamped
   * during render rather than corrected in an effect — an effect would set
   * state after paint and cascade a second render for no reason.
   */
  const rovingIndex = Math.min(activeIndex, Math.max(results.length - 1, 0))

  // "/" focuses search, unless the user is already typing somewhere.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey) return
      const target = event.target as HTMLElement | null
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return
      event.preventDefault()
      searchRef.current?.focus()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const focusChip = useCallback((index: number) => {
    setActiveIndex(index)
    const chips = gridRef.current?.querySelectorAll<HTMLButtonElement>('[data-hero-chip]')
    chips?.[index]?.focus()
  }, [])

  /**
   * Columns are measured from the rendered layout rather than assumed.
   * The grid wraps responsively, so any hardcoded column count would make
   * Up/Down jump to the wrong row at some viewport width.
   */
  const columnCount = useCallback(() => {
    const chips = gridRef.current?.querySelectorAll<HTMLButtonElement>('[data-hero-chip]')
    if (!chips || chips.length === 0) return 1
    const firstTop = chips[0]!.offsetTop
    let count = 0
    for (const chip of chips) {
      if (chip.offsetTop !== firstTop) break
      count++
    }
    return Math.max(count, 1)
  }, [])

  const onGridKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const last = results.length - 1
    if (last < 0) return
    const columns = columnCount()
    const moves: Record<string, number> = {
      ArrowRight: rovingIndex + 1,
      ArrowLeft: rovingIndex - 1,
      ArrowDown: rovingIndex + columns,
      ArrowUp: rovingIndex - columns,
      Home: 0,
      End: last,
    }
    const next = moves[event.key]
    if (next === undefined) return
    event.preventDefault()
    // Clamp rather than wrap: wrapping across a grid disorients more than it helps.
    focusChip(Math.min(Math.max(next, 0), last))
  }

  return (
    <div className="flex flex-col gap-md">
      <label className="flex flex-col gap-xs">
        <span className="text-micro text-text-muted">
          Search heroes — press <kbd>/</kbd> to jump here
        </span>
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'Enter') {
              event.preventDefault()
              focusChip(0)
            }
          }}
          placeholder="greytalon, mo krill, doorman…"
          className="rounded-md bg-surface-elevated p-md text-text placeholder:text-text-muted"
        />
      </label>

      {blockedReason ? (
        <p role="status" className="text-caption text-provenance-stale">
          {blockedReason}
        </p>
      ) : null}

      {/* Live region: filtering silently is invisible to a screen reader. */}
      <p aria-live="polite" className="text-caption text-text-muted">
        {results.length} of {heroes.length} heroes
        {query ? ` matching “${query}”` : ''}
      </p>

      {results.length === 0 ? (
        <p className="text-caption text-text-muted">
          No hero matches “{query}”. Try fewer letters.
        </p>
      ) : (
        <div
          ref={gridRef}
          /**
           * `group`, not `grid`. A grid requires row and gridcell wrappers, and
           * `aria-pressed` is invalid on a gridcell — so the grid roles would
           * have cost us the one attribute that actually communicates selection.
           * A labelled group of toggle buttons says the true thing.
           */
          role="group"
          aria-label="Heroes"
          onKeyDown={onGridKeyDown}
          className="grid grid-cols-2 gap-sm sm:grid-cols-3 lg:grid-cols-4"
        >
          {results.map((hero, index) => {
            const isSelected = selectedSet.has(hero.class_name)
            const isBlocked = Boolean(blockedReason) && !isSelected
            return (
              <button
                key={hero.class_name}
                data-hero-chip
                type="button"
                aria-pressed={isSelected}
                disabled={isBlocked}
                // Roving tabindex: one stop for the whole grid, arrows move within it.
                tabIndex={index === rovingIndex ? 0 : -1}
                onFocus={() => setActiveIndex(index)}
                onClick={() => onToggle(hero.class_name)}
                className={[
                  'flex items-center gap-sm rounded-pill border-2 p-xs pr-md text-left transition-colors',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  isSelected
                    ? 'border-brand bg-brand-subdued text-brand-soft'
                    : 'border-hairline bg-surface text-text hover:border-brand',
                ].join(' ')}
              >
                <GameImage
                  src={hero.images.minimap ?? hero.images.portrait}
                  fallback={hero.name}
                  size={36}
                  className="shrink-0 rounded-pill"
                />
                <span className="min-w-0 flex-1 truncate text-caption">{hero.name}</span>
                {/* A tick as well as a colour, so selection survives greyscale. */}
                <span aria-hidden className={isSelected ? 'text-brand' : 'invisible'}>
                  ✓
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
