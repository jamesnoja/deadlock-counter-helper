'use client'

/**
 * Ability-level granularity — E17.
 *
 * The original site said "counter Haze" and buried the specifics in prose. It
 * never attached a counter to a named ability as data. This does: every enemy
 * ability, its icon, its live numbers from the snapshot, the threats it
 * presents, and the items that answer it.
 *
 * Nothing here is authored. The ability-to-threat link is the overlay, the
 * threat-to-item link is the overlay, and the join is E05 — so retuning one
 * ability upstream updates exactly that ability's entry.
 */

import { GameImage } from './game-image.tsx'
import type { RankedCounter } from '@/data/derive.ts'
import { threatsForAbility } from '@/data/overlay.ts'
import type { Ability, Hero } from '@/data/schema.ts'
import { itemArtwork } from '@/data/snapshot.ts'
import { THREAT_TAG_LABELS } from '@/data/tags.ts'

interface AbilityBreakdownProps {
  hero: Hero
  abilities: readonly Ability[]
  counters: readonly RankedCounter[]
  onSelectItem?: (className: string) => void
}

export function AbilityBreakdown({
  hero,
  abilities,
  counters,
  onSelectItem,
}: AbilityBreakdownProps) {
  return (
    <div className="flex flex-col gap-sm">
      <h4 className="text-micro text-text-muted">{hero.name}&rsquo;s abilities</h4>
      <ul className="flex flex-col gap-xs">
        {abilities.map((ability) => {
          const entry = threatsForAbility(ability.class_name)
          const tags = entry?.tags ?? []

          /**
           * Items answering *this* ability, not the hero as a whole — the whole
           * point of E17. An item counts only if one of the tags it answers is
           * a tag this specific ability presents.
           */
          const answers = counters.filter((counter) =>
            counter.perHero.some(
              (effect) =>
                effect.hero === hero.class_name &&
                effect.abilities.includes(ability.class_name) &&
                effect.tags.some((tag) => tags.includes(tag)),
            ),
          )

          const stats = Object.entries(ability.stats).slice(0, 4)

          return (
            <li
              key={ability.class_name}
              className="flex flex-col gap-xs rounded-lg bg-surface-elevated p-md"
            >
              <div className="flex items-center gap-sm">
                <GameImage
                  src={ability.icon}
                  fallback={ability.name}
                  size={32}
                  className="shrink-0 rounded-md"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-caption">{ability.name}</span>
                  <span className="block text-micro text-text-muted">
                    Slot {ability.slot}
                    {stats.length > 0 ? (
                      <>
                        {' · '}
                        {stats.map(([property, stat], index) => (
                          <span key={property}>
                            {index > 0 ? ' · ' : ''}
                            {stat.label} <span className="text-tabular">{stat.value}</span>
                            {stat.unit}
                          </span>
                        ))}
                      </>
                    ) : null}
                  </span>
                </span>
              </div>

              {tags.length === 0 ? (
                <p className="text-micro text-text-muted">
                  No threat tagged — nothing is recommended against this yet.
                </p>
              ) : (
                <>
                  <ul className="flex flex-wrap gap-xs">
                    {tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-pill bg-surface px-sm py-px text-micro text-threat-medium"
                      >
                        {THREAT_TAG_LABELS[tag]}
                      </li>
                    ))}
                  </ul>

                  {answers.length === 0 ? (
                    <p className="text-micro text-text-muted">
                      Nothing in the current shortlist answers this.
                    </p>
                  ) : (
                    <ul className="flex flex-wrap gap-xs">
                      {answers.map((counter) => (
                        <li key={counter.item.class_name}>
                          <button
                            type="button"
                            onClick={() => onSelectItem?.(counter.item.class_name)}
                            className="flex items-center gap-xs rounded-pill bg-surface px-sm py-px text-micro hover:text-brand"
                          >
                            <GameImage
                              src={itemArtwork(counter.item)}
                              fallback={counter.item.name}
                              size={16}
                              className="rounded-sm"
                            />
                            {counter.item.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
