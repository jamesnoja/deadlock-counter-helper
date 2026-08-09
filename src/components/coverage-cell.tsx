/**
 * One cell of the coverage matrix.
 *
 * Four states, and colour is never the only signal — each carries its own
 * glyph, so the matrix survives greyscale and colour vision deficiency. That is
 * the design profile's second principle, and it matters more here than
 * anywhere else in the product: this grid is almost entirely small coloured
 * marks.
 */

import { GameImage } from './game-image.tsx'
import type { PairStrength } from '@/data/sourced.ts'

export const STRENGTH_GLYPH: Record<PairStrength, string> = {
  strong: '●',
  moderate: '◐',
  situational: '○',
  none: '·',
}

export const STRENGTH_LABEL: Record<PairStrength, string> = {
  strong: 'Strong',
  moderate: 'Moderate',
  situational: 'Situational',
  none: 'Not addressed',
}

const STRENGTH_CLASS: Record<PairStrength, string> = {
  strong: 'text-counter-hard',
  moderate: 'text-counter-soft',
  situational: 'text-counter-situational',
  none: 'text-text-muted',
}

interface CoverageCellProps {
  strength: PairStrength
  heroName: string
  portrait: string | null
  itemName: string
  onSelect?: () => void
}

export function CoverageCell({
  strength,
  heroName,
  portrait,
  itemName,
  onSelect,
}: CoverageCellProps) {
  const addressed = strength !== 'none'
  const content = (
    <>
      <span
        className={[
          'grid place-items-center overflow-hidden rounded-pill border-2',
          addressed ? 'border-current' : 'border-transparent opacity-40 grayscale',
          STRENGTH_CLASS[strength],
        ].join(' ')}
      >
        <GameImage src={portrait} fallback={heroName} size={24} className="rounded-pill" />
      </span>
      <span aria-hidden className={`text-micro leading-none ${STRENGTH_CLASS[strength]}`}>
        {STRENGTH_GLYPH[strength]}
      </span>
      <span className="sr-only">
        {itemName} versus {heroName}: {STRENGTH_LABEL[strength]}
      </span>
    </>
  )

  const className = 'flex flex-col items-center gap-px'

  // Only addressed cells lead anywhere — a button that does nothing is worse
  // than plain text for anyone tabbing through.
  if (!onSelect || !addressed) {
    return (
      <span className={className} title={`${heroName}: ${STRENGTH_LABEL[strength]}`}>
        {content}
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      title={`${heroName}: ${STRENGTH_LABEL[strength]} — open ${heroName}`}
      className={`${className} rounded-sm hover:opacity-80`}
    >
      {content}
    </button>
  )
}

/** Four states is one more than anyone will guess. */
export function CoverageLegend() {
  return (
    <ul className="flex flex-wrap items-center gap-md">
      {(['strong', 'moderate', 'situational', 'none'] as const).map((strength) => (
        <li key={strength} className="flex items-center gap-xs">
          <span aria-hidden className={`text-micro ${STRENGTH_CLASS[strength]}`}>
            {STRENGTH_GLYPH[strength]}
          </span>
          <span className="text-caption text-text-muted">{STRENGTH_LABEL[strength]}</span>
        </li>
      ))}
    </ul>
  )
}
