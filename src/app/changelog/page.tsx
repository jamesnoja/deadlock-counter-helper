import type { Metadata } from 'next'
import Link from 'next/link'

import { LATEST_PATCH, PATCH_SUMMARIES, correlateRetunes } from '@/data/patch-archive.ts'
import { CHANGES } from '@/data/provenance.ts'
import { absolute } from '@/data/site.ts'

/**
 * Patch changelog — E24 step 3.
 *
 * Two sources, deliberately paired. The snapshot diff is the reliable signal
 * that something moved; Valve's notes are the narrative when one exists. They
 * disagree often enough that showing only one would mislead — the 2026-09-08
 * sync detected a Card Trick sign flip no published note mentions.
 *
 * Server component, no interactivity, no client bundle. Same reasoning as the
 * per-hero pages.
 */

export const metadata: Metadata = {
  title: 'Deadlock patch changelog — what changed, and what Valve said about it',
  description:
    'Every Deadlock update, pairing the measured game-data changes with the official patch notes — including the changes that shipped with no notes at all.',
  alternates: {
    canonical: absolute('/changelog'),
    types: { 'application/rss+xml': absolute('/changelog/feed.xml') },
  },
  openGraph: {
    title: 'Deadlock patch changelog',
    description: 'Measured game-data changes paired with Valve’s official patch notes.',
    url: absolute('/changelog'),
    type: 'website',
  },
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export default function Changelog() {
  const correlation = correlateRetunes(CHANGES.abilities.retuned)

  return (
    <main className="mx-auto flex w-[95%] flex-1 flex-col gap-xl p-xl">
      <nav className="text-caption text-text-muted">
        <Link className="text-brand underline" href="/">
          Counter helper
        </Link>{' '}
        / Changelog
      </nav>

      <header className="flex flex-col gap-md rounded-card bg-surface p-2xl">
        <h1 className="text-display">Deadlock patch changelog</h1>
        <p className="max-w-prose text-caption text-text-muted">
          Every update, pairing what we measured in the game data against what Valve published.
          The two do not always agree, and the gap is the interesting part.
        </p>
      </header>

      {/*
        The unexplained count leads. A documented retune is routine; one that
        shipped with no note is what a player needs to know about, because the
        counter advice keyed to it may now be wrong.
      */}
      {correlation.unexplained > 0 ? (
        <section className="flex flex-col gap-md rounded-card border border-threat-medium/40 bg-surface p-card">
          <h2 className="text-heading">
            {correlation.unexplained} recent change
            {correlation.unexplained === 1 ? '' : 's'} with no published note
          </h2>
          <p className="max-w-prose text-caption text-text-muted">
            Detected in the game data on {formatDate(CHANGES.detected_at)}. Valve ships balance
            changes without always posting notes, so these were found by comparing snapshots
            rather than by reading an announcement.
          </p>
          <ul className="flex flex-col gap-sm">
            {correlation.retunes
              .filter((retune) => retune.explanation === null)
              .map((retune) => (
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

        {PATCH_SUMMARIES.length === 0 ? (
          <p className="text-caption text-text-muted">
            No patch notes archived yet.
          </p>
        ) : (
          <ol className="flex flex-col gap-sm">
            {PATCH_SUMMARIES.map((patch) => (
              <li key={patch.gid}>
                <Link
                  className="flex flex-wrap items-baseline gap-md rounded-card bg-surface p-card hover:bg-surface-elevated"
                  href={`/changelog/${patch.slug}`}
                >
                  <span className="text-heading">{patch.title}</span>
                  <span className="text-micro text-text-muted">
                    {formatDate(patch.published_at)}
                  </span>
                  <span className="ml-auto text-micro text-text-muted">
                    {patch.note_count === 0
                      ? 'no itemised changes'
                      : `${patch.note_count} change${patch.note_count === 1 ? '' : 's'}`}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}

        {/*
          Say what is missing rather than implying the list is complete. Steam
          serves a fixed window and the archive only goes back as far as the
          first sync that saw them.
        */}
        {LATEST_PATCH ? (
          <p className="text-micro text-text-muted">
            {PATCH_SUMMARIES.length} updates archived, back to{' '}
            {formatDate(PATCH_SUMMARIES[PATCH_SUMMARIES.length - 1]!.published_at)}. Earlier posts
            have fallen off Valve&rsquo;s feed and are not recoverable. Notes are Valve&rsquo;s,
            republished from{' '}
            <a
              className="text-brand underline"
              href="https://store.steampowered.com/news/app/1422450"
              rel="noreferrer"
              target="_blank"
            >
              the official Steam announcements
            </a>
            .
          </p>
        ) : null}
      </section>
    </main>
  )
}
