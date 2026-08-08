'use client'

/**
 * Soul budget — E14.
 *
 * Mid-match the only question that matters is "what can I buy right now". This
 * filters the shortlist to what you can afford, and keeps a "just out of reach"
 * section so the next back is plannable rather than a surprise.
 *
 * Filtering is pure client state over an array already in memory — no refetch,
 * nothing recomputed.
 */

import { ITEM_TIERS } from '@/data/schema.ts'

/** Cost is a pure function of tier upstream, so the tiers are the useful steps. */
export const TIER_COSTS: Record<number, number> = { 1: 800, 2: 1600, 3: 3200, 4: 6400 }

interface BudgetFilterProps {
  /** Null means no limit. */
  budget: number | null
  onChange: (budget: number | null) => void
  affordable: number
  outOfReach: number
}

export function BudgetFilter({ budget, onChange, affordable, outOfReach }: BudgetFilterProps) {
  const steps = ITEM_TIERS.filter((tier) => TIER_COSTS[tier] !== undefined)

  return (
    <div className="flex flex-wrap items-center gap-sm">
      <div role="group" aria-label="Soul budget" className="flex flex-wrap gap-xs">
        <button
          type="button"
          aria-pressed={budget === null}
          onClick={() => onChange(null)}
          className={[
            'rounded-pill border-2 px-md py-xs text-micro transition-colors',
            budget === null
              ? 'border-brand bg-brand-subdued text-brand-soft'
              : 'border-hairline text-text-muted hover:border-brand',
          ].join(' ')}
        >
          any souls
        </button>
        {steps.map((tier) => {
          const value = TIER_COSTS[tier]!
          return (
            <button
              key={tier}
              type="button"
              aria-pressed={budget === value}
              onClick={() => onChange(value)}
              className={[
                'rounded-pill border-2 px-md py-xs text-tabular text-micro transition-colors',
                budget === value
                  ? 'border-brand bg-brand-subdued text-brand-soft'
                  : 'border-hairline text-text-muted hover:border-brand',
              ].join(' ')}
            >
              {value.toLocaleString()}
            </button>
          )
        })}
      </div>

      <label className="flex items-center gap-xs">
        <span className="sr-only">Exact soul budget</span>
        <input
          type="number"
          min={0}
          step={100}
          value={budget ?? ''}
          onChange={(event) => {
            const next = event.target.value.trim()
            onChange(next === '' ? null : Math.max(Number(next), 0))
          }}
          placeholder="exact"
          className="w-24 rounded-md bg-surface-elevated p-sm text-tabular text-caption text-text placeholder:text-text-muted"
        />
      </label>

      {budget !== null ? (
        <p aria-live="polite" className="text-caption text-text-muted">
          <span className="text-tabular text-text">{affordable}</span> affordable
          {outOfReach > 0 ? (
            <>
              {' · '}
              <span className="text-tabular text-provenance-stale">{outOfReach}</span> just out of
              reach
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  )
}
