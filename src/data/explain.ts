/**
 * Per-hero explanations for the item detail panel.
 *
 * Derived by default, authored by exception — the divergence recorded in E34.
 * The reference implementation hand-writes every item/hero pair, which reads
 * better and does not survive a patch: 156 items times 38 heroes only exists
 * because somebody typed it, and a new hero ships with blank text.
 *
 * A derived line names the specific ability and threat, resolves through
 * `class_name`, and therefore regenerates correctly after any rename.
 */

import type { HeroEffect } from './derive.ts'
import { THREAT_TAG_LABELS, type ItemCounters } from './tags.ts'

export interface PairExplanation {
  text: string
  /** True when a human wrote this line, so the UI can mark it as such. */
  editorial: boolean
}

/**
 * `Answers Grey Talon's Charged Shot — Gun DPS`
 *
 * Falls back to the threat alone when the ability cannot be named, and says so
 * plainly when the item does nothing about this hero. Silence would read as a
 * missing explanation rather than a deliberate "no".
 */
export function explainPair(
  effect: HeroEffect,
  heroName: string,
  abilityName: (className: string) => string | undefined,
  entry?: ItemCounters,
): PairExplanation {
  const authored = entry?.notes?.[effect.hero]?.trim()
  if (authored) return { text: authored, editorial: true }

  if (effect.strength === 'none') {
    return { text: `Does nothing about ${heroName}.`, editorial: false }
  }

  const threats = effect.tags.map((tag) => THREAT_TAG_LABELS[tag]).join(', ')
  const abilities = effect.abilities
    .map((className) => abilityName(className))
    .filter((name): name is string => Boolean(name))

  if (abilities.length === 0) {
    return { text: `Answers ${heroName}'s ${threats.toLowerCase()}.`, editorial: false }
  }

  const list =
    abilities.length === 1
      ? abilities[0]
      : `${abilities.slice(0, -1).join(', ')} and ${abilities.at(-1)}`

  return { text: `Answers ${heroName}'s ${list} — ${threats}.`, editorial: false }
}
