'use client'

/**
 * The six enemy slots.
 *
 * Sticky, because E09 requires the lineup stay visible while you scroll the
 * results — the whole point is comparing recommendations against the team that
 * produced them.
 *
 * Slots are rendered explicitly, including the empty ones. A team bar that
 * grows from nothing hides how many picks are left; six outlines say it without
 * a word.
 */

import type { Hero } from '@/data/schema.ts'

export const MAX_ENEMIES = 6

interface TeamBarProps {
  /** Selected heroes, in pick order. Shorter than MAX_ENEMIES when incomplete. */
  team: readonly Hero[]
  onClear: (className: string) => void
  onClearAll: () => void
}

export function TeamBar({ team, onClear, onClearAll }: TeamBarProps) {
  const empties = Math.max(MAX_ENEMIES - team.length, 0)
  const full = team.length >= MAX_ENEMIES

  return (
    <div className="sticky top-0 z-20 flex flex-col gap-sm rounded-card bg-surface-elevated p-md shadow-2">
      <div className="flex flex-wrap items-baseline justify-between gap-sm">
        <h2 className="text-micro text-text-muted">
          Enemy team — {team.length} of {MAX_ENEMIES}
          {full ? ' · full' : ''}
        </h2>
        {team.length > 0 ? (
          <button
            type="button"
            onClick={onClearAll}
            className="text-caption text-text-muted underline hover:text-text"
          >
            Clear all
          </button>
        ) : null}
      </div>

      <ol className="grid grid-cols-3 gap-xs sm:grid-cols-6">
        {team.map((hero) => (
          <li key={hero.class_name}>
            {/* The whole slot is the clear control — a small × is a poor target
                mid-match, and there is nothing else a filled slot can do. */}
            <button
              type="button"
              onClick={() => onClear(hero.class_name)}
              className="group flex w-full items-center gap-xs rounded-lg border-2 border-brand bg-brand-subdued p-xs text-left transition-colors hover:border-threat-high"
            >
              <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-pill bg-surface">
                {hero.images.minimap ?? hero.images.portrait ? (
                  // eslint-disable-next-line @next/next/no-img-element -- E12 swaps this for next/image
                  <img
                    src={hero.images.minimap ?? hero.images.portrait ?? ''}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="text-caption">{hero.name.slice(0, 2)}</span>
                )}
              </span>
              <span className="min-w-0 flex-1 truncate text-caption text-brand-soft">
                {hero.name}
              </span>
              <span aria-hidden className="text-caption text-text-muted group-hover:text-threat-high">
                ×
              </span>
              <span className="sr-only">Remove {hero.name} from the enemy team</span>
            </button>
          </li>
        ))}

        {Array.from({ length: empties }, (_, index) => (
          <li
            key={`empty-${index}`}
            className="grid h-12 place-items-center rounded-lg border-2 border-dashed border-hairline text-caption text-text-muted"
          >
            <span aria-hidden>Empty</span>
            <span className="sr-only">Empty slot {team.length + index + 1}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
