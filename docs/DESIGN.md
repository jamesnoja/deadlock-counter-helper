# Design profile

The written direction. Tokens live in `src/app/globals.css`; `src/design/tokens.ts` mirrors
them so the styleguide and the contrast test read one source. Every primitive is rendered at
[`/styleguide`](/styleguide) in both themes and both densities.

## Positioning

Adapted from an "Up Inspired" design system — a warm, high-energy neobank language built on a
deep charcoal canvas, a single confident brand voltage, heavy rounded type, and extreme
corner rounding. The brand voltage here is **mint `#69e799`** rather than the source's coral.

We sit **adjacent to Deadlock, not inside it**. The game's own art direction is dieselpunk
occult noir; cloning it would imply official status we do not have, and Valve's assets are
not ours to restyle. What we take from the game is its darkness and its density. What we take
from the source spec is confidence: bold type, generous rounding, one loud colour, no timid
greys.

The result should read as a well-made tool by someone who plays the game — not as a fan site,
and not as a Valve product.

## Usage context

This is the design brief, and it settles most arguments on its own:

- **Glanced at for three seconds, mid-match.** Often on a second monitor, often while
  something is happening in the game. Time-to-answer is the only metric that matters.
- **In a dark room.** Dark is the default surface, not a theme variant. Light mode is
  supported and documented, but it is the secondary case.
- **At arm's length.** Type does not go below 13px. Touch targets clear 44px.
- **A reference tool, not a landing page.** Information density earns its keep. That said,
  density without hierarchy is just noise — see the principles.

## Principles

Written so each can settle a real argument.

### 1. Scannable beats beautiful

If a layout is prettier but slower to read, it loses. The test is whether someone can find
the item they need without reading prose. This is why coverage counts are oversized numerals
and why item cards lead with name, category, and cost rather than explanation.

### 2. Never encode meaning in colour alone

Every state that uses colour also carries a shape, a glyph, or a word. Threat severity has a
distinct glyph per level (`▲ ◆ ▪`). The provenance dot is a **circle when verified and a
rotated square when stale** — not the same dot in two hues. Counter strength is spelled out
in text next to its tint.

This is not only an accessibility checkbox. Roughly one in twelve men has some form of colour
vision deficiency, and this tool's audience skews heavily that way.

### 3. Density with hierarchy

Pack information in, but make one thing per block obviously the most important. Comfortable
spacing is the default; the compact density switch tightens spacing only — never type size
or colour — so nothing changes meaning when it engages.

### 4. Show provenance, always

Given how often the game patches, "when was this last verified" is the most important thing
on the page. The header stamp is not chrome; it is a feature. Anything a patch touched shows
as needing review until a human confirms it.

### 5. Bold is the brand

Display type runs 700–800 and body sits at 500, not 400. Dropping weight makes the whole
thing timid, which is the one thing the source language is not. The eyebrow tier is the only
uppercase in the system — the original site set everything in caps, which is measurably
harder to scan, and we do not.

## Colour

Dark canvas, one voltage, semantic names throughout. **No component may reference a raw hex**
— an ESLint rule rejects hex values, `px` literals, and Tailwind arbitrary values in
`src/app` and `src/components`.

### The two greens

The brand mint and the "verified" green are both green, sit near each other in the header,
and had to be told apart at a glance:

| Token | Value | Role | Separation |
| --- | --- | --- | --- |
| `--brand` | `#69e799` | Voltage: primary actions, focus, hard counters | — |
| `--provenance-verified` | `#1f9d55` | Data auto-verified this patch | **2.24:1** from the brand |

The obvious candidate — `#2ecc71`, the source spec's `money-in` — was rejected at **1.35:1**
from the brand mint. On a second monitor at arm's length that is the same colour. A test in
`src/design/contrast.test.ts` fails if anyone later "harmonises" the two.

Both are always paired with a shape and a label, per principle 2.

### Text on the brand

`--on-brand` is near-black `#0d1f14`, not white. White on `#69e799` measures **1.56:1**,
which is unreadable. Worth recording that the source spec's own `on-primary: #ffffff` was
already failing at **2.55:1** on its coral — we did not inherit a working pairing and break
it, we fixed one that never worked.

For light mode, `--brand-deep` `#158048` is dark enough to carry white text at 4.98:1.

### Gradient

Re-derived around the green: pale mint → teal → deep green. Header wash only. Never behind
body text, never as a body fill.

### Semantic sets

- **Counter strength** — `hard` (brand mint), `soft` (desaturated), `situational` (neutral
  grey). Descending luminance, asserted by test, so the ladder never inverts.
- **Threat severity** — `high` red, `medium` amber, `low` grey, each with its own glyph.
- **Provenance** — `verified` emerald circle, `stale` amber diamond.
- **Item category** — weapon amber, vitality teal, spirit violet, each with a glyph and the
  category word. Tint is a border or icon colour, never a filled block, so category never
  competes with strength for attention.

## Type

Plus Jakarta Sans, the open-source analogue named in the source spec. Weights 500 / 600 /
700 / 800 only — no thin weights.

| Tier | Size | Weight | Use |
| --- | --- | --- | --- |
| `text-hero` | 3rem | 800 | Coverage count — our equivalent of the spec's balance number |
| `text-display` | 2rem | 700 | Page title |
| `text-heading` | 1.25rem | 700 | Card and section titles |
| body | 0.9375rem | 500 | Default |
| `text-tabular` | 0.9375rem | 600 | Costs and counts, `tnum` |
| `text-caption` | 0.8125rem | 600 | Helper text |
| `text-micro` | 0.6875rem | 700 | Eyebrow labels, the only uppercase |

**All numerics use tabular figures.** Costs, tiers, and coverage counts sit in columns; digits
must not shift width between rows.

## Shape, depth, motion

Everything is soft — 8px on tags up to 24px on cards, full pills on buttons and chips, circles
on avatars. A square corner reads as third-party.

Depth comes from layered charcoal (`--canvas` → `--surface` → `--surface-elevated`) plus soft
black shadows, not hairlines.

Motion is 120ms/200ms on a single easing curve, and `prefers-reduced-motion` is honoured
globally in `globals.css` rather than per-component.

Focus is defined once as `--focus-ring` and applied via `:focus-visible`. No component styles
its own focus state.

## Divergences from the source spec

Recorded so the difference reads as a decision rather than a mistake.

| Source spec | Here | Why |
| --- | --- | --- |
| Coral `#ff7a64` primary | Mint `#69e799` | Requested. |
| `on-primary: #ffffff` | Dark ink `#0d1f14` | 1.56:1 on mint. The original was already failing at 2.55:1. |
| Sunset gradient gold→coral→pink | Mint→teal→deep green | The gradient was derived from the coral primary; a warm wash beside a green voltage is unrelated to the brand. |
| `money-in` / `money-out` | Counter strength, threat severity | No money here. |
| `balance-hero`, 64px balance | Coverage count | "Answers 5 of 6" is our hero number. |
| `transaction-row` | Item card | Same role: the dense repeated primitive. |
| Emoji as a typed primitive | Real game artwork in the same circular slot | We have hero portraits and item icons from the assets API (E12). Emoji would be a downgrade. |
| Swappable Saver accents | Item category accents | Same mechanic, different domain. |
| `up.` wordmark | None | We are not a brand, and must not imply one. |
| Airy spacing, single ~420px column | Comfortable default, compact switch, multi-column | The source is an app-first bank; this is a dense reference tool. Comfortable stays the default, compact is opt-in and feeds E27. |

## Rules

**Do**

- Default every surface to `--canvas` and lean dark.
- Use the brand voltage confidently — it is loud by design, not scarce.
- Pair every colour-carried meaning with a glyph, shape, or word.
- Use tabular figures for every cost, tier, and count.
- Reach for an existing primitive before writing a new component.

**Don't**

- Don't introduce a raw hex, `px`, or arbitrary Tailwind value. The lint rule will reject it,
  and the rule is right.
- Don't drop display weight to 400.
- Don't put the gradient behind text.
- Don't square a corner.
- Don't add a second brand colour. There is one voltage.
- Don't distinguish two states by hue alone — especially not two greens.
