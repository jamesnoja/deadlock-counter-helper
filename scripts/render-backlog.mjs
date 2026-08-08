#!/usr/bin/env node
/**
 * Regenerates docs/BACKLOG.md from scripts/enhancements.mjs.
 * Run with: npm run backlog
 *
 * `renderBacklog()` is exported and pure so a test can assert the committed
 * doc still matches its source, rather than trusting everyone to remember
 * the regenerate step.
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { EPICS, ENHANCEMENTS, STATUSES } from './enhancements.mjs'

export const BACKLOG_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'docs',
  'BACKLOG.md',
)

const EPIC_TITLES = {
  foundation: 'Foundation — data pipeline and patch resilience',
  ux: 'Core UX — the counter helper itself',
  distribution: 'Distribution — URLs, SEO, sharing',
  quality: 'Quality — accessibility, performance, mobile',
  advanced: 'Advanced — differentiators',
}

/** `[x]` done, `[~]` in progress, `[ ]` not started. */
const checkbox = (status) => `[${STATUSES[status]?.marker ?? ' '}]`

export function renderBacklog() {
  const done = ENHANCEMENTS.filter((e) => e.status === 'done').length
  const active = ENHANCEMENTS.filter((e) => e.status === 'in-progress').length

  const lines = [
    '<!-- GENERATED FILE — edit scripts/enhancements.mjs and run `npm run backlog` -->',
    '',
    '# Enhancement backlog',
    '',
    `${ENHANCEMENTS.length} enhancements across ${Object.keys(EPICS).length} epics — ` +
      `**${done} done**, ${active} in progress, ${ENHANCEMENTS.length - done - active} to go.`,
    'Each becomes one GitHub issue via `npm run seed:issues`.',
    '',
    '## Index',
    '',
    '| | ID | Enhancement | Epic | Priority | Depends on |',
    '| --- | --- | --- | --- | --- | --- |',
  ]

  for (const e of ENHANCEMENTS) {
    const deps = e.depends.length ? e.depends.join(', ') : '—'
    lines.push(
      `| ${checkbox(e.status)} | [${e.id}](#${e.id.toLowerCase()}) | ${e.title} | ` +
        `${e.epic} | ${e.priority} | ${deps} |`,
    )
  }

  for (const key of Object.keys(EPICS)) {
    const group = ENHANCEMENTS.filter((e) => e.epic === key)
    if (!group.length) continue
    lines.push('', `## ${EPIC_TITLES[key] ?? key}`, '')
    for (const e of group) {
      const status = STATUSES[e.status] ? ` — **${STATUSES[e.status].label}**` : ''
      lines.push(`### ${e.id}`, '', `**${e.title}** — \`${e.priority}\`${status}`, '')
      lines.push(e.body.trim(), '')
      lines.push(`**Depends on:** ${e.depends.length ? e.depends.join(', ') : 'nothing'}`, '')
    }
  }

  return lines.join('\n') + '\n'
}

// Only write when invoked as a script, so importing for tests has no side effects.
// pathToFileURL, not a template literal — Windows drive letters need real encoding.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  mkdirSync(dirname(BACKLOG_PATH), { recursive: true })
  writeFileSync(BACKLOG_PATH, renderBacklog(), 'utf8')
  console.log(`Wrote ${BACKLOG_PATH} (${ENHANCEMENTS.length} enhancements)`)
}
