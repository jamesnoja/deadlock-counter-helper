import { Suspense } from 'react'
import { CounterTool } from '@/components/counter-tool.tsx'
import { MAX_ENEMIES } from '@/components/team-bar.tsx'
import { ButtonLink } from '@/components/primitives.tsx'
import { SourceCredit } from '@/components/source-credit.tsx'
import { PUBLISHED_META } from '@/data/published.ts'
import { ProvenanceStamp } from '@/components/provenance-stamp.tsx'
import { HEROES, heroBySlug } from '@/data/snapshot.ts'
import { decodeToolState } from '@/data/url-state.ts'

/**
 * Decoding the URL on the server means a shared link renders its counters in
 * the initial HTML rather than after hydration — which is what makes the link
 * worth sharing, and what E22's preview images will read.
 */
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const initial = decodeToolState(await searchParams, heroBySlug, MAX_ENEMIES)

  return (
    <main className="mx-auto flex w-[95%] flex-1 flex-col gap-xl p-xl">
      <header className="hero-gradient flex flex-wrap items-start justify-between gap-lg rounded-card p-2xl">
        <div className="min-w-0">
          <h1 className="text-display text-on-brand">Deadlock Counter Helper</h1>
          {/* Capped for line length; it also lets the button sit alongside. */}
          <p className="max-w-prose text-on-brand">
            Pick the enemy team. Get the items that answer them, with what each one costs and why it
            works, from a source that says when it was last updated.
          </p>
        </div>
        {/*
          The changelog is the evidence behind "says when it was last updated",
          so it sits beside that claim rather than in the footer. The provenance
          stamp links there too, but only once someone opens it.
        */}
        <ButtonLink variant="on-brand" href="/changelog">
          Patch changelog
        </ButtonLink>
      </header>

      <ProvenanceStamp />

      {/*
        useSearchParams needs a Suspense boundary. The fallback gets the same
        server-decoded state as the real thing: it is what a crawler and any
        no-JS visitor actually see, and rendering an empty tool there meant a
        shared six-hero link was indexed as an empty page.
      */}
      <Suspense fallback={<CounterTool heroes={HEROES} initial={initial} />}>
        <CounterTool heroes={HEROES} initial={initial} />
      </Suspense>

      <p className="text-caption text-text-muted">
        Fan project. Deadlock is the property of Valve Corporation. Design system at{' '}
        <a className="text-brand underline" href="/styleguide">
          /styleguide
        </a>
        .
      </p>

      <SourceCredit meta={PUBLISHED_META} />
    </main>
  )
}
