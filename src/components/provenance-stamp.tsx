/**
 * The header stamp: "Data synced from patch X — verified <date>".
 *
 * Trust is the whole value proposition of a counter tool, and no competitor
 * shows where their data came from or how old it is. This is a feature, not
 * chrome, which is why it sits in the header rather than a footer.
 *
 * The explanation is a `<details>` rather than a hover tooltip. E07 says
 * "hovering explains", but hover is unreachable by keyboard and on touch, and
 * the design profile's second principle rules out affordances that only some
 * people can use.
 */

import { provenanceSummary } from '@/data/provenance.ts'
import { ProvenanceDot } from './primitives.tsx'

/** Absolute, unambiguous, and generated — never hand-edited. */
function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'unknown date'
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function daysSince(iso: string): number | null {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return null
  return Math.floor((Date.now() - then) / 86_400_000)
}

export function ProvenanceStamp() {
  const { patchTitle, patchLink, syncedAt, flaggedCount, untaggedCount } = provenanceSummary()
  const age = daysSince(syncedAt)
  const clean = flaggedCount === 0

  return (
    <details className="rounded-card bg-surface p-lg">
      <summary className="flex cursor-pointer flex-wrap items-center gap-sm marker:content-none">
        <ProvenanceDot
          state={clean ? 'verified' : 'stale'}
          label={
            clean
              ? `Synced from ${patchTitle}`
              : `${flaggedCount} ${flaggedCount === 1 ? 'entry needs' : 'entries need'} review since ${patchTitle}`
          }
        />
        <span className="text-caption text-text-muted">
          verified {formatDate(syncedAt)}
          {age !== null ? ` · ${age === 0 ? 'today' : `${age}d ago`}` : ''}
        </span>
        <span aria-hidden className="text-caption text-text-muted">
          ⌄
        </span>
      </summary>

      <div className="mt-md flex flex-col gap-sm">
        <p className="text-caption text-text-muted">
          Heroes, abilities and items come from the Deadlock assets API, normalised and committed
          to this repository — the site never queries it live, so a patch cannot change what you
          see without a reviewed change landing first. A job checks daily and opens a pull request
          when anything moves.
        </p>
        <p className="text-caption text-text-muted">
          A <strong>circle</strong> means the last patch did not touch that entry. A{' '}
          <strong>diamond</strong> means it did and nobody has re-checked the advice yet — it is
          not a claim the advice is wrong, only that we have not confirmed it is still right.
        </p>
        {untaggedCount > 0 ? (
          <p className="text-caption text-provenance-stale">
            {untaggedCount} new {untaggedCount === 1 ? 'entity is' : 'entities are'} untagged and
            invisible to the recommendation engine until curated.
          </p>
        ) : null}
        {patchLink ? (
          <a className="text-caption text-brand underline" href={patchLink}>
            Read the {patchTitle} patch notes
          </a>
        ) : null}
      </div>
    </details>
  )
}
