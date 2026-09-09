#!/usr/bin/env node
/**
 * Prints the last recorded snapshot change as markdown, correlated against
 * Valve's patch notes.
 *
 *   npm run sync:describe
 *
 * Used for the body of the automated sync pull request, and useful by hand when
 * you want to know what the most recent patch actually moved.
 *
 * The correlation is the part worth reading. A retune Valve documented is
 * routine; one that moved with no published note is the thing a reviewer should
 * look at, so it is reported separately and first.
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { correlate, describeCorrelation } from '../src/data/correlate.ts'
import { describeDiff, EMPTY_DIFF, type SnapshotDiff } from '../src/data/diff.ts'
import { readPatchArchive } from './patch-archive.mts'

const path = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'data',
  'snapshot',
  'changes.json',
)

let diff: SnapshotDiff = EMPTY_DIFF
try {
  diff = JSON.parse(readFileSync(path, 'utf8')) as SnapshotDiff
} catch {
  // No record yet — the first sync writes one.
}

const sections = [describeDiff(diff) || 'No recorded changes.']

if (diff.abilities.retuned.length > 0) {
  const notes = readPatchArchive()
  sections.push(
    notes.length === 0
      ? 'No patch notes archived yet — run `npm run sync:patches` to correlate these against ' +
          "Valve's own notes."
      : describeCorrelation(correlate(diff.abilities.retuned, notes)),
  )
}

console.log(sections.join('\n\n'))
