import {
  COUNTER_STRENGTHS,
  STRENGTH_MEANINGS,
  THREAT_SEVERITY,
  THREAT_TAGS,
  THREAT_TAG_LABELS,
  THREAT_TAG_MEANINGS,
  type ThreatTag,
} from '@/data/tags.ts'

/**
 * The vocabulary, on the page that asks you to apply it.
 *
 * Curation is only consistent if everyone means the same thing by a tag, and
 * the boundary cases are where it goes wrong — `hard_cc` quietly collecting
 * slows is how three of the current entries got mis-tagged. So each tag states
 * what it excludes as prominently as what it covers.
 */

const SEVERITY_LABEL: Record<number, string> = {
  3: 'Decides fights',
  2: 'Shapes fights',
  1: 'Annoyance',
}

export function Glossary({ heroCounts }: { heroCounts: Map<ThreatTag, number> }) {
  const tags = [...THREAT_TAGS].sort(
    (a, b) => (heroCounts.get(b) ?? 0) - (heroCounts.get(a) ?? 0),
  )

  return (
    <details className="rounded-card bg-surface p-card">
      <summary className="cursor-pointer text-heading marker:content-none hover:text-brand">
        What the tags mean ▾
      </summary>

      <p className="mt-sm text-caption text-text-muted">
        A tag is what an ability <em>threatens</em> and what an item <em>answers</em>. The engine
        joins the two, so a tag applied loosely does not just mis-describe one item — it puts that
        item in front of every player facing that threat.
      </p>

      <dl className="mt-md flex flex-col gap-md">
        {tags.map((tag) => {
          const meaning = THREAT_TAG_MEANINGS[tag]
          const heroes = heroCounts.get(tag) ?? 0
          return (
            <div key={tag} className="border-l-2 border-hairline pl-md">
              <dt className="flex flex-wrap items-baseline gap-sm">
                <span className="text-heading">{THREAT_TAG_LABELS[tag]}</span>
                <code className="text-micro text-text-muted">{tag}</code>
                <span className="text-micro text-text-muted">
                  {SEVERITY_LABEL[THREAT_SEVERITY[tag]]} · presented by {heroes}{' '}
                  {heroes === 1 ? 'hero' : 'heroes'}
                </span>
              </dt>
              <dd className="mt-xs text-caption text-text-muted">
                {meaning.covers}
                <br />
                <span className="text-threat-high">Not this:</span> {meaning.excludes}
              </dd>
            </div>
          )
        })}
      </dl>

      <h3 className="mt-lg text-heading">What the strengths mean</h3>
      <p className="text-caption text-text-muted">
        The question is whether buying the item changes the outcome — not whether the item is good.
        Good-in-general is what left the whole overlay at the default.
      </p>
      <dl className="mt-sm flex flex-col gap-sm">
        {COUNTER_STRENGTHS.map((strength) => (
          <div key={strength} className="border-l-2 border-hairline pl-md">
            <dt className="text-tabular">{strength}</dt>
            <dd className="text-caption text-text-muted">{STRENGTH_MEANINGS[strength]}</dd>
          </div>
        ))}
      </dl>
    </details>
  )
}
