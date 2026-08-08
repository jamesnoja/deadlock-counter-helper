'use client'

/**
 * Click tags instead of editing TypeScript.
 *
 * There is no backend — the snapshot and overlay are committed files, which is
 * what makes builds reproducible. So this holds edits in component state and
 * emits the exact overlay entries to paste. One copy, one paste, one commit.
 * Pretending to save would be worse than being honest about the last step.
 */

import { useMemo, useState } from 'react'
import type { CurationEntry } from '@/data/overlay.ts'
import { COUNTER_STRENGTHS, THREAT_TAGS, type CounterStrength, type ThreatTag } from '@/data/tags.ts'
import { Button } from '@/components/primitives.tsx'

interface Edit {
  tags: ThreatTag[]
  strength: CounterStrength
  why: string
}

const BUCKET_LABEL: Record<string, string> = {
  blocked: 'No description upstream — needs someone who has played it',
  untagged: 'Has text, nothing applied yet',
  suggested: 'Machine-suggested, unconfirmed',
  curated: 'Confirmed',
}

export function CurationList({ entries, kind }: { entries: CurationEntry[]; kind: 'ability' | 'item' }) {
  const [edits, setEdits] = useState<Record<string, Edit>>({})
  const [copied, setCopied] = useState(false)

  const editFor = (entry: CurationEntry): Edit =>
    edits[entry.class_name] ?? {
      tags: entry.tags,
      strength: (entry.strength as CounterStrength) ?? 'situational',
      why: entry.why ?? '',
    }

  const update = (entry: CurationEntry, patch: Partial<Edit>) =>
    setEdits((current) => ({
      ...current,
      [entry.class_name]: { ...editFor(entry), ...patch },
    }))

  const toggle = (entry: CurationEntry, tag: ThreatTag) => {
    const { tags } = editFor(entry)
    update(entry, { tags: tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag] })
  }

  /** Exactly the shape the overlay files hold, so it pastes straight in. */
  const output = useMemo(() => {
    const lines = Object.entries(edits).map(([className, edit]) => {
      const tags = [...new Set(edit.tags)].sort()
      const body =
        kind === 'ability'
          ? tags.length
            ? { tags, review: 'curated' }
            : { tags: [], untagged: true, review: 'curated' }
          : tags.length
            ? { answers: tags, why: edit.why, strength: edit.strength, review: 'curated' }
            : { answers: [], untagged: true, why: '', strength: edit.strength, review: 'curated' }
      return `  ${JSON.stringify(className)}: ${JSON.stringify(body)},`
    })
    return lines.join('\n')
  }, [edits, kind])

  const copy = async () => {
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const editedCount = Object.keys(edits).length

  return (
    <div className="flex flex-col gap-lg">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-md rounded-card bg-surface-elevated p-lg">
        <span className="text-tabular">{editedCount} edited</span>
        <Button onClick={copy} aria-disabled={editedCount === 0}>
          {copied ? 'Copied' : `Copy ${editedCount} entr${editedCount === 1 ? 'y' : 'ies'}`}
        </Button>
        <span className="text-caption text-text-muted">
          Paste into{' '}
          <code>data/overlay/{kind === 'ability' ? 'ability-threats.ts' : 'item-counters.ts'}</code>,
          replacing the matching lines. Anything you touch is marked{' '}
          <code>review: &quot;curated&quot;</code>.
        </span>
      </div>

      <ul className="flex flex-col gap-md">
        {entries.map((entry) => {
          const edit = editFor(entry)
          const dirty = Boolean(edits[entry.class_name])
          return (
            <li key={entry.class_name} className="flex flex-col gap-sm rounded-card bg-surface p-card">
              <div className="flex flex-wrap items-baseline justify-between gap-sm">
                <h3 className="text-heading">
                  {entry.hero ? `${entry.hero} · ` : ''}
                  {entry.name}
                  {entry.slot ? <span className="text-text-muted"> (slot {entry.slot})</span> : null}
                </h3>
                <span className="text-micro text-text-muted">{BUCKET_LABEL[entry.bucket]}</span>
              </div>

              <p className="text-caption text-text-muted">
                {entry.description || (
                  <em>No description in the assets API. This one cannot be settled from data.</em>
                )}
              </p>
              {entry.note ? <p className="text-caption text-brand-soft">{entry.note}</p> : null}

              <div className="flex flex-wrap gap-xs">
                {THREAT_TAGS.map((tag) => {
                  const on = edit.tags.includes(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle(entry, tag)}
                      className={[
                        'rounded-pill border-2 px-md py-xs text-micro transition-colors',
                        on
                          ? 'border-brand bg-brand-subdued text-brand-soft'
                          : 'border-hairline text-text-muted hover:border-brand',
                      ].join(' ')}
                    >
                      {on ? '✓ ' : ''}
                      {tag}
                    </button>
                  )
                })}
              </div>

              {kind === 'item' ? (
                <div className="flex flex-wrap items-center gap-sm">
                  <label className="text-caption text-text-muted">
                    Strength{' '}
                    <select
                      value={edit.strength}
                      onChange={(event) =>
                        update(entry, { strength: event.target.value as CounterStrength })
                      }
                      className="rounded-md bg-surface-elevated p-xs text-text"
                    >
                      {COUNTER_STRENGTHS.map((strength) => (
                        <option key={strength} value={strength}>
                          {strength}
                        </option>
                      ))}
                    </select>
                  </label>
                  <input
                    value={edit.why}
                    onChange={(event) => update(entry, { why: event.target.value })}
                    placeholder="Why this answers it — shown to users"
                    className="min-w-0 flex-1 rounded-md bg-surface-elevated p-sm text-caption text-text"
                  />
                </div>
              ) : null}

              {dirty ? <p className="text-micro text-brand">edited — included in copy</p> : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
