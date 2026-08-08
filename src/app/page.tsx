import { Suspense } from 'react'
import { CounterTool } from '@/components/counter-tool.tsx'
import { MAX_ENEMIES } from '@/components/team-bar.tsx'
import { ProvenanceStamp } from '@/components/provenance-stamp.tsx'
import { HEROES, heroBySlug } from '@/data/snapshot.ts'
import { decodeToolState, EMPTY_STATE } from '@/data/url-state.ts'

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
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-xl p-xl">
      <header className="hero-gradient rounded-card p-2xl">
        <h1 className="text-display text-on-brand">Deadlock Counter Helper</h1>
        <p className="text-on-brand">
          Pick the enemy team, see every item that answers their kit — with costs, tiers, slots,
          and the specific ability each item counters.
        </p>
      </header>

      <ProvenanceStamp />

      {/* useSearchParams needs a Suspense boundary; the fallback is what a
          crawler with no JS sees before the client takes over. */}
      <Suspense fallback={<CounterTool heroes={HEROES} initial={EMPTY_STATE} />}>
        <CounterTool heroes={HEROES} initial={initial} />
      </Suspense>

      <p className="text-caption text-text-muted">
        Fan project. Deadlock is the property of Valve Corporation. Design system at{' '}
        <a className="text-brand underline" href="/styleguide">
          /styleguide
        </a>
        .
      </p>
    </main>
  )
}
