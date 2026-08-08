import { EmptyState } from '@/components/primitives.tsx'

/**
 * Placeholder, now wearing the design system. The real interface arrives with
 * the hero picker (E08) and team builder (E09).
 */
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-xl p-xl">
      <header className="hero-gradient rounded-card p-2xl">
        <h1 className="text-display text-on-brand">Deadlock Counter Helper</h1>
        <p className="text-on-brand">
          Pick the enemy team, see every item that answers their kit — with costs, tiers,
          slots, and the specific ability each item counters.
        </p>
      </header>

      <EmptyState
        title="Under construction"
        hint="The hero picker lands with E08. Until then, the design system is at /styleguide."
      />

      <p className="text-caption text-text-muted">
        Fan project. Deadlock is the property of Valve Corporation. Roadmap in{' '}
        <a
          className="text-brand underline"
          href="https://github.com/jamesnoja/deadlock-counter-helper/blob/main/docs/BACKLOG.md"
        >
          docs/BACKLOG.md
        </a>
        .
      </p>
    </main>
  )
}
