'use client'

/**
 * The item stat card — E35.
 *
 * Deciding between two counters usually comes down to numbers: cooldown,
 * duration, resistance. The snapshot has them and the table was throwing them
 * away.
 *
 * A `<details>` disclosure, not a hover tooltip. Hover is unreachable by
 * keyboard and does not exist on touch — the same reasoning as the provenance
 * stamp in E07. It closes on Escape and never traps focus, because a summary
 * element is just a button.
 */

import type { AbilityStat } from '@/data/schema.ts'

interface ItemStatsProps {
  stats: Record<string, AbilityStat>
  itemName: string
}

export function ItemStats({ stats, itemName }: ItemStatsProps) {
  const entries = Object.entries(stats)
  if (entries.length === 0) return null

  return (
    <details
      className="group/stats"
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return
        const element = event.currentTarget
        if (element.open) {
          event.stopPropagation()
          element.open = false
        }
      }}
    >
      <summary className="cursor-pointer text-micro text-text-muted marker:content-none hover:text-brand">
        <span aria-hidden>▸ </span>
        stats
        <span className="sr-only"> for {itemName}</span>
      </summary>
      {/*
        Keyed on the upstream property name, never the label: some items carry
        two properties with the same label — Counterspell has "Spirit Power"
        twice — and labels would collide.
      */}
      <dl className="mt-xs grid grid-cols-2 gap-x-md">
        {entries.map(([property, stat]) => (
          <div key={property} className="flex justify-between gap-sm">
            <dt className="text-micro text-text-muted">{stat.label}</dt>
            <dd className="text-tabular text-micro">
              {stat.value}
              {stat.unit}
            </dd>
          </div>
        ))}
      </dl>
    </details>
  )
}
