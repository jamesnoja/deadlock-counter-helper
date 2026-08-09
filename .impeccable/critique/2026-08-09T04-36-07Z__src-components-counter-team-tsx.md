---
target: /?enemies=lash,haze,abrams,seven
total_score: 26
p0_count: 0
p1_count: 2
timestamp: 2026-08-09T04-36-07Z
slug: src-components-counter-team-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Provenance stamp, fetch date, "N of M" coverage and "Showing X of Y" are all present. No feedback when a situation highlight targets a card already on screen. |
| 2 | Match System / Real World | 3 | Speaks Deadlock fluently. The source's own `Solution: … Why: …` prefixes leak through unedited, and "coverage / build" lens names are ours, not the domain's. |
| 3 | User Control and Freedom | 3 | Clear one / clear all, URL state, situations toggle off. Nothing traps the user. |
| 4 | Consistency and Standards | 2 | Two different card vocabularies describe the same items on one screen: the Counter plan cards and the Best items cards. One shows `4 / 4`, the other `#1`. |
| 5 | Error Prevention | 3 | Six-enemy cap is enforced with an explanation; filters that empty the list produce a real empty state. |
| 6 | Recognition Rather Than Recall | 3 | Everything is visible, and the coverage portraits are genuine recognition aids. Undercut by the all-caps body text. |
| 7 | Flexibility and Efficiency | 2 | Shareable URLs are a real accelerator. No keyboard shortcuts, no way to collapse the 20-card grid, no density control. |
| 8 | Aesthetic and Minimalist Design | 2 | At four enemies: 20 fully expanded cards, 196 images, two ranked summaries, four competing sections. Density without enough hierarchy. |
| 9 | Error Recovery | 3 | "No advice published" and "filters too narrow" are correctly distinguished. Genuinely better than most tools manage. |
| 10 | Help and Documentation | 2 | No in-product explanation of what a threat group means beyond one line, and the tag glossary died with the admin page. |
| **Total** | | **26/40** | **Acceptable. Significant improvements needed.** |

## Anti-Patterns Verdict

**Would someone say AI made this? No.** This does not read as generated. The palette is committed rather than defaulted (mint on near-black, not the cream-and-sage reflex), the copy is specific and unhedged, there are no eyebrow kickers, no numbered section scaffolding, no gradient text, no hero-metric template, and the empty states say something true rather than "No results". The information architecture is doing real work.

**Deterministic scan**: `detect.mjs --json src/components src/app` exited **0 with zero findings**. No slop signatures, no ghost-card border-plus-shadow pairs, no over-rounded cards, no stripe backgrounds.

The failures here are not slop. They are self-inflicted violations of the project's own stated rules, which is a more interesting problem.

**Visual overlays**: not available. No Chrome binary on this machine, so no browser injection and no user-visible overlay. Findings below come from source reading, rendered-HTML inspection of the four-enemy URL, and the screenshot supplied earlier in this session.

## Overall Impression

The bones are excellent and the thinking is unusually honest. What is wrong is almost entirely accretion: the team view was added without removing what it superseded, and the design system's smallest type tier is being used for content it was never meant to carry.

The single biggest opportunity: **this screen currently answers the same question three times.** Counter plan, Best items, and What this lineup demands are three rankings of one dataset stacked vertically. Collapse that to one answer and the density problem, the hierarchy problem, and half the scroll go with it.

## What's Working

**The empty-state distinction is the best thing here.** "Nobody has published this" versus "nothing counters them" versus "your filters hid everything" are three different states with three different copy blocks. Almost no tool bothers. It is the product principle made literal.

**Coverage portraits beat a coverage number.** `Answers 3 of 4` with the three lit and one dimmed answers "which three" in the same glance as "how many". That is the right call for a three-second read, and the `sr-only` fallback means it survives a screen reader.

**Provenance is load-bearing, not decorative.** Fetch date, patch stamp, and a credited source link on every view. The tool is honest about advice it did not write, which is exactly what makes the rest credible.

## Priority Issues

### [P1] Body copy is rendered in 11px all-caps
`.text-micro` is `font-size: 0.6875rem; letter-spacing: 0.08em; text-transform: uppercase`. It is correctly an eyebrow tier. It is being used for full sentences: item why-bullets, situation reasons, lane-phase tips, and threat-group descriptions. The screenshot shows `— HARD-STOPS ENEMY ABILITY COMBOS AND TEAM-PLAY SETUPS.` and `SOLUTION: THROW KNOCKDOWN ANVIL. WHY: STUNS HIM OUT OF THE CHANNELED ULTIMATE INSTANTLY.` wrapping across three lines.

**Why it matters**: this is the exact thing the project defines itself against. DESIGN.md: *"the eyebrow tier is the only uppercase in the system, the original site set everything in caps, which is measurably harder to scan, and we do not."* PRODUCT.md lists it as an anti-reference. It also breaks the documented 13px floor for arm's-length reading, and all-caps defeats word-shape recognition, which is precisely the mechanism a three-second glance depends on.

**Fix**: move every multi-word sentence off `text-micro` and onto `text-caption` (13px, sentence case). Reserve `text-micro` for labels of four words or fewer: `#1`, `4 of 6`, `vitality`, `T3`. Audit `counter-card.tsx`, `counter-team.tsx`, `counter-single.tsx`.
**Suggested command**: `$impeccable typeset`

### [P1] The same three items are ranked twice, in the same order, on one screen
At two or more enemies, `CounterPlan` renders above the lens switcher and `CounterTeam` renders inside it. Verified in the rendered HTML: Counter plan shows Indomitable `4/4`, Knockdown `3/4`, Spirit Burn `2/4`; Best items immediately below shows Indomitable `#1`, Knockdown `#2`, Spirit Burn `#3`. Same items, same order, same reason strings, two different visual vocabularies.

**Why it matters**: the reader has to work out whether these are two answers or one answer twice, which is pure extraneous load at the exact moment they wanted a fast answer. It also creates the inconsistency scored under heuristic 4: `4 / 4` and `#1` are the same fact in two notations.

**Fix**: pick one. Either drop `CounterPlan` at 2+ enemies now that the overview exists, or keep it as the answer and make the grid below it the detail rather than a second ranking. My recommendation is to drop it: the overview's top three cards already carry more information than the plan cards do.
**Suggested command**: `$impeccable distill`

### [P2] Twenty fully expanded cards is the wrong default at team size
Every card renders artwork, name, cost, category, rank, coverage strip with four portraits, description, and up to four why-bullets. At four enemies that is 20 cards and 196 images before the reader reaches "What this lineup demands", which is arguably the most useful section on the page.

**Why it matters**: the single-hero view has 6 to 9 cards and expansion is right there. The team view reuses the density without re-earning it. The threat profile, the thing the team view exists for, is pushed below a very long grid on narrow screens because the columns stack.

**Fix**: expand the top three or four, collapse the tail to a compact row (art, name, cost, coverage) that expands on click. Or move the threat profile above the grid on stacked layouts so it is not buried.
**Suggested command**: `$impeccable layout`

### [P2] The smooth scroll ignores `prefers-reduced-motion`
`showAnswer` calls `scrollIntoView({ behavior: 'smooth' })` in both `counter-single.tsx` and `counter-team.tsx`. The global reduced-motion block sets `scroll-behavior: auto !important`, which governs CSS-driven scrolling only. A JavaScript `behavior: 'smooth'` argument is unaffected.

**Why it matters**: it is the one motion in the interface and it is the one that bypasses the accommodation. Users who set the preference for vestibular reasons still get the animated jump.

**Fix**: read the preference and pass `behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'`.
**Suggested command**: `$impeccable audit`

### [P2] The source's formatting leaks into our copy
Situation reasons arrive as `Solution: Buy Spirit Burn or Toxic Bullets early. Why: Provides the largest healing reduction in the game (-70%)…`. We then prefix them with the situation label, producing `Storm Cloud healing is keeping him alive: Solution: Use Spirit Burn. Why: …`. Two labelling systems in one sentence.

**Why it matters**: the reader parses a label, then a second label, before reaching content. In caps, currently.

**Fix**: strip the `Solution:` and `Why:` prefixes at import in `sync-counters.mts`, or split on them and render the two halves as distinct elements. Prefer the import: it is one place, and the committed data becomes cleaner for every consumer.
**Suggested command**: `$impeccable clarify`

## Persona Red Flags

**Alex (Impatient Power User)**: No keyboard shortcuts anywhere, on a tool explicitly designed to be used mid-match while a game has focus. Selecting four enemies is four mouse trips through a 38-button picker. There is no way to type a hero name and hit enter, no way to paste a lineup, and no shortcut to clear. The URL is shareable, which he will love, but he has to build the lineup by hand every time. Nothing supports the twenty-second workflow this tool is for.

**Sam (Accessibility-Dependent)**: Mostly well served, which is unusual. Real `<button>` elements with `aria-pressed`, a tokenised focus ring, native `<details>`, `sr-only` text behind the coverage portraits, and colour never carrying meaning alone. Two real flags: the smooth scroll ignores his reduced-motion preference, and the 11px uppercase tracked text is the hardest thing on the page to read at 200% zoom, where letter-spacing and caps compound.

**The mid-match player (derived from PRODUCT.md, since AGENTS.md has no Design Context section yet)**: He has about three seconds, on a second monitor, in a dark room. He gets a screen with two ranked summaries, a 20-card grid, a threat profile, four hero panels, and 109 buttons. The answer he needs is the first card, and it is correct, but nothing about the layout says "this one". He also has to read the reason in capitals. This persona is the whole product thesis and is currently the least well served on this specific screen.

## Minor Observations

- Without JavaScript the Suspense fallback is what renders, so a shared four-enemy link shows `Enemy team — 0 of 6` and an empty state. Both versions are in the HTML, so crawlers may index the empty one.
- `#1` is `aria-hidden` on the card but the rank is not otherwise announced, so screen-reader users lose the ordering that sighted users get for free.
- The threat profile lists hero names as a plain comma-joined string while every other hero reference on the page uses a portrait. Inconsistent, and it is the one place where scanning for "is my lane opponent in this group" is slow.
- `text-micro` at 11px contradicts DESIGN.md's stated 13px floor. Contrast is fine at roughly 6.0:1 on surface, so this is legibility rather than a contrast failure.
- "Hero by hero" panels are all collapsed by default, so at four enemies the entire right column below the profile is four closed rows. Consider opening the first.

## Questions to Consider

- If the threat profile is the reason the team view exists, why is it second in the right column and below 20 cards on mobile?
- What would this screen look like if it could only show three items, and everything else were one click away?
- The single-hero view earns its density because there is one subject. What does the team view earn its density with?
- If the reason text were sentence case at 13px, would you still need the card to be as tall as it is?
