import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { correlateRetunes, patchBySlug, patchSlugs } from '@/data/patch-archive.ts'
import { CHANGES } from '@/data/provenance.ts'
import { absolute } from '@/data/site.ts'
import type { Hero } from '@/data/schema.ts'
import { abilityByClassName, heroByClassName } from '@/data/snapshot.ts'

/**
 * One patch — E24 step 3.
 *
 * Order matters here. What we measured comes first, then Valve's own notes,
 * then the heroes affected. The measurement is ours and verifiable; the notes
 * are theirs and are the reason the change happened. Putting the notes first
 * would make this a Steam mirror, which it is not meant to be.
 */

export function generateStaticParams() {
  return patchSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const patch = patchBySlug(slug)
  if (!patch) return {}

  const canonical = absolute(`/changelog/${patch.slug}`)
  const changes = patch.blocks.filter((block) => block.kind === 'note').length

  return {
    title: `${patch.title} — Deadlock patch notes`,
    description:
      changes > 0
        ? `${changes} changes in ${patch.title}, with the game-data differences we measured alongside them.`
        : `${patch.title}, with the game-data differences we measured alongside it.`,
    alternates: { canonical },
    openGraph: { title: patch.title, url: canonical, type: 'article' },
  }
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export default async function PatchPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const patch = patchBySlug(slug)
  if (!patch) notFound()

  // Only the retunes this patch explains. The diff describes one sync, so most
  // patches have none — that is expected, not an error.
  const correlation = correlateRetunes(CHANGES.abilities.retuned)
  const measured = correlation.retunes.filter(
    (retune) => retune.explanation?.patch_gid === patch.gid,
  )

  /** Heroes named by the retunes, so the page links back into the tool. */
  const affected = [
    ...new Map(
      measured
        .map((retune) => heroForAbility(retune.class_name))
        .filter((hero): hero is Hero => hero !== null)
        .map((hero) => [hero.slug, hero] as const),
    ).values(),
  ]

  return (
    <main className="mx-auto flex w-[95%] flex-1 flex-col gap-xl p-xl">
      <nav className="text-caption text-text-muted">
        <Link className="text-brand underline" href="/">
          Counter helper
        </Link>{' '}
        /{' '}
        <Link className="text-brand underline" href="/changelog">
          Changelog
        </Link>{' '}
        / {patch.title}
      </nav>

      <header className="flex flex-col gap-sm rounded-card bg-surface p-2xl">
        <h1 className="text-display">{patch.title}</h1>
        <p className="text-caption text-text-muted">{formatDate(patch.published_at)}</p>
      </header>

      {measured.length > 0 ? (
        <section className="flex flex-col gap-md rounded-card bg-surface p-card">
          <h2 className="text-heading">What we measured</h2>
          <p className="max-w-prose text-caption text-text-muted">
            Differences found by comparing game-data snapshots, matched to the notes below.
          </p>
          <ul className="flex flex-col gap-sm">
            {measured.map((retune) => (
              <li key={`${retune.class_name}-${retune.stat}`} className="text-caption">
                <span className="text-text">{retune.name}</span>
                <span className="text-text-muted">
                  {' '}
                  — {retune.stat}: {retune.from} → {retune.to}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="flex flex-col gap-md">
        <h2 className="text-heading">Patch notes</h2>

        {patch.blocks.length === 0 ? (
          <p className="text-caption text-text-muted">
            Valve published this update without itemised notes.
          </p>
        ) : (
          <div className="flex flex-col gap-sm rounded-card bg-surface p-card">
            {patch.blocks.map((block, index) =>
              block.kind === 'section' ? (
                <h3 key={index} className="mt-md text-heading first:mt-0">
                  {block.text}
                </h3>
              ) : block.kind === 'note' ? (
                <p key={index} className="text-caption text-text-muted">
                  {block.text}
                </p>
              ) : (
                <p key={index} className="max-w-prose text-caption">
                  {block.text}
                </p>
              ),
            )}
          </div>
        )}
      </section>

      {affected.length > 0 ? (
        <section className="flex flex-col gap-md">
          <h2 className="text-heading">Heroes affected</h2>
          <ul className="flex flex-wrap gap-sm">
            {affected.map((hero) => (
              <li key={hero.slug}>
                <Link
                  className="rounded-pill bg-surface px-lg py-sm text-caption text-brand underline"
                  href={`/counter/${hero.slug}`}
                >
                  How to counter {hero.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <footer className="flex flex-col gap-sm text-micro text-text-muted">
        <p>
          Notes are Valve&rsquo;s, republished from{' '}
          <a className="text-brand underline" href={patch.url} rel="noreferrer" target="_blank">
            the official Steam announcement
          </a>
          {patch.forum_url ? (
            <>
              {' '}
              (also on{' '}
              <a
                className="text-brand underline"
                href={patch.forum_url}
                rel="noreferrer"
                target="_blank"
              >
                the Deadlock forums
              </a>
              )
            </>
          ) : null}
          .
        </p>
      </footer>
    </main>
  )
}

/**
 * The hero an ability belongs to.
 *
 * Ability class names do not reliably encode their hero — `citadel_ability_card_toss`
 * is Wraith's and says so nowhere — so this resolves through the snapshot rather
 * than parsing the string.
 */
function heroForAbility(abilityClassName: string): Hero | null {
  const ability = abilityByClassName(abilityClassName)
  if (!ability) return null
  return heroByClassName(ability.hero) ?? null
}
