<!-- GENERATED FILE — edit scripts/enhancements.mjs and run `npm run backlog` -->

# Enhancement backlog

32 enhancements across 5 epics — **4 done**, 0 in progress, 28 to go.
Each becomes one GitHub issue via `npm run seed:issues`.

## Index

| | ID | Enhancement | Epic | Priority | Depends on |
| --- | --- | --- | --- | --- | --- |
| [x] | [E01](#e01) | Project scaffold, CI, and deploy pipeline | foundation | p0 | — |
| [x] | [E02](#e02) | Design profile — visual identity and design system foundation | foundation | p0 | E01 |
| [x] | [E03](#e03) | Deadlock assets API sync pipeline | foundation | p0 | E01 |
| [x] | [E04](#e04) | Threat-tag overlay schema (abilities and items) | foundation | p0 | E03 |
| [ ] | [E05](#e05) | Counter derivation engine | foundation | p0 | E04 |
| [ ] | [E06](#e06) | CI patch-diff detection and needs-review flagging | foundation | p0 | E03, E04 |
| [ ] | [E07](#e07) | Patch version stamp and data provenance UI | foundation | p0 | E06, E02 |
| [ ] | [E08](#e08) | Accessible hero picker with portraits and keyboard navigation | ux | p0 | E03, E02 |
| [ ] | [E09](#e09) | Enemy team builder (6 slots) | ux | p0 | E08, E05 |
| [ ] | [E10](#e10) | Aggregated counter shortlist with coverage counts | ux | p0 | E09 |
| [ ] | [E11](#e11) | Retain per-hero detail in team mode | ux | p0 | E10 |
| [ ] | [E12](#e12) | Item and hero artwork integration | ux | p0 | E03, E02 |
| [ ] | [E13](#e13) | Show item cost, tier, and slot category | ux | p0 | E03, E02 |
| [ ] | [E14](#e14) | Soul budget filter | ux | p1 | E13 |
| [ ] | [E15](#e15) | Slot economy view — present counters as a build, not a wishlist | ux | p1 | E13 |
| [ ] | [E16](#e16) | Game-phase tabs (lane / mid / late) | ux | p1 | E05 |
| [ ] | [E17](#e17) | Ability-level counter granularity | ux | p1 | E05, E12 |
| [ ] | [E18](#e18) | "Your hero" context filter | ux | p1 | E05 |
| [ ] | [E19](#e19) | Copy-to-clipboard team chat export | ux | p1 | E10 |
| [ ] | [E20](#e20) | URL state and deep links | distribution | p0 | E09 |
| [ ] | [E21](#e21) | Per-hero static SEO pages | distribution | p0 | E20, E11 |
| [ ] | [E22](#e22) | OG image generation for shared comps | distribution | p1 | E20, E12 |
| [ ] | [E23](#e23) | Structured data (JSON-LD) | distribution | p2 | E21 |
| [ ] | [E24](#e24) | Patch changelog page | distribution | p1 | E06 |
| [ ] | [E25](#e25) | Accessibility pass | quality | p1 | E08, E11 |
| [ ] | [E26](#e26) | Performance budget and analytics discipline | quality | p1 | E01 |
| [ ] | [E27](#e27) | Mobile and compact companion mode | quality | p1 | E10, E12 |
| [ ] | [E28](#e28) | Counter-the-counter (reverse view) | advanced | p2 | E05 |
| [ ] | [E29](#e29) | Win-rate grounding from match data | advanced | p2 | E05 |
| [ ] | [E30](#e30) | Threat explanations — teach the mechanic, not the shopping list | advanced | p2 | E17 |
| [ ] | [E31](#e31) | Community feedback loop on recommendations | advanced | p2 | E10 |
| [ ] | [E32](#e32) | Deep links to the Deadlock wiki | advanced | p2 | E17 |

## Foundation — data pipeline and patch resilience

### E01

**Project scaffold, CI, and deploy pipeline** — `p0` — **done**

### Problem
A counter tool is only trusted if it is obviously maintained. That starts with a build that
fails loudly when something breaks.

### Scope
- Next.js App Router + TypeScript + Tailwind (done by scaffold).
- GitHub Actions workflow: typecheck, lint, unit tests, build — on every PR.
- Vercel project connected with preview deploys per PR.
- Strict TypeScript (`strict: true`, `noUncheckedIndexedAccess`).
- Vitest configured; a placeholder test so the harness is real from day one.
- Dependabot or Renovate for dependency drift.

### Acceptance criteria
- A PR that breaks types or lint cannot be merged.
- Every PR gets a preview URL.
- `npm run verify` runs typecheck + lint + test + build locally.

**Depends on:** nothing

### E02

**Design profile — visual identity and design system foundation** — `p0` — **done**

### Problem
Every interface enhancement in this backlog assumes a design language that does not exist
yet. Without one we end up doing what the original site did: ad-hoc uppercase text blocks,
meaning carried entirely by colour, no consistent density, and no answer to "what should a
new component look like". Defining this **before** the UX work means E08 onwards has
something to build against instead of inventing styles per screen.

This is also a differentiator. The tool is used mid-match, glanced at for a few seconds, in a
dark room, often on a second monitor. That is a real and specific design brief, and nothing
in this space is designed for it.

### Scope

**1. Design profile document** (`docs/DESIGN.md`) — the written direction:
- **Positioning and tone.** Deadlock's own art direction is dieselpunk/occult noir. We should
  feel adjacent and native to the game without cloning Valve's assets or implying official
  status. Decide explicitly how close we sit.
- **Usage context as constraints.** Glanceable in under three seconds. Legible at arm's length
  on a second monitor. Dark-first, because the game is dark and the room usually is too.
  Information density over whitespace — this is a reference tool, not a landing page.
- **Design principles**, three to five, each written so it can settle an actual argument.
  Draft: *scannable beats beautiful*; *never encode meaning in colour alone*; *density with
  hierarchy*; *show provenance, always*.

**2. Design tokens** (implemented, not just described):
- Colour: dark-first palette with a documented light mode. Semantic tokens
  (`--surface`, `--threat-high`, `--counter-hard`, `--provenance-stale`) rather than raw
  hues, so ranking, threat severity, and item categories stay consistent everywhere.
- Type scale: one display face for identity, one highly legible UI face. The original set
  everything in uppercase, which is actively harder to scan — we will not.
- Spacing, radius, and elevation on a single scale tuned for a dense reference tool.
- Motion: durations and easings, with a `prefers-reduced-motion` path defined up front.
- Delivered as CSS custom properties wired into the Tailwind v4 theme, so tokens are the only
  source of style values.

**3. Core primitives** — the small set every later issue reuses:
Hero chip, item card, threat tag, coverage badge, provenance dot, accordion, slot,
empty state, loading skeleton.

**4. Accessibility baked in, not retrofitted:**
- Every semantic colour pair verified at WCAG AA against its intended background, with the
  contrast check automated so a token change cannot silently break it.
- Every state that uses colour also carries a shape, icon, or text affordance.
- Focus-visible styling defined once, as a token.

### Acceptance criteria
- `docs/DESIGN.md` exists and states the principles, the usage context, and the rationale.
- A `/styleguide` route renders every token and primitive in light and dark — reviewable
  in a PR preview.
- No component in any later PR introduces a raw hex value, font size, or spacing literal;
  enforced by a lint rule.
- Contrast checks run in CI.

### Notes
Deliberately scoped as **one** issue covering both the profile and its token implementation.
A design profile that is only a document gets ignored; tokens without a documented rationale
get argued about forever. They ship together.

Art assets themselves (hero portraits, item icons) come from the assets API in E12 — this
issue covers everything around them.

**Depends on:** E01

### E03

**Deadlock assets API sync pipeline** — `p0` — **done**

### Problem
The original site hardcodes English item names. When Valve renamed Debuff Remover to
Dispel Magic, the fix was a manual parenthetical in the FAQ. That does not scale against
a game that patches constantly.

### Scope
- Fetch heroes, abilities, and upgrade items from `https://api.deadlock-api.com/v1/assets/*`.
- **Key every record on `class_name`, never on display name.** `class_name` survives renames;
  display names do not. This is the single most important decision in the whole project.
- Normalise into our own typed shape (`src/data/schema.ts`) so an upstream API change is
  contained in one adapter file.
- Commit the normalised snapshot to the repo (`data/snapshot/`) so builds are reproducible
  and the site never hard-fails if upstream is down.
- Record upstream patch/version metadata alongside the snapshot.
- Filter out heroes flagged `disabled` / `in_development` / `not player_selectable`.

### Acceptance criteria
- `npm run sync` refreshes the snapshot deterministically.
- The build reads only from the committed snapshot, never live at request time.
- Renaming an item upstream changes display text and nothing else.

### Notes
Upstream schema reference: items expose `id`, `class_name`, `name`, `type`, `image`,
`image_webp`, `properties`, `description`. Heroes expose `images` (`icon_hero_card`,
`icon_image_small`, `minimap_image`), `starting_stats`, `items.signature1..4`, plus
`disabled` / `in_development` flags.

**Depends on:** E01

### E04

**Threat-tag overlay schema (abilities and items)** — `p0` — **done**

### Problem
Counter advice is currently hand-written prose per hero, which is why the same eight items
recur everywhere and why a new hero means writing everything from scratch.

### Scope
Two curated files, both keyed on `class_name`:

- `data/overlay/ability-threats.ts` — each ability maps to one or more threat tags.
- `data/overlay/item-counters.ts` — each item maps to the threat tags it answers, plus a
  one-line "why", and a strength weight (hard counter / soft counter / situational).

TypeScript rather than YAML: the acceptance criterion below asks for a typo to fail the
build, which the tag union gives directly. YAML would need a parser dependency plus runtime
validation to reach the same place.

Proposed initial tag vocabulary:
`hard_cc`, `channeled_ult`, `sustain`, `burst_spirit`, `high_dps_gun`, `airborne`,
`dot_debuff`, `displacement`, `stealth`, `zone_denial`, `summon_pressure`, `melee_pressure`.

### Acceptance criteria
- Tag vocabulary is a TypeScript union type; a typo fails the build.
- Every ability in the snapshot has at least one tag, or is explicitly marked `untagged`.
- A schema validation test fails CI if an overlay entry references an unknown `class_name`.

### Notes
This is the only file a human edits per patch. Everything else derives from it.

**Depends on:** E03

### E05

**Counter derivation engine** — `p0`

### Problem
Counters should be computed, not authored. Add a hero, and it should inherit sensible
counters from its ability tags immediately — with zero editorial work — so curation becomes
refinement rather than authorship.

### Scope
- Pure function: `deriveCounters(heroes[], context) -> RankedCounter[]`.
- Joins ability threat tags to item counter tags.
- Ranks by: number of enemies answered x counter strength x tag severity.
- Supports an optional editorial override layer for cases the tags get wrong, with a
  required `reason` field so overrides are auditable.
- Fully unit tested — this is the core of the product and must be pure and deterministic.

### Acceptance criteria
- Adding a hero to the snapshot with tagged abilities produces counters with no other change.
- Given the same inputs, output ordering is stable.
- Override entries appear in the UI as editorially curated, not derived.

**Depends on:** E04

### E06

**CI patch-diff detection and needs-review flagging** — `p0`

### Problem
We need to find out that a patch landed before our users do.

### Scope
- Scheduled GitHub Action (daily) runs the sync and diffs against the committed snapshot.
- Opens a PR automatically when it detects: new hero, new item, renamed item, removed item,
  or a material numeric change (cooldown / duration / damage) on a tagged ability.
- Optional Discord webhook notification.
- Anything touched by a diff gets `needs_review: true` in the derived data.
- New items with no overlay tags surface on an internal `/admin/untagged` page so nothing
  sits silently uncovered.

### Acceptance criteria
- A simulated upstream change produces a PR with a readable, reviewable diff.
- Untagged new items are impossible to miss.

### Notes
Public repo, so scheduled Actions minutes are free.

**Depends on:** E03, E04

### E07

**Patch version stamp and data provenance UI** — `p0`

### Problem
Trust is the entire value proposition of a counter tool, and no competitor displays where
their data came from or how old it is.

### Scope
- Persistent header badge: "Data synced from patch X — verified <date>".
- Per-item provenance dot (primitive defined in E02): green (auto-verified this patch),
  amber (patch changed this item, curation not yet reviewed).
- Hovering the badge explains the pipeline in one sentence and links to the changelog.

### Acceptance criteria
- The stamp is generated from snapshot metadata, never hand-edited.
- Amber state appears automatically from the `needs_review` flag set in E06.
- Provenance state is distinguishable without colour vision.

**Depends on:** E06, E02


## Core UX — the counter helper itself

### E08

**Accessible hero picker with portraits and keyboard navigation** — `p0`

### Problem
On the original site every hero chip is a `div.hero-chip` with no `tabindex` and no `role`.
The entire page contains exactly one `<button>` (the nav hamburger). It is unusable by
keyboard and opaque to screen readers.

### Scope
- Real `<button>` elements with `aria-pressed`, built on the hero chip primitive from E02.
- Roving tabindex with arrow-key navigation across the grid; Enter/Space to toggle.
- `/` focuses the search box; fuzzy search tolerant of "greytalon", "mo krill", "doorman".
- Hero portraits from `icon_image_small`; `minimap_image` for compact chips.
- Selected state readable without relying on colour alone.

### Acceptance criteria
- Full flow completable with keyboard only.
- Axe reports no violations on the picker.

**Depends on:** E03, E02

### E09

**Enemy team builder (6 slots)** — `p0`

### Problem
The original caps at 6 by silently adding a `disabled` class to remaining chips, with no
explanation and no sense of a team being assembled.

### Scope
- Six explicit slots rendered as a persistent team bar.
- Click a filled slot to clear it; clear-all control.
- When six are picked, remaining chips are disabled **with visible text** explaining why.
- Slots survive reload (see E20 for URL state).

### Acceptance criteria
- The team bar is always visible while scrolling the results.
- Reaching the cap is explained, not just enforced.

**Depends on:** E08, E05

### E10

**Aggregated counter shortlist with coverage counts** — `p0`

### Problem
This is the headline feature: see every counter item for the whole enemy team on one page.

### Scope
- Deduped list of every recommended item across the selected enemies.
- Sorted by how many enemies each item answers.
- Each row shows the **portraits of the enemies it counters**, so "Indomitable — 5/6" is
  obvious at a glance rather than requiring you to read a name list.
- Clicking a coverage portrait jumps to that hero's detail card.

### Acceptance criteria
- Coverage counts are derived, never hardcoded.
- The list reflows sensibly from 1 to 6 selected heroes.

**Depends on:** E09

### E11

**Retain per-hero detail in team mode** — `p0`

### Problem
**The single biggest functional flaw in the original.** Selecting one hero gives you a
matchup overview, lane-phase tips, situational advice, and a per-item breakdown. Selecting a
second hero *deletes all of it* and replaces it with a flat shared-counters list. The team
view is strictly less useful than the single view.

### Scope
- Two-pane layout: aggregated shortlist (E10) on the left, per-hero detail on the right.
- Per-hero detail as expandable accordions, one per selected enemy, each retaining matchup
  overview, lane tips, ability notes, and item reasoning.
- Nothing is lost by adding heroes — detail accumulates rather than being replaced.

### Acceptance criteria
- Every piece of information available at 1 selected hero is still reachable at 6.

**Depends on:** E10

### E12

**Item and hero artwork integration** — `p0`

### Problem
`document.images.length === 0` on the original page. No hero portraits, no item icons, no
ability icons — every entity is a bare uppercase text string. Players recognise these by
sight, not by name.

### Scope
- Item icons from `image_webp` with `image` fallback.
- Hero portraits, minimap icons, and ability icons from the assets API.
- Served through `next/image` with explicit dimensions so the grid never shifts.
- Local fallback placeholder if an upstream asset 404s after a patch.
- Treatment (framing, masking, glow on selection) follows the design profile from E02.

### Acceptance criteria
- Zero cumulative layout shift from images.
- A missing upstream asset degrades to a placeholder, never a broken image.

**Depends on:** E03, E02

### E13

**Show item cost, tier, and slot category** — `p0`

### Problem
The original shows none of these. Counter advice without "can I afford this, and do I have a
slot free" is not actionable mid-match.

### Scope
- Every item card shows soul cost, tier, and category (Weapon / Vitality / Spirit).
- All three read from the snapshot so they track patches automatically.
- Category conveyed by icon and label, not colour alone, using the E02 semantic tokens.

### Acceptance criteria
- Costs and tiers are never hardcoded in the repo.

**Depends on:** E03, E02

### E14

**Soul budget filter** — `p1`

### Problem
Mid-match, the only question that matters is "what can I buy *right now*".

### Scope
- Soul input / slider. Filters the shortlist to affordable items.
- "Just out of reach" section showing the next tier up, so users can plan the next back.

### Acceptance criteria
- Filtering is instant and does not refetch.

**Depends on:** E13

### E15

**Slot economy view — present counters as a build, not a wishlist** — `p1`

### Problem
You have a limited number of slots per category. A flat list of twelve recommended items
hides the actual decision, which is a tradeoff.

### Scope
- Group the shortlist by category, capped at the real per-category slot count.
- Show the recommended pick per slot with runners-up behind a disclosure.
- Surface the opportunity cost: "taking Metal Skin here means dropping X".

### Acceptance criteria
- Output reads as a buildable loadout, not a shopping list.

**Depends on:** E13

### E16

**Game-phase tabs (lane / mid / late)** — `p1`

### Problem
The original half-acknowledges this with a "How to counter during lane phase" prose block,
but the item list itself never changes. Lane counters and late-game counters are different
problems.

### Scope
- Lane / Mid / Late tabs that re-rank the shortlist.
- Phase preference expressed in the overlay (E04) rather than hardcoded in the UI.

### Acceptance criteria
- Switching phase visibly changes ranking, not just prose.

**Depends on:** E05

### E17

**Ability-level counter granularity** — `p1`

### Problem
The original says "counter Haze" and buries the specifics in prose — "Metal Skin for bullet
immunity during her ult". It never attaches a counter to a named ability as data.

### Scope
- Attach counters to individual abilities (Bullet Dance, Sleep Dagger, Smoke Bomb), each with
  its icon and current numbers from the snapshot.
- Enables cross-team queries like "who on this comp has a channeled ult?".

### Acceptance criteria
- Every recommended item states which specific ability or abilities it answers.
- Retuning one ability upstream updates only that ability's entry.

**Depends on:** E05, E12

### E18

**"Your hero" context filter** — `p1`

### Problem
Counters are asymmetric. Metal Skin is excellent on a frontliner standing in a carry's face
and much weaker on Grey Talon. The original has no concept of who *you* are playing.

### Scope
- Optional "my hero" selector that re-ranks the shortlist.
- Boost synergies, demote items that clash with the hero's role or kit.
- Redundancy warnings: "your ult already grants CC immunity".

### Acceptance criteria
- Selecting your hero measurably reorders results.
- The feature is optional and the tool works fully without it.

**Depends on:** E05

### E19

**Copy-to-clipboard team chat export** — `p1`

### Problem
The real in-game workflow is telling four teammates what to buy, in chat, in about eight
seconds.

### Scope
- One-click copy producing a compact plain-text shortlist.
- Length-aware format that survives an in-game chat box.

### Acceptance criteria
- Pasted output is readable without formatting.

**Depends on:** E10


## Distribution — URLs, SEO, sharing

### E20

**URL state and deep links** — `p0`

### Problem
On the original, `location.href` never changes no matter what you select. You cannot
bookmark, share, or link a matchup or a team comp. Every visit starts from zero.

### Scope
- Selections serialised to the query string (`?enemies=haze,bebop,abrams`).
- Back/forward navigation works.
- Slugs are stable and derived from `class_name`, so a hero rename does not break old links.

### Acceptance criteria
- Pasting a URL reproduces the exact tool state.

**Depends on:** E09

### E21

**Per-hero static SEO pages** — `p0`

### Problem
"how to counter haze deadlock" is the query people actually type, and the original has no
page that can rank for it — the tool is one client-rendered route with a single H1.

### Scope
- Statically generated `/counter/[hero]` for every playable hero — 38 free landing pages.
- Each rendered server-side with the full matchup content in the initial HTML.
- Generated from the snapshot, so a new hero ships a new page automatically.
- Sitemap and robots.txt generated from the same source.

### Acceptance criteria
- Content is present with JavaScript disabled.
- Adding a hero to the snapshot adds a page and a sitemap entry with no other change.

**Depends on:** E20, E11

### E22

**OG image generation for shared comps** — `p1`

### Problem
Shared in Discord, a link with no preview is invisible. This is how the tool spreads.

### Scope
- Dynamic OG images via `next/og` showing the six enemy portraits and top counters.
- Static OG images for the per-hero pages.
- Uses the E02 design tokens so previews look like the site, not like a default template.

### Acceptance criteria
- A pasted team-comp link renders a readable preview in Discord.

**Depends on:** E20, E12

### E23

**Structured data (JSON-LD)** — `p2`

### Scope
- `FAQPage` JSON-LD on hero pages for the matchup Q&A.
- `VideoGame` / `WebApplication` markup on the homepage.
- Breadcrumbs.

### Acceptance criteria
- Passes Google's Rich Results test with no errors.

**Depends on:** E21

### E24

**Patch changelog page** — `p1`

### Problem
Recurring traffic magnet, and doubles as public proof the site is actually maintained.

### Scope
- `/changelog` generated from the snapshot diffs produced in E06.
- "What changed for counters in patch X" — items added/removed/renamed, abilities retuned,
  and which matchups were affected as a result.
- RSS feed.

### Acceptance criteria
- Entries are generated from real diffs, not written by hand.

**Depends on:** E06


## Quality — accessibility, performance, mobile

### E25

**Accessibility pass** — `p1`

### Problem
The original is built almost entirely from non-semantic `div`s — `div.hero-chip`,
`div.situation-btn` — with one real `<button>` on the whole page.

### Scope
- Semantic elements throughout; correct roles and ARIA on all custom controls.
- Visible focus indicators; logical tab order.
- Screen reader pass with NVDA.
- WCAG AA contrast, verified in CI.
- `prefers-reduced-motion` respected.

### Acceptance criteria
- Automated axe checks run in CI and block merges on violations.
- Manual NVDA walkthrough of the core flow documented.

### Notes
E02 establishes the accessible defaults; this issue is the end-to-end audit that confirms
they survived contact with real screens.

**Depends on:** E08, E11

### E26

**Performance budget and analytics discipline** — `p1`

### Problem
The original loads Microsoft Clarity, PostHog (plus session recorder, surveys, dead-click
autocapture and web-vitals), Google Tag Manager, GA4, and AdSense — three redundant analytics
stacks — on a tool people alt-tab into during a match.

### Scope
- Pick **one** analytics tool. Self-host or proxy it.
- No session recording (it is the heaviest script on the original page and adds nothing here).
- Defer or lazy-load anything non-critical; ads below the fold only.
- Lighthouse CI with an enforced performance budget on PRs.

### Acceptance criteria
- Interactive within a second on a mid-range laptop.
- Budget regressions fail the build.

**Depends on:** E01

### E27

**Mobile and compact companion mode** — `p1`

### Problem
Real usage is a second monitor or a phone propped beside the keyboard, mid-match.

### Scope
- Portraits-only grid at narrow widths; tap opens a bottom sheet.
- A dense `?compact=1` layout for small windows and second monitors. E02 deliberately ships
  a single spacing scale rather than a density switch, so this changes **layout** — column
  count, what collapses, what is hidden — not spacing tokens.
- Touch targets at least 44px.

### Acceptance criteria
- Fully usable at 360px wide.
- Compact mode fits the core flow without scrolling on a 1280x400 window.

**Depends on:** E10, E12


## Advanced — differentiators

### E28

**Counter-the-counter (reverse view)** — `p2`

### Problem
Nobody offers this, and it is nearly free — it is the same engine run in reverse.

### Scope
- Enter your own team, see what the enemy is likely to buy against you.
- Pre-empt it: "they will buy Healbane; consider X".

### Acceptance criteria
- Reuses `deriveCounters` with inverted inputs, no duplicated logic.

**Depends on:** E05

### E29

**Win-rate grounding from match data** — `p2`

### Problem
Every competitor's advice is editorial opinion. Evidence is a real moat.

### Scope
- Pull aggregate match data from the Deadlock API.
- Surface item-vs-hero win-rate deltas alongside derived recommendations.
- Show sample sizes and confidence honestly; suppress low-n claims rather than implying rigour.
- Use it to *validate* the overlay: flag curated counters the data disagrees with.

### Acceptance criteria
- No statistic is displayed without its sample size.
- Low-confidence data is hidden, not caveated in small print.

**Depends on:** E05

### E30

**Threat explanations — teach the mechanic, not the shopping list** — `p2`

### Problem
"Buy Metal Skin" tells you what to click. "Her passive stacks and resets when you break line
of sight" tells you how to play the matchup — and makes the item choice obvious.

### Scope
- A short "why this is dangerous" line per tagged ability, authored in the overlay.
- Surfaced inline next to the counter it justifies.

### Acceptance criteria
- Every threat tag on a hero has a plain-English explanation attached.

**Depends on:** E17

### E31

**Community feedback loop on recommendations** — `p2`

### Problem
The overlay is curated by one person against a game that changes weekly. Crowdsourced QA is
cheap and catches drift fast.

### Scope
- Thumbs up/down per counter recommendation.
- Feeds a moderation queue, not the live ranking — no brigading the data.
- Aggregate disagreement surfaces on the admin page as a review prompt.

### Acceptance criteria
- Votes never directly mutate rankings.
- Rate limited and abuse resistant.

**Depends on:** E10

### E32

**Deep links to the Deadlock wiki** — `p2`

### Problem
The community treats deadlock.wiki as canonical. Linking out costs nothing and buys
credibility.

### Scope
- Per-item and per-ability links to the corresponding wiki page.
- Slug mapping validated in CI so patches do not silently produce dead links.

### Acceptance criteria
- A broken wiki link fails the scheduled check.

**Depends on:** E17

