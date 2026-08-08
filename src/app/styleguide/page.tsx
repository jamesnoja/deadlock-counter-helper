import type { Metadata } from 'next'
import { contrastRatio } from '@/design/contrast.ts'
import {
  ALL_COLOR_TOKENS,
  RADIUS_TOKENS,
  SPACE_TOKENS,
  TYPE_TOKENS,
  type ColorToken,
} from '@/design/tokens.ts'
import {
  Accordion,
  Button,
  CoverageBadge,
  EmptyState,
  HeroChip,
  ItemCard,
  ProvenanceDot,
  Skeleton,
  Slot,
  ThreatTag,
} from '@/components/primitives.tsx'

export const metadata: Metadata = {
  title: 'Styleguide — Deadlock Counter Helper',
  robots: { index: false, follow: false },
}

function Swatch({ token }: { token: ColorToken }) {
  const ratio = token.on ? contrastRatio(token.value, token.on) : null
  const passes = ratio !== null && ratio >= (token.min ?? 4.5)
  return (
    <div className="flex items-start gap-md rounded-lg bg-surface p-md">
      <span
        className="size-10 shrink-0 rounded-md border border-hairline"
        style={{ background: token.value }}
      />
      <div className="min-w-0">
        <p className="text-tabular">{token.name}</p>
        <p className="text-caption text-text-muted">{token.description}</p>
        <p className="text-caption text-text-muted">
          <code>{token.value}</code>
          {ratio !== null ? (
            <>
              {' · '}
              {ratio.toFixed(2)}:1 on {token.on}{' '}
              <span className={passes ? 'text-counter-hard' : 'text-threat-high'}>
                {passes ? '✓ AA' : '✕ fails'}
              </span>
            </>
          ) : null}
        </p>
      </div>
    </div>
  )
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-md">
      <div>
        <h2 className="text-display">{title}</h2>
        {note ? <p className="text-caption text-text-muted">{note}</p> : null}
      </div>
      {children}
    </section>
  )
}

/** Every primitive, rendered once. Used in both themes and both densities below. */
function PrimitiveGallery() {
  return (
    <div className="flex flex-col gap-lg">
      <div className="flex flex-wrap gap-sm">
        <HeroChip name="Abrams" selected />
        <HeroChip name="Haze" />
        <HeroChip name="Bebop" disabled disabledReason="Team is full — clear a slot first" />
      </div>

      <div className="flex flex-wrap gap-sm">
        <ThreatTag label="hard cc" severity="high" />
        <ThreatTag label="sustain" severity="medium" />
        <ThreatTag label="stealth" severity="low" />
      </div>

      <div className="flex flex-wrap items-center gap-lg">
        <ProvenanceDot state="verified" />
        <ProvenanceDot state="stale" />
        <CoverageBadge answers={5} total={6} />
      </div>

      <div className="grid gap-md sm:grid-cols-2">
        <ItemCard
          name="Metal Skin"
          cost={3200}
          tier={3}
          category="vitality"
          strength="hard"
          reason="Bullet immunity answers Bullet Dance during the channel."
          provenance="verified"
        />
        <ItemCard
          name="Healbane"
          cost={1750}
          tier={2}
          category="weapon"
          strength="soft"
          reason="Cuts sustain, but only while you keep landing shots."
          provenance="stale"
        />
      </div>

      <div className="grid grid-cols-3 gap-sm">
        <Slot>
          <span className="text-caption">Abrams</span>
        </Slot>
        <Slot />
        <Slot />
      </div>

      <Accordion title="Abrams — matchup detail" defaultOpen>
        <p className="text-caption text-text-muted">
          Detail accumulates as heroes are added; nothing is replaced.
        </p>
      </Accordion>

      <div className="grid gap-md sm:grid-cols-2">
        <EmptyState title="No enemies selected" hint="Pick a hero to see counters." />
        <Skeleton />
      </div>

      <div className="flex flex-wrap gap-sm">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
      </div>
    </div>
  )
}

/** One themed, density-scoped panel. E02 wants every primitive in all four combinations. */
function Panel({ theme, density }: { theme: 'dark' | 'light'; density: 'comfortable' | 'compact' }) {
  return (
    <div
      data-theme={theme}
      data-density={density === 'compact' ? 'compact' : undefined}
      className="rounded-card bg-canvas p-card text-text"
    >
      <p className="text-micro text-text-muted">
        {theme} · {density}
      </p>
      <div className="mt-md">
        <PrimitiveGallery />
      </div>
    </div>
  )
}

export default function Styleguide() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-2xl p-xl">
      <header className="hero-gradient rounded-card p-2xl">
        <h1 className="text-display text-on-brand">Styleguide</h1>
        <p className="text-caption text-on-brand">
          Every token and primitive, in both themes and both densities. Contrast ratios are
          computed live — a failing pair shows here and fails CI.
        </p>
      </header>

      <Section
        title="Colour"
        note="Semantic names only. No component may reference a raw hex; the lint rule rejects it."
      >
        <div className="grid gap-sm sm:grid-cols-2">
          {ALL_COLOR_TOKENS.map((token) => (
            <Swatch key={token.name} token={token} />
          ))}
        </div>
      </Section>

      <Section title="Type" note="Bold is the brand. Body sits at 500, display at 700–800.">
        <div className="flex flex-col gap-sm rounded-card bg-surface p-card">
          {TYPE_TOKENS.map((token) => (
            <div key={token.name} className="flex flex-wrap items-baseline justify-between gap-md">
              <span className="text-tabular">{token.name}</span>
              <span className="text-caption text-text-muted">
                {token.value} — {token.description}
              </span>
            </div>
          ))}
          <p className="text-hero">1,234</p>
          <p className="text-display">Display</p>
          <p className="text-heading">Heading</p>
          <p>Body copy sits at 500 so it reads warmer than a default 400.</p>
          <p className="text-caption text-text-muted">Caption</p>
          <p className="text-micro text-text-muted">Eyebrow label</p>
        </div>
      </Section>

      <Section title="Radius and spacing">
        <div className="grid gap-sm sm:grid-cols-2">
          <div className="flex flex-col gap-sm rounded-card bg-surface p-card">
            {RADIUS_TOKENS.map((token) => (
              <div key={token.name} className="flex items-center gap-md">
                <span
                  className="size-10 bg-surface-elevated"
                  style={{ borderRadius: `var(${token.name})` }}
                />
                <span className="text-caption text-text-muted">
                  {token.name} — {token.value}, {token.description}
                </span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-sm rounded-card bg-surface p-card">
            {SPACE_TOKENS.map((token) => (
              <div key={token.name} className="flex items-center gap-md">
                <span
                  className="h-3 bg-brand-subdued"
                  style={{ width: `var(${token.name})`, minWidth: `var(${token.name})` }}
                />
                <span className="text-caption text-text-muted">
                  {token.name} — {token.value}, {token.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section
        title="Primitives"
        note="Rendered four times: dark and light, comfortable and compact."
      >
        <div className="grid gap-lg lg:grid-cols-2">
          <Panel theme="dark" density="comfortable" />
          <Panel theme="light" density="comfortable" />
          <Panel theme="dark" density="compact" />
          <Panel theme="light" density="compact" />
        </div>
      </Section>
    </main>
  )
}
