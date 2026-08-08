#!/usr/bin/env node
/**
 * Keeps the overlay in step with the snapshot.
 *
 *   npm run overlay:scaffold
 *
 * Adds entries for anything new, and **re-derives entries a machine produced
 * that nobody has since touched** — still `suggested`, still `untagged`, no
 * note. When the rules improve, those entries should improve with them;
 * leaving them stale was how Indomitable, Dispel Magic and Knockdown all sat
 * uncounted.
 *
 * Anything `curated`, and anything carrying a `note`, is read back and
 * re-emitted byte-for-byte identically. A note means somebody looked and
 * decided, so it is curation even at `suggested`. Curation is never
 * overwritten — that is the whole point of the overlay being the one
 * hand-owned layer.
 *
 * New entries carry `review: 'suggested'` and are derived from the game's own
 * description text by the conservative keyword rules below. A suggestion is a
 * starting point for a human, not advice. Anything the rules cannot read
 * confidently is emitted as `untagged` so it shows up as work rather than
 * hiding as a confident empty list.
 *
 * Comments in the overlay files do not survive the round-trip. Use the `note`
 * field.
 */

import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { ABILITIES, ITEMS } from '../src/data/snapshot.ts'
import { ABILITY_THREATS } from '../data/overlay/ability-threats.ts'
import { ITEM_COUNTERS } from '../data/overlay/item-counters.ts'
import type { AbilityThreats, ItemCounters, ThreatTag } from '../src/data/tags.ts'

const OVERLAY_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'overlay')

/**
 * Deliberately conservative. A rule earns its place only if the phrase it
 * matches means the same thing everywhere it appears in Deadlock's text —
 * a wrong tag is worse than a missing one, because a missing one is visible.
 */
const ABILITY_RULES: Array<[ThreatTag, RegExp]> = [
  ['hard_cc', /\b(stun|silenc|root|immobili[sz]|disarm|sleep|petrif|frozen|freeze)/i],
  ['sustain', /\b(heal|regenerat|lifesteal|restore health|barrier|shield)/i],
  ['stealth', /\b(invisib|stealth|conceal|untargetab)/i],
  ['displacement', /\b(knock ?(back|up|down)|push(es|ed)? |pull(s|ed)? |launch(es|ed)? |displac)/i],
  ['dot_debuff', /\b(damage over time|burn(ing)?|bleed|poison|corros)/i],
  ['channeled_ult', /\bchannel/i],
  ['zone_denial', /\b(area of effect|zone|damaging field|aura|leaving behind a)/i],
  ['summon_pressure', /\b(summon|conjure|spawn|turret|minion)/i],
  ['airborne', /\b(fly(ing)?|flight|airborne|hover|levitat)/i],
  ['melee_pressure', /\bmelee/i],
  // No rule for burst_spirit or high_dps_gun. Nearly every ability mentions
  // "spirit damage", and the tag means burst specifically — the text cannot
  // tell the two apart, and a wrong tag is worse than a missing one because a
  // missing one is visible in the coverage report.
]

const ITEM_RULES: Array<[ThreatTag, RegExp]> = [
  ['high_dps_gun', /\b(immune to bullets|bullet resist|weapon resist|bullet armor)/i],
  ['burst_spirit', /\b(spirit resist|spirit armor|immune to spirit)/i],
  ['sustain', /\b(healing reduction|reduces? healing|anti-?heal)/i],
  ['hard_cc', /\b(debuff|cleanse|dispel|immune to (stun|silence)|reduces the duration|tenacity|unstoppable)/i],
  ['stealth', /\b(reveal|detect|see (enemies|invisible))/i],
  ['dot_debuff', /\b(removes? (all )?(negative|debuff)|cleanse)/i],
  ['channeled_ult', /\b(silence|interrupt|curse|knockdown)/i],
  ['displacement', /\b(immune to (knockback|displacement)|unstoppable|stable)/i],
  ['melee_pressure', /\b(melee (resist|damage)|return fire|reflect)/i],
  ['summon_pressure', /\b(bonus damage (to|against) (npcs?|creeps?|summons?))/i],
]

/**
 * What the rules read.
 *
 * Not just the description: upstream ships **no description at all** for 32
 * items, and reading only descriptions silently marked every one of them
 * untagged regardless of what they do. Indomitable is `upgrade_auto_cleanse`
 * and Dispel Magic is `upgrade_reduce_debuff_duration` — the identifier says
 * plainly what the missing text would have.
 *
 * Underscores become spaces so word boundaries behave: `auto_cleanse` has to
 * match `\bcleanse\b`.
 */
const searchableText = (entity: { name?: string; class_name?: string; description: string }) =>
  [entity.description, (entity.class_name ?? '').replace(/_/g, ' '), entity.name ?? '']
    .filter(Boolean)
    .join(' ')

const suggest = (text: string, rules: Array<[ThreatTag, RegExp]>): ThreatTag[] => {
  const tags = rules.filter(([, pattern]) => pattern.test(text)).map(([tag]) => tag)
  return [...new Set(tags)].sort()
}

/**
 * Whether an entry may be re-derived when the rules improve.
 *
 * Only entries a machine produced and a human never touched: still
 * `suggested`, still `untagged`, and carrying no note. A note means somebody
 * looked and decided, so it is curation even at `suggested`. Anything
 * `curated` is never touched — that is the whole promise of the overlay.
 */
const isMachineUndecided = (entry: { review: string; untagged?: true; note?: string }) =>
  entry.review === 'suggested' && entry.untagged === true && !entry.note

/** Deterministic emit: keys sorted, stable field order, so diffs are readable. */
function emit<T>(
  path: string,
  exportName: string,
  typeName: string,
  entries: Record<string, T>,
  header: string,
) {
  const keys = Object.keys(entries).sort()
  const body = keys
    .map((key) => `  ${JSON.stringify(key)}: ${JSON.stringify(entries[key])},`)
    .join('\n')
  const contents = `${header}\nimport type { ${typeName} } from '../../src/data/tags.ts'\n\nexport const ${exportName}: Record<string, ${typeName}> = {\n${body}\n}\n`
  writeFileSync(path, contents, 'utf8')
  return keys.length
}

const abilityEntries: Record<string, AbilityThreats> = { ...ABILITY_THREATS }
let newAbilities = 0
let refreshedAbilities = 0
for (const ability of ABILITIES) {
  const existing = abilityEntries[ability.class_name]
  if (existing && !isMachineUndecided(existing)) continue

  const tags = suggest(searchableText(ability), ABILITY_RULES)
  // Re-deriving an undecided entry only helps if the rules now find something.
  if (existing && tags.length === 0) continue

  abilityEntries[ability.class_name] = tags.length
    ? { tags, review: 'suggested' }
    : { tags: [], untagged: true, review: 'suggested' }
  if (existing) refreshedAbilities++
  else newAbilities++
}

const itemEntries: Record<string, ItemCounters> = { ...ITEM_COUNTERS }
let newItems = 0
let refreshedItems = 0
for (const item of ITEMS) {
  const existing = itemEntries[item.class_name]
  if (existing && !isMachineUndecided(existing)) continue

  const answers = suggest(searchableText(item), ITEM_RULES)
  if (existing && answers.length === 0) continue

  itemEntries[item.class_name] = answers.length
    ? {
        answers,
        // No description means no sentence to quote, so say what we do know
        // rather than shipping a blank reason to the UI.
        why:
          item.description.split('. ')[0]?.slice(0, 120) ||
          `Answers ${answers.join(', ').replace(/_/g, ' ')} — no description upstream, tagged from its identifier.`,
        strength: 'situational',
        review: 'suggested',
      }
    : { answers: [], untagged: true, why: '', strength: 'situational', review: 'suggested' }
  if (existing) refreshedItems++
  else newItems++
}

const banner = (what: string) =>
  `/**\n * GENERATED SCAFFOLD, HAND-CURATED CONTENT — ${what}.\n *\n * Run \`npm run overlay:scaffold\` after a sync. It adds entries for anything\n * new and re-derives machine suggestions nobody has touched. Curated entries,\n * and any entry carrying a note, are never modified.\n *\n * Entries marked \`review: "suggested"\` were derived from the game's own\n * description text and have NOT been confirmed by anyone who plays the\n * matchup. Change to "curated" once checked. Put prose in \`note\` — comments\n * are lost on the next round-trip.\n */`

const abilityCount = emit(
  join(OVERLAY_DIR, 'ability-threats.ts'),
  'ABILITY_THREATS',
  'AbilityThreats',
  abilityEntries,
  banner('what each ability threatens'),
)
const itemCount = emit(
  join(OVERLAY_DIR, 'item-counters.ts'),
  'ITEM_COUNTERS',
  'ItemCounters',
  itemEntries,
  banner('what each item answers'),
)

console.log(`abilities: ${abilityCount} total, ${newAbilities} added, ${refreshedAbilities} re-derived`)
console.log(`items:     ${itemCount} total, ${newItems} added, ${refreshedItems} re-derived`)
