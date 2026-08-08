import { CounterTool } from '@/components/counter-tool.tsx'
import { ProvenanceStamp } from '@/components/provenance-stamp.tsx'
import { HEROES } from '@/data/snapshot.ts'

export default function Home() {
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

      {/* Heroes are read on the server from the committed snapshot; only the
          selection needs to be interactive. */}
      <CounterTool heroes={HEROES} />

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
