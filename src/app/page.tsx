import { EmptyState, ItemCard } from '@/components/primitives.tsx'
import { ProvenanceStamp } from '@/components/provenance-stamp.tsx'
import { countersForTeam } from '@/data/counters.ts'
import { provenanceFor } from '@/data/provenance.ts'
import { HEROES } from '@/data/snapshot.ts'

/**
 * Placeholder home page, now showing that the engine works end to end. The
 * real interface — hero picker and team builder — arrives with E08 and E09.
 */
export default function Home() {
  // A fixed sample team until the picker exists. Slice, not hardcoded names, so
  // a roster change cannot break the page.
  const sample = HEROES.slice(0, 6)
  const counters = countersForTeam(sample.map((hero) => hero.class_name)).slice(0, 4)

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-xl p-xl">
      <header className="hero-gradient rounded-card p-2xl">
        <h1 className="text-display text-on-brand">Deadlock Counter Helper</h1>
        <p className="text-on-brand">
          Pick the enemy team, see every item that answers their kit — with costs, tiers, slots,
          and the specific ability each item counters.
        </p>
      </header>

      <ProvenanceStamp />

      <section className="flex flex-col gap-md">
        <h2 className="text-heading">
          Sample: {sample.map((hero) => hero.name).join(', ')}
        </h2>
        {counters.length ? (
          <div className="grid gap-md sm:grid-cols-2">
            {counters.map((counter) => (
              <ItemCard
                key={counter.item.class_name}
                name={counter.item.name}
                cost={counter.item.cost}
                tier={counter.item.tier}
                category={counter.item.category}
                strength={counter.strength}
                reason={counter.why}
                icon={counter.item.icon ?? counter.item.shop_icon}
                provenance={provenanceFor(counter.item.class_name)}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="No counters yet" hint="The overlay needs tags before this fills in." />
        )}
      </section>

      <p className="text-caption text-text-muted">
        Under construction — the hero picker lands with E08. Design system at{' '}
        <a className="text-brand underline" href="/styleguide">
          /styleguide
        </a>
        . Fan project; Deadlock is the property of Valve Corporation.
      </p>
    </main>
  )
}
