import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { GameImage } from '@/components/game-image.tsx'
import { ProvenanceStamp } from '@/components/provenance-stamp.tsx'
import { CounterSingle } from '@/components/counter-single.tsx'
import { SourceCredit } from '@/components/source-credit.tsx'
import { planForTeam } from '@/data/counters.ts'
import { absolute } from '@/data/site.ts'
import { abilitiesForHero, displayStats, HEROES, heroBySlug } from '@/data/snapshot.ts'

/**
 * Per-hero counter pages — E21.
 *
 * "how to counter haze deadlock" is the query people actually type, and the
 * tool itself is one route that cannot rank for any of it. These are 38 static
 * pages generated from the snapshot: add a hero upstream and its page appears
 * with no other change.
 *
 * Deliberately a **server component with no interactivity**. The content has to
 * be in the initial HTML with JavaScript disabled, and a static page that ships
 * no client bundle is also the cheapest thing we can serve.
 */

/** Primary slugs plus retired ones, so links shared before a rename still land. */
export function generateStaticParams() {
  return HEROES.flatMap((hero) => [
    { hero: hero.slug },
    ...hero.aliases.map((alias) => ({ hero: alias })),
  ])
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ hero: string }>
}): Promise<Metadata> {
  const { hero: slug } = await params
  const hero = heroBySlug(slug)
  if (!hero) return {}

  const canonical = absolute(`/counter/${hero.slug}`)
  return {
    title: `How to counter ${hero.name} in Deadlock`,
    description: `Every item that answers ${hero.name}'s kit, ability by ability — with costs, tiers and what each one actually stops.`,
    // An alias URL points at the primary, so the two do not compete.
    alternates: { canonical },
    openGraph: {
      title: `How to counter ${hero.name} in Deadlock`,
      description: `Items that answer ${hero.name}, ability by ability.`,
      url: canonical,
      type: 'article',
    },
  }
}

export default async function CounterHero({ params }: { params: Promise<{ hero: string }> }) {
  const { hero: slug } = await params
  const hero = heroBySlug(slug)
  if (!hero) notFound()

  const abilities = abilitiesForHero(hero)
  const plan = planForTeam([hero.class_name])
  const counters = plan.counters
  const advice = plan.heroes[0]

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-xl p-xl">
      <nav className="text-caption text-text-muted">
        <Link className="text-brand underline" href="/">
          Counter helper
        </Link>{' '}
        / {hero.name}
      </nav>

      <header className="flex flex-wrap items-center gap-lg rounded-card bg-surface p-2xl">
        <GameImage
          src={hero.images.card ?? hero.images.portrait}
          fallback={hero.name}
          size={96}
          className="shrink-0 rounded-card"
        />
        <div className="min-w-0">
          <h1 className="text-display">How to counter {hero.name}</h1>
          <p className="text-caption text-text-muted">
            {hero.role} · {counters.length} published answers
          </p>
        </div>
      </header>

      <ProvenanceStamp />

      <CounterSingle hero={hero} counters={counters} advice={advice} showHeading={false} />

      {/*
        Abilities as reference, not as a counter breakdown.
        The old version attached each answer to the named ability it addressed.
        That came from the tag overlay, which knew which ability carried which
        threat; the published source works at hero level and has no equivalent,
        so the linkage is gone rather than faked. Descriptions and live stats
        still come from the snapshot and are still worth having on the page.
      */}
      <section className="flex flex-col gap-md">
        <h2 className="text-heading">{hero.name}&rsquo;s abilities</h2>
        {abilities.map((ability) => {
          const stats = displayStats(ability.stats).slice(0, 6)
          return (
            <article
              key={ability.class_name}
              className="flex flex-col gap-md rounded-card bg-surface p-card"
            >
              <header className="flex items-start gap-md">
                <GameImage
                  src={ability.icon}
                  fallback={ability.name}
                  size={48}
                  className="shrink-0 rounded-md"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-heading">{ability.name}</h3>
                  <p className="text-micro text-text-muted">
                    {ability.slot === 4 ? 'Ultimate' : `Ability ${ability.slot}`}
                  </p>
                </div>
              </header>

              {ability.description ? (
                <p className="text-caption text-text-muted">{ability.description}</p>
              ) : null}

              {stats.length > 0 ? (
                <dl className="grid grid-cols-2 gap-x-lg gap-y-xs sm:grid-cols-3">
                  {stats.map(([property, stat]) => (
                    <div key={property} className="flex justify-between gap-sm">
                      <dt className="text-micro text-text-muted">{stat.label}</dt>
                      <dd className="text-tabular text-micro">
                        {stat.value}
                        {stat.unit}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </article>
          )
        })}
      </section>

      <section className="rounded-card bg-surface p-card">
        <h2 className="text-heading">Countering a whole team?</h2>
        <p className="text-caption text-text-muted">
          This page covers {hero.name} alone.{' '}
          <Link className="text-brand underline" href={`/?enemies=${hero.slug}`}>
            Open {hero.name} in the team builder
          </Link>{' '}
          to add the other five and see what answers the lineup together.
        </p>
      </section>

      <SourceCredit meta={plan.source} />

      <p className="text-caption text-text-muted">
        Fan project. Deadlock is the property of Valve Corporation.
      </p>
    </main>
  )
}
