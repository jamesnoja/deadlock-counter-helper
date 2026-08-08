/**
 * The primitive set every later issue reuses.
 *
 * Two rules hold throughout, both from docs/DESIGN.md:
 *
 * 1. No raw colour, size, or spacing values — only token-backed utilities. The
 *    ESLint rule in eslint.config.mjs enforces this.
 * 2. Nothing encodes meaning in colour alone. Every state that uses colour also
 *    carries a glyph, a shape, or a word. This is why the threat tag has a
 *    severity glyph and the provenance dot has a distinct shape per state
 *    rather than just a hue swap.
 */

import type { ReactNode } from 'react'
import { GameImage } from './game-image.tsx'

export type CounterStrength = 'hard' | 'soft' | 'situational'
export type ThreatSeverity = 'high' | 'medium' | 'low'
export type ItemCategory = 'weapon' | 'vitality' | 'spirit'
export type ProvenanceState = 'verified' | 'stale'

/* ------------------------------------------------------------------ hero chip */

interface HeroChipProps {
  name: string
  /** Portrait URL from the snapshot. Falls back to initials when absent. */
  portrait?: string | null
  selected?: boolean
  disabled?: boolean
  /** Shown as visible text when disabled — never a bare greyed-out chip. */
  disabledReason?: string
  onToggle?: () => void
}

export function HeroChip({
  name,
  portrait,
  selected = false,
  disabled = false,
  disabledReason,
  onToggle,
}: HeroChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      title={disabled ? disabledReason : undefined}
      onClick={onToggle}
      className={[
        'group flex items-center gap-sm rounded-pill border-2 pr-md transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-60',
        selected
          ? 'border-brand bg-brand-subdued text-brand-soft'
          : 'border-hairline bg-surface text-text hover:border-brand',
      ].join(' ')}
    >
      <GameImage src={portrait} fallback={name} size={32} className="rounded-pill" />
      <span className="text-caption">{name}</span>
      {/* Selection is a checkmark as well as a colour, so it survives greyscale. */}
      <span aria-hidden className={selected ? 'text-brand' : 'invisible'}>
        ✓
      </span>
    </button>
  )
}

/* ------------------------------------------------------------------ threat tag */

const THREAT_GLYPH: Record<ThreatSeverity, string> = {
  high: '▲',
  medium: '◆',
  low: '▪',
}

const THREAT_CLASS: Record<ThreatSeverity, string> = {
  high: 'text-threat-high',
  medium: 'text-threat-medium',
  low: 'text-threat-low',
}

export function ThreatTag({ label, severity }: { label: string; severity: ThreatSeverity }) {
  return (
    <span className="inline-flex items-center gap-xs rounded-pill bg-surface-elevated px-md py-xs">
      {/* Shape differs per severity, so severity survives colour blindness. */}
      <span aria-hidden className={THREAT_CLASS[severity]}>
        {THREAT_GLYPH[severity]}
      </span>
      <span className="text-micro">{label}</span>
      <span className="sr-only">{severity} threat</span>
    </span>
  )
}

/* ------------------------------------------------------------- provenance dot */

export function ProvenanceDot({ state, label }: { state: ProvenanceState; label?: string }) {
  const verified = state === 'verified'
  return (
    <span className="inline-flex items-center gap-xs">
      <span
        aria-hidden
        className={[
          'inline-block size-2.5',
          // Circle for verified, diamond for stale — distinguishable without colour.
          verified ? 'rounded-pill bg-provenance-verified' : 'rotate-45 bg-provenance-stale',
        ].join(' ')}
      />
      <span className="text-caption text-text-muted">
        {label ?? (verified ? 'Verified this patch' : 'Needs review')}
      </span>
    </span>
  )
}

/* ----------------------------------------------------------- coverage badge */

/** Our balance-hero equivalent: the number that answers "is this worth buying". */
export function CoverageBadge({ answers, total }: { answers: number; total: number }) {
  return (
    <span className="inline-flex items-baseline gap-xs">
      <span className="text-hero text-brand">{answers}</span>
      <span className="text-caption text-text-muted">of {total}</span>
      <span className="sr-only">counters {answers} of {total} selected enemies</span>
    </span>
  )
}

/* ------------------------------------------------------------------ item card */

const CATEGORY_CLASS: Record<ItemCategory, string> = {
  weapon: 'text-category-weapon',
  vitality: 'text-category-vitality',
  spirit: 'text-category-spirit',
}

const CATEGORY_GLYPH: Record<ItemCategory, string> = {
  weapon: '◈',
  vitality: '❤',
  spirit: '✦',
}

const STRENGTH_CLASS: Record<CounterStrength, string> = {
  hard: 'text-counter-hard',
  soft: 'text-counter-soft',
  situational: 'text-counter-situational',
}

interface ItemCardProps {
  name: string
  cost: number
  tier: number
  category: ItemCategory
  strength: CounterStrength
  /** Why this item answers the threat. */
  reason?: string
  icon?: string | null
  provenance?: ProvenanceState
}

export function ItemCard({
  name,
  cost,
  tier,
  category,
  strength,
  reason,
  icon,
  provenance,
}: ItemCardProps) {
  return (
    <article className="flex flex-col gap-sm rounded-card bg-surface p-card shadow-1">
      <div className="flex items-start gap-md">
        <GameImage src={icon} fallback={name} size={40} className="shrink-0 rounded-pill" />
        <div className="min-w-0 flex-1">
          <h3 className="text-heading">{name}</h3>
          <p className="flex flex-wrap items-center gap-sm text-caption text-text-muted">
            <span className={CATEGORY_CLASS[category]}>
              <span aria-hidden>{CATEGORY_GLYPH[category]} </span>
              {category}
            </span>
            <span>Tier {tier}</span>
            <span className="text-tabular text-text">{cost.toLocaleString()}</span>
          </p>
        </div>
        {/* Strength is spelled out, not just tinted. shrink-0 so a long item
            name wraps rather than colliding with the label. */}
        <span className={`shrink-0 text-micro ${STRENGTH_CLASS[strength]}`}>{strength}</span>
      </div>
      {reason ? <p className="text-caption text-text-muted">{reason}</p> : null}
      {provenance ? <ProvenanceDot state={provenance} /> : null}
    </article>
  )
}

/* ---------------------------------------------------------------------- slot */

/** One of the six enemy slots. Empty slots read as empty, not as absence. */
export function Slot({ children, onClear }: { children?: ReactNode; onClear?: () => void }) {
  if (!children) {
    return (
      <div className="grid h-12 place-items-center rounded-lg border-2 border-dashed border-hairline text-caption text-text-muted">
        Empty
      </div>
    )
  }
  return (
    <div className="flex h-12 items-center justify-between gap-sm rounded-lg bg-surface px-md">
      {children}
      {onClear ? (
        <button type="button" onClick={onClear} className="text-caption text-text-muted hover:text-text">
          <span aria-hidden>×</span>
          <span className="sr-only">Clear slot</span>
        </button>
      ) : null}
    </div>
  )
}

/* ----------------------------------------------------------------- accordion */

export function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: ReactNode
  children: ReactNode
  defaultOpen?: boolean
}) {
  return (
    <details open={defaultOpen} className="group rounded-card bg-surface">
      <summary className="flex cursor-pointer items-center justify-between gap-md p-card text-heading marker:content-none">
        {title}
        <span aria-hidden className="text-text-muted transition-transform group-open:rotate-90">
          ›
        </span>
      </summary>
      <div className="flex flex-col gap-md px-card pb-card">{children}</div>
    </details>
  )
}

/* --------------------------------------------------------- empty & loading */

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-sm rounded-card border-2 border-dashed border-hairline p-2xl text-center">
      <p className="text-heading">{title}</p>
      {hint ? <p className="text-caption text-text-muted">{hint}</p> : null}
    </div>
  )
}

export function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="flex flex-col gap-sm rounded-card bg-surface p-card" aria-hidden>
      {Array.from({ length: lines }, (_, index) => (
        <div
          key={index}
          className="h-3 animate-pulse rounded-sm bg-surface-elevated"
          style={{ width: `${100 - index * 15}%` }}
        />
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ buttons */

export function Button({
  children,
  variant = 'primary',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }) {
  const styles = {
    primary: 'bg-brand text-on-brand hover:bg-brand-soft',
    secondary: 'bg-surface-elevated text-text hover:bg-hairline',
    ghost: 'bg-transparent text-brand hover:bg-brand-subdued',
  }[variant]
  return (
    <button
      type="button"
      {...rest}
      className={`rounded-pill px-xl py-md text-caption font-bold transition-colors ${styles}`}
    >
      {children}
    </button>
  )
}
