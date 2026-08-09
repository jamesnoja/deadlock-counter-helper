import type { PublishedMeta } from '@/data/published-schema.ts'

/**
 * Who wrote the advice, in one line, beside the other fine print.
 *
 * The counter guidance is not ours — it is imported under attribution, so the
 * credit and the link are not optional. The fetch date rides along because we
 * follow the source's refresh cadence rather than the patch cycle, and it is
 * the only staleness signal a reader gets.
 */
export function SourceCredit({ meta }: { meta: PublishedMeta }) {
  const retrieved = new Date(meta.retrieved_at)
  const stamp = Number.isNaN(retrieved.getTime()) ? 'an unknown date' : retrieved.toISOString().slice(0, 10)

  return (
    <p className="text-caption text-text-muted">
      Counter advice published by{' '}
      <a
        className="text-brand underline"
        href={meta.source_url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {meta.source_name}
      </a>
      , fetched {stamp}.
    </p>
  )
}
