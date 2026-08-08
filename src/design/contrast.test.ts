import { describe, expect, it } from 'vitest'
import { contrastRatio, relativeLuminance } from './contrast.ts'
import { ALL_COLOR_TOKENS, SEMANTIC_TOKENS } from './tokens.ts'

/**
 * E02's acceptance criterion: contrast checks run in CI, so a token change
 * cannot silently break legibility. Every token that declares an intended
 * background is asserted against it here.
 */

describe('contrastRatio', () => {
  it('matches the WCAG reference extremes', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1)
    expect(contrastRatio('#69e799', '#69e799')).toBeCloseTo(1, 5)
  })

  it('handles shorthand hex', () => {
    expect(relativeLuminance('#fff')).toBeCloseTo(relativeLuminance('#ffffff'), 5)
  })
})

describe('every token meets its stated minimum', () => {
  for (const token of ALL_COLOR_TOKENS) {
    if (!token.on) continue
    const min = token.min ?? 4.5
    it(`${token.name} on ${token.on} >= ${min}:1`, () => {
      const ratio = contrastRatio(token.value, token.on!)
      expect(
        Number(ratio.toFixed(2)),
        `${token.name} (${token.value}) on ${token.on} is ${ratio.toFixed(2)}:1`,
      ).toBeGreaterThanOrEqual(min)
    })
  }
})

describe('the two greens stay distinguishable', () => {
  /**
   * The brand mint and the provenance green are both green, and E07 puts them
   * near each other. If someone "harmonises" them later, this fails — which is
   * the point. `#2ecc71` from the source spec sits at 1.35:1 and would look
   * identical on a second monitor.
   */
  it('separates brand mint from provenance emerald by at least 2:1', () => {
    const brand = ALL_COLOR_TOKENS.find((t) => t.name === '--brand')!.value
    const verified = SEMANTIC_TOKENS.find((t) => t.name === '--provenance-verified')!.value
    expect(contrastRatio(brand, verified)).toBeGreaterThanOrEqual(2)
  })

  it('separates verified from stale, which sit side by side in the header', () => {
    const verified = SEMANTIC_TOKENS.find((t) => t.name === '--provenance-verified')!.value
    const stale = SEMANTIC_TOKENS.find((t) => t.name === '--provenance-stale')!.value
    expect(contrastRatio(verified, stale)).toBeGreaterThanOrEqual(1.5)
  })
})

describe('counter strength reads as a ladder', () => {
  /**
   * Hard should be the most prominent and situational the least. Colour is not
   * the only signal in the UI, but it must at least not contradict the others.
   */
  it('descends in luminance from hard to situational', () => {
    const value = (name: string) => SEMANTIC_TOKENS.find((t) => t.name === name)!.value
    const hard = relativeLuminance(value('--counter-hard'))
    const soft = relativeLuminance(value('--counter-soft'))
    const situational = relativeLuminance(value('--counter-situational'))
    expect(hard).toBeGreaterThan(soft)
    expect(soft).toBeGreaterThan(situational)
  })
})
