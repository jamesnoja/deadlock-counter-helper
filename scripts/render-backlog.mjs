#!/usr/bin/env node
/**
 * Regenerates docs/BACKLOG.md from scripts/enhancements.mjs.
 * Run with: npm run backlog
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { EPICS, ENHANCEMENTS } from './enhancements.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'docs', 'BACKLOG.md')

const EPIC_TITLES = {
  foundation: 'Foundation — data pipeline and patch resilience',
  ux: 'Core UX — the counter helper itself',
  distribution: 'Distribution — URLs, SEO, sharing',
  quality: 'Quality — accessibility, performance, mobile',
  advanced: 'Advanced — differentiators',
}

const lines = [
  '<!-- GENERATED FILE — edit scripts/enhancements.mjs and run `npm run backlog` -->',
  '',
  '# Enhancement backlog',
  '',
  `${ENHANCEMENTS.length} enhancements across ${Object.keys(EPICS).length} epics.`,
  'Each becomes one GitHub issue via `npm run seed:issues`.',
  '',
  '## Index',
  '',
  '| ID | Enhancement | Epic | Priority | Depends on |',
  '| --- | --- | --- | --- | --- |',
]

for (const e of ENHANCEMENTS) {
  const deps = e.depends.length ? e.depends.join(', ') : '—'
  lines.push(`| [${e.id}](#${e.id.toLowerCase()}) | ${e.title} | ${e.epic} | ${e.priority} | ${deps} |`)
}

for (const key of Object.keys(EPICS)) {
  const group = ENHANCEMENTS.filter((e) => e.epic === key)
  if (!group.length) continue
  lines.push('', `## ${EPIC_TITLES[key] ?? key}`, '')
  for (const e of group) {
    lines.push(`### ${e.id}`, '', `**${e.title}** — \`${e.priority}\``, '')
    lines.push(e.body.trim(), '')
    lines.push(`**Depends on:** ${e.depends.length ? e.depends.join(', ') : 'nothing'}`, '')
  }
}

mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, lines.join('\n') + '\n', 'utf8')
console.log(`Wrote ${out} (${ENHANCEMENTS.length} enhancements)`)
