#!/usr/bin/env node
/**
 * Creates the GitHub labels and issues for the enhancement backlog.
 *
 *   node scripts/seed-issues.mjs --dry-run   # print what would happen
 *   node scripts/seed-issues.mjs             # actually create
 *
 * Idempotent: existing labels are updated, and issues whose exact title already
 * exists are skipped. Safe to re-run after adding entries to enhancements.mjs.
 *
 * Requires `gh` on PATH and `gh auth login` already completed.
 */

import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { EPICS, PRIORITIES, ENHANCEMENTS } from './enhancements.mjs'

const DRY_RUN = process.argv.includes('--dry-run')

const GH_FALLBACKS = [
  'C:\\Program Files\\GitHub CLI\\gh.exe',
  '/usr/bin/gh',
  '/opt/homebrew/bin/gh',
]

function resolveGh() {
  try {
    execFileSync('gh', ['--version'], { stdio: 'ignore' })
    return 'gh'
  } catch {
    const found = GH_FALLBACKS.find((p) => existsSync(p))
    if (found) return found
    throw new Error('GitHub CLI not found. Install it and run `gh auth login`.')
  }
}

const GH = resolveGh()

function gh(args, { allowFail = false } = {}) {
  if (DRY_RUN) {
    console.log(`  [dry-run] gh ${args.join(' ')}`)
    return ''
  }
  try {
    return execFileSync(GH, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  } catch (err) {
    if (allowFail) return null
    throw new Error(`gh ${args.slice(0, 3).join(' ')} failed:\n${err.stderr || err.message}`)
  }
}

function ensureLabel(name, color, description) {
  console.log(`label: ${name}`)
  gh(['label', 'create', name, '--color', color, '--description', description, '--force'])
}

function existingTitles() {
  if (DRY_RUN) return new Set()
  const raw = gh(['issue', 'list', '--state', 'all', '--limit', '500', '--json', 'title'])
  return new Set(JSON.parse(raw || '[]').map((i) => i.title))
}

function main() {
  if (!DRY_RUN) {
    const status = gh(['auth', 'status'], { allowFail: true })
    if (status === null) {
      console.error('Not authenticated. Run `gh auth login` first.')
      process.exit(1)
    }
  }

  console.log('\n--- labels ---')
  ensureLabel('enhancement', 'a2eeef', 'A planned improvement')
  for (const e of Object.values(EPICS)) ensureLabel(e.label, e.color, e.description)
  for (const p of Object.values(PRIORITIES)) ensureLabel(p.label, p.color, p.description)

  console.log('\n--- issues ---')
  const seen = existingTitles()
  let created = 0
  let skipped = 0

  for (const item of ENHANCEMENTS) {
    const title = `${item.id}: ${item.title}`
    if (seen.has(title)) {
      console.log(`skip (exists): ${title}`)
      skipped++
      continue
    }

    const deps = item.depends.length
      ? `\n\n---\n**Depends on:** ${item.depends.join(', ')}`
      : '\n\n---\n**Depends on:** nothing — can start immediately.'

    const body = `${item.body.trim()}${deps}\n\n<sub>Spec lives in \`scripts/enhancements.mjs\`. Edit there and run \`npm run backlog\`.</sub>\n`

    const labels = ['enhancement', EPICS[item.epic].label, PRIORITIES[item.priority].label]

    console.log(`create: ${title}`)
    gh(['issue', 'create', '--title', title, '--body', body, '--label', labels.join(',')])
    created++
  }

  console.log(`\nDone. created=${created} skipped=${skipped}${DRY_RUN ? ' (dry run)' : ''}`)
}

main()
