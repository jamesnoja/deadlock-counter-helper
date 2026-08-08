/**
 * Token metadata.
 *
 * The values live in `globals.css` as custom properties — that is the styling
 * source of truth. This file mirrors them so two things can be automated:
 * the /styleguide swatches, and the contrast test. Both read from here, so a
 * token can never be documented at one value and shipped at another.
 *
 * `on` records the background a token is *intended* to sit on. The contrast
 * test asserts that pairing, which is what makes an accessibility regression a
 * failing build rather than a discovery in review.
 */

export interface ColorToken {
  name: string
  value: string
  description: string
  /** Background this is meant to be read against, if it carries text or meaning. */
  on?: string
  /** Minimum WCAG ratio. 4.5 for body text, 3 for large text and non-text UI. */
  min?: number
}

export const CANVAS_DARK = '#0e0e0f'
export const SURFACE_DARK = '#1c1c1e'
export const CANVAS_LIGHT = '#f7f5f2'
export const SURFACE_LIGHT = '#ffffff'

export const BRAND_TOKENS: ColorToken[] = [
  {
    name: '--brand',
    value: '#69e799',
    description: 'The single voltage. Primary actions, focus, hard counters.',
    on: CANVAS_DARK,
    min: 3,
  },
  {
    name: '--brand-deep',
    value: '#158048',
    description:
      'Light-mode brand fill. Dark enough to carry white text at 4.98:1 — the mint cannot, at 1.56:1.',
    on: SURFACE_LIGHT,
    min: 3,
  },
  {
    name: '--brand-press',
    value: '#146638',
    description: 'Pressed state of the light-mode fill.',
    on: SURFACE_LIGHT,
    min: 3,
  },
  {
    name: '--brand-soft',
    value: '#a5f0c4',
    description: 'Tag text on dark, subtle accents.',
    on: '#16301f',
    min: 4.5,
  },
  {
    name: '--brand-subdued',
    value: '#16301f',
    description: 'Muted fill behind soft tags on dark.',
  },
]

/** Header wash only. Never behind body text — see DESIGN.md. */
export const GRADIENT_TOKENS: ColorToken[] = [
  { name: '--hero-1', value: '#a5f0c4', description: 'Gradient start — pale mint.' },
  { name: '--hero-2', value: '#3fc9a3', description: 'Gradient middle — teal.' },
  { name: '--hero-3', value: '#127a5c', description: 'Gradient end — deep green.' },
]

export const SURFACE_TOKENS: ColorToken[] = [
  { name: '--canvas', value: CANVAS_DARK, description: 'Default background.' },
  { name: '--surface', value: SURFACE_DARK, description: 'Cards, rows.' },
  { name: '--surface-elevated', value: '#2a2a2c', description: 'Avatars, toggles, secondary buttons.' },
  { name: '--hairline', value: '#2e2e30', description: '1px dividers.' },
]

export const TEXT_TOKENS: ColorToken[] = [
  { name: '--text', value: '#eaeaea', description: 'Default body text.', on: CANVAS_DARK, min: 4.5 },
  {
    name: '--text-muted',
    value: '#9a9a9c',
    description: 'Captions, timestamps, helper text.',
    on: SURFACE_DARK,
    min: 4.5,
  },
  {
    name: '--on-brand',
    value: '#0d1f14',
    description: 'Text on the mint brand fill. Dark, because white on mint is 1.56:1.',
    on: '#69e799',
    min: 4.5,
  },
  {
    name: '--on-brand-deep',
    value: '#ffffff',
    description: 'Text on the light-mode deep brand fill.',
    on: '#158048',
    min: 4.5,
  },
]

/**
 * Domain semantics. Every one of these is paired with an icon, shape, or text
 * label in the primitives — colour alone never carries the meaning.
 */
export const SEMANTIC_TOKENS: ColorToken[] = [
  {
    name: '--counter-hard',
    value: '#69e799',
    description: 'Hard counter. Shares the brand voltage — the product’s core positive.',
    on: SURFACE_DARK,
    min: 3,
  },
  {
    name: '--counter-soft',
    value: '#8fb8a4',
    description: 'Soft counter. Deliberately desaturated so it reads as lesser.',
    on: SURFACE_DARK,
    min: 3,
  },
  {
    name: '--counter-situational',
    value: '#9a9a9c',
    description: 'Situational. Neutral — no claim of strength.',
    on: SURFACE_DARK,
    min: 3,
  },
  {
    name: '--threat-high',
    value: '#ff5252',
    description: 'Severe threat.',
    on: SURFACE_DARK,
    min: 3,
  },
  {
    name: '--threat-medium',
    value: '#ffb443',
    description: 'Moderate threat.',
    on: SURFACE_DARK,
    min: 3,
  },
  {
    name: '--threat-low',
    value: '#9a9a9c',
    description: 'Minor threat.',
    on: SURFACE_DARK,
    min: 3,
  },
  {
    name: '--provenance-verified',
    value: '#1f9d55',
    description:
      'Auto-verified this patch. Deep emerald, 2.24:1 from the brand mint so the two do not read as one colour.',
    on: SURFACE_DARK,
    min: 3,
  },
  {
    name: '--provenance-stale',
    value: '#ffb443',
    description: 'Patch touched this; curation not yet reviewed.',
    on: SURFACE_DARK,
    min: 3,
  },
]

/** Item categories. Tint plus icon plus label — never the tint alone. */
export const CATEGORY_TOKENS: ColorToken[] = [
  { name: '--category-weapon', value: '#f0a92e', description: 'Weapon items.', on: SURFACE_DARK, min: 3 },
  { name: '--category-vitality', value: '#4ac1a0', description: 'Vitality items.', on: SURFACE_DARK, min: 3 },
  { name: '--category-spirit', value: '#9b6bff', description: 'Spirit items.', on: SURFACE_DARK, min: 3 },
]

export const ALL_COLOR_TOKENS = [
  ...BRAND_TOKENS,
  ...GRADIENT_TOKENS,
  ...SURFACE_TOKENS,
  ...TEXT_TOKENS,
  ...SEMANTIC_TOKENS,
  ...CATEGORY_TOKENS,
]

export interface ScaleToken {
  name: string
  value: string
  description: string
}

export const TYPE_TOKENS: ScaleToken[] = [
  { name: '--text-hero', value: '3rem / 800', description: 'Coverage count — our balance number.' },
  { name: '--text-display', value: '2rem / 700', description: 'Page title.' },
  { name: '--text-heading', value: '1.25rem / 700', description: 'Section and card titles.' },
  { name: '--text-body', value: '0.9375rem / 500', description: 'Default UI body.' },
  { name: '--text-tabular', value: '0.9375rem / 600', description: 'Costs and counts, tnum.' },
  { name: '--text-caption', value: '0.8125rem / 600', description: 'Helper text, timestamps.' },
  { name: '--text-micro', value: '0.6875rem / 700', description: 'Eyebrow labels. Used sparingly.' },
]

export const RADIUS_TOKENS: ScaleToken[] = [
  { name: '--radius-sm', value: '8px', description: 'Tags, small chrome.' },
  { name: '--radius-md', value: '14px', description: 'Inputs, small controls.' },
  { name: '--radius-lg', value: '20px', description: 'Rows, list items.' },
  { name: '--radius-card', value: '24px', description: 'Cards.' },
  { name: '--radius-pill', value: '9999px', description: 'Buttons, chips, avatars.' },
]

export const SPACE_TOKENS: ScaleToken[] = [
  { name: '--space-xs', value: '4px', description: 'Hairline gaps.' },
  { name: '--space-sm', value: '8px', description: 'Tight grouping.' },
  { name: '--space-md', value: '12px', description: 'Related elements.' },
  { name: '--space-lg', value: '16px', description: 'Row padding, tight grouping.' },
  { name: '--space-xl', value: '24px', description: 'Card padding.' },
  { name: '--space-2xl', value: '32px', description: 'Section rhythm.' },
]
