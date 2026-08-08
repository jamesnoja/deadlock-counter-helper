import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { GameImage } from '@/components/game-image.tsx'
import { CategoryTag } from '@/components/item-meta.tsx'
import { ProvenanceStamp } from '@/components/provenance-stamp.tsx'
import { countersForTeam } from '@/data/counters.ts'
import { explainPair } from '@/data/explain.ts'
import { countersForItem, threatsForAbility } from '@/data/overlay.ts'
import { absolute } from '@/data/site.ts'
import { abilitiesForHero, displayStats, HEROES, heroBySlug, itemArtwork } from '@/data/snapshot.ts'
import { THREAT_TAG_LABELS } from '@/data/tags.ts'

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
  const counters = countersForTeam([hero.class_name])

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
            {hero.role} · {counters.length} items answer something in this kit
          </p>
        </div>
      </header>

      <ProvenanceStamp />

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
                <span className="block text-micro text-text-muted">{counter.why}</span>
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

      {/*
        The ability-by-ability breakdown. The original site said "counter Haze"
        and buried the specifics in prose; this attaches each answer to the
        named ability it addresses, with the live numbers from the snapshot.
      */}
      <section className="flex flex-col gap-md">
        <h2 className="text-heading">{hero.name}&rsquo;s abilities, and what stops each one</h2>

        {abilities.map((ability) => {
          const entry = threatsForAbility(ability.class_name)
          const tags = entry?.tags ?? []
          const answers = counters.filter((counter) =>
            counter.perHero.some(
              (effect) =>
                effect.abilities.includes(ability.class_name) &&
                effect.tags.some((tag) => tags.includes(tag)),
            ),
          )
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

              {tags.length > 0 ? (
                <p className="flex flex-wrap items-center gap-xs">
                  <span className="text-micro text-text-muted">Threatens:</span>
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-pill bg-surface-elevated px-sm py-px text-micro text-threat-medium"
                    >
                      {THREAT_TAG_LABELS[tag]}
                    </span>
                  ))}
                </p>
              ) : null}

              <div className="flex flex-col gap-xs">
                <h4 className="text-micro text-text-muted">What answers it</h4>
                {answers.length === 0 ? (
                  <p className="text-caption text-text-muted">
                    {tags.length === 0
                      ? 'This ability has no threat tagged yet, so nothing is recommended against it.'
                      : 'Nothing currently recommended answers this specific ability.'}
                  </p>
                ) : (
                  <ul className="flex flex-col gap-xs">
                    {/* Capped so a four-ability page is readable. The count
                        below says what is not shown — a silent truncation would
                        read as "that is everything". */}
                    {answers.slice(0, 8).map((counter) => {
                      const effect = counter.perHero.find(
                        (candidate) => candidate.hero === hero.class_name,
                      )
                      const explanation = effect
                        ? explainPair(
                            { ...effect, abilities: [ability.class_name] },
                            hero.name,
                            () => ability.name,
                            countersForItem(counter.item.class_name),
                          )
                        : null
                      return (
                        <li
                          key={counter.item.class_name}
                          className="flex items-center gap-sm rounded-md bg-surface-elevated p-sm"
                        >
                          <GameImage
                            src={itemArtwork(counter.item)}
                            fallback={counter.item.name}
                            size={28}
                            className="shrink-0 rounded-sm"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-caption">{counter.item.name}</span>
                            {explanation ? (
                              <span className="block text-micro text-text-muted">
                                {explanation.text}
                              </span>
                            ) : null}
                          </span>
                          <span className="shrink-0 text-tabular text-micro text-text-muted">
                            {counter.item.cost.toLocaleString()}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                )}
                {answers.length > 8 ? (
                  <p className="text-micro text-text-muted">
                    Showing the 8 strongest of {answers.length} that answer this ability.
                  </p>
                ) : null}
              </div>
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

      <p className="text-caption text-text-muted">
        Fan project. Deadlock is the property of Valve Corporation.
      </p>
    </main>
  )
}
