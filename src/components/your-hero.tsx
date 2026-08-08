'use client'

/**
 * "Your hero" — E18, partially.
 *
 * Counters are asymmetric: the same item is excellent on a frontliner and weak
 * on a sniper. Picking your hero nudges the ranking toward what your role
 * wants.
 *
 * **What this does not do**, and says so rather than implying otherwise: E18
 * also asks for redundancy warnings like "your ult already grants CC immunity".
 * That needs the overlay to record what an ability *provides*, and it only
 * records what an ability *threatens*. Claiming the feature while silently
 * omitting the useful half would be worse than a plain note.
 */

import type { Hero } from '@/data/schema.ts'

interface YourHeroProps {
  heroes: readonly Hero[]
  value: string | null
  onChange: (className: string | null) => void
}

export function YourHero({ heroes, value, onChange }: YourHeroProps) {
  const chosen = heroes.find((hero) => hero.class_name === value) ?? null

  return (
    <div className="flex flex-wrap items-center gap-sm">
      <label className="flex items-center gap-xs">
        <span className="text-micro text-text-muted">Playing as</span>
        <select
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value || null)}
          className="rounded-md bg-surface-elevated p-sm text-caption text-text"
        >
          <option value="">anyone</option>
          {[...heroes]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((hero) => (
              <option key={hero.class_name} value={hero.class_name}>
                {hero.name}
              </option>
            ))}
        </select>
      </label>

      {chosen ? (
        <p aria-live="polite" className="text-caption text-text-muted">
          {chosen.role === 'unknown' ? (
            <>No role recorded for {chosen.name}, so the ranking is unchanged.</>
          ) : (
            <>
              Nudged toward what a <span className="text-text">{chosen.role}</span> wants. The enemy
              lineup still decides the order.
            </>
          )}
        </p>
      ) : null}
    </div>
  )
}
