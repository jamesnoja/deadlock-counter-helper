import type { PublishedMeta } from '@/data/published-schema.ts'

/**
 * Who wrote the advice on this page, and when we last fetched it.
 *
 * The counter guidance here is not ours. The summaries, situational calls and
 * lane advice are someone else's writing, imported under attribution, and that
 * credit belongs next to the content rather than in a footer nobody reads.
 *
 * The date is not decoration either. We now depend on a third party's refresh
 * cadence: if they stop updating, this page stops being right and nothing in
 * our own pipeline notices. Showing when we last pulled is the only signal a
 * reader gets, so it is stated plainly rather than buried.
 */
export function SourceCredit({ meta }: { meta: PublishedMeta }) {
  const retrieved = new Date(meta.retrieved_at)
  const stamp = Number.isNaN(retrieved.getTime())
    ? 'unknown'
    : retrieved.toISOString().slice(0, 10)

  return (
    <aside className="rounded-card border-2 border-hairline p-card">
      <h2 className="text-heading">Where this advice comes from</h2>
      <p className="text-caption text-text-muted">
        Counter recommendations, matchup summaries and lane advice are published by{' '}
        <a
          className="text-brand underline"
          href={meta.source_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {meta.source_name}
        </a>
        , and used here with attribution. Item costs, tiers and ability text come from the game&rsquo;s
        own assets.
      </p>
      <p className="mt-xs text-micro text-text-muted">
        Last fetched {stamp} · covering {meta.counts.heroes} heroes and {meta.counts.items} items.
        We follow their update cadence, not the patch cycle — if a matchup reads stale, it likely is.
      </p>
    </aside>
  )
}
