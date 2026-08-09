import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { GameImage } from '@/components/game-image.tsx'
import { CategoryTag } from '@/components/item-meta.tsx'
import { ProvenanceStamp } from '@/components/provenance-stamp.tsx'
import { SourceCredit } from '@/components/source-credit.tsx'
import { planForTeam } from '@/data/counters.ts'
import { absolute } from '@/data/site.ts'
import { abilitiesForHero, displayStats, HEROES, heroBySlug, itemArtwork } from '@/data/snapshot.ts'
import { reasonFor } from '@/data/sourced.ts'

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

      {advice ? (
        <section className="rounded-card bg-surface p-card">
          <h2 className="text-heading">The short version</h2>
          <p className="text-caption text-text-muted">{advice.summary}</p>
        </section>
      ) : (
        <section className="rounded-card bg-surface p-card">
          <h2 className="text-heading">No published advice yet</h2>
          <p className="text-caption text-text-muted">
            Our source has not written {hero.name} up. That is not the same as nothing countering
            them — it means nobody has published what does. The abilities below are straight from
            the game.
          </p>
        </section>
      )}

      <section className="flex flex-col gap-md">
        <h2 className="text-heading">Best answers to {hero.name}</h2>
        <ol className="flex flex-col gap-xs">
          {counters.slice(0, 8).map((counter, index) => (
            <li
              key={counter.item.class_name}
              className="flex items-center gap-md rounded-lg bg-surface p-row"
            >
              <span className="w-4 shrink-0 text-tabular text-text-muted">{index + 1}</span>
              <GameImage
                src={itemArtwork(counter.item)}
                fallback={counter.item.name}
                size={36}
                className="shrink-0 rounded-md"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-caption">{counter.item.name}</span>
                <span className="block text-micro text-text-muted">{reasonFor(counter)}</span>
              </span>
              <span className="flex shrink-0 items-center gap-sm">
                <CategoryTag category={counter.item.category} />
                <span className="text-tabular text-caption">
                  {counter.item.cost.toLocaleString()}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {advice && advice.situations.length > 0 ? (
        <section className="flex flex-col gap-md">
          <h2 className="text-heading">When it goes wrong, buy this</h2>
          <p className="text-caption text-text-muted">
            Specific problems with specific answers, rather than a shopping list.
          </p>
          <ul className="flex flex-col gap-sm">
            {advice.situations.map((situation) => (
              <li key={situation.label} className="rounded-card bg-surface p-card">
                <h3 className="text-heading">{situation.label}</h3>
                <p className="text-caption text-text-muted">{situation.reason}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {advice && advice.lanePhase.length > 0 ? (
        <section className="rounded-card bg-surface p-card">
          <h2 className="text-heading">In lane</h2>
          <ul className="mt-sm flex flex-col gap-xs">
            {advice.lanePhase.map((tip) => (
              <li key={tip} className="text-caption text-text-muted">
                {tip}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
