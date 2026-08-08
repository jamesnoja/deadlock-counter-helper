#!/usr/bin/env node
/**
 * Prints the last recorded snapshot change as markdown.
 *
 *   npm run sync:describe
 *
 * Used for the body of the automated sync pull request, and useful by hand
 * when you want to know what the most recent patch actually moved.
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describeDiff, EMPTY_DIFF, type SnapshotDiff } from '../src/data/diff.ts'

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

const summary = describeDiff(diff)
console.log(summary || 'No recorded changes.')
