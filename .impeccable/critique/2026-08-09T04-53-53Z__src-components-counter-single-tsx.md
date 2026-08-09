---
target: single character view
total_score: 30
p0_count: 0
p1_count: 0
timestamp: 2026-08-09T04-53-53Z
slug: src-components-counter-single-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Rank, cost, category and the fetch date are all present. The situation highlight gives no feedback when its target is already on screen. |
| 2 | Match System / Real World | 3 | Reads like a player wrote it, because one did. Reason text now clean after the `Solution:` strip. |
| 3 | User Control and Freedom | 3 | Situations toggle off, filters are reversible, the URL is the state. |
| 4 | Consistency and Standards | 3 | One card vocabulary shared with the team view. `Counters — 8 items` and `Best items against Lash` are two headings for one list. |
| 5 | Error Prevention | 3 | Nothing destructive exists here. |
| 6 | Recognition Rather Than Recall | 3 | Everything visible; eight cards is within scanning range without collapsing. |
| 7 | Flexibility and Efficiency | 3 | Inherits the picker's accelerators. No way to jump between the two columns. |
| 8 | Aesthetic and Minimalist Design | 3 | The 60/40 split works and the reading order is right. Eight open cards is the correct call at this size. |
| 9 | Error Recovery | 4 | Three genuinely distinct empty states: no published write-up, no counters yet, and counters hidden by filters. This is better than almost any tool in the category manages. |
| 10 | Help and Documentation | 2 | Nothing explains what "Answers 3 of 4" or the coverage portraits mean. |
| **Total** | | **30/40** | **Good. Address weak areas, solid foundation.** |

## Anti-Patterns Verdict

**Would someone say AI made this? No.** `detect.mjs` clean, exit 0. The layout is specific to the problem rather than a template: a ranked grid beside prose, with the prose deliberately second. No identical-card-grid reflex, because the cards carry genuinely different content lengths.

**Visual overlays**: unavailable, no Chrome binary. Evidence is source plus rendered HTML of `/?enemies=lash` and the screenshot supplied earlier in the session.

## Overall Impression

This is the strongest surface in the product and it is close to done. The order is right, the density is right at this size, and the empty-state handling is genuinely exemplary. What remains is smaller: an inherited caps problem in the shared sub-components, and a layer of explanation that was lost when the admin glossary was deleted.

The biggest opportunity is that nothing on this page teaches its own vocabulary. The page says "Answers 3 of 4" and shows four portraits, two lit; a first-time reader has to infer both.

## What's Working

**The three empty states.** "Nobody has published a write-up for this hero", "no published counters yet", and "no counters match the current filters" are three different problems with three different fixes, and the copy says which is which. There is a test asserting they stay distinct.

**Answer before explanation.** Items lead, prose follows. For a three-second glance that ordering is the whole design, and it survived the width and alignment passes intact.

**Reason text now reads as ours.** Stripping `Solution:` and `Why:` at import removed the double-labelling; the situation label plus a clean sentence is a single, readable unit.

## Priority Issues

### [P2] The shared sub-components still set sentences in 11px caps

The card and column fixes landed, but this view renders `item-meta`, `item-stats` and `coverage-cell`, which have 7 `text-micro` usages between them, and the picker above it has its instruction line on the same tier. The surface is inconsistent with itself: the card body is 13px sentence case, the components inside and above it are not.

**Why it matters**: partial adoption of a type rule is worse than none, because it reads as arbitrary rather than systematic.
**Suggested command**: `$impeccable typeset`

### [P2] Nothing teaches the coverage notation

"Answers 3 of 4" with four portraits, two dimmed, is a dense and good notation. It is also never explained. The tag glossary that used to carry this kind of explanation was deleted with the admin page, and nothing replaced it.

**Why it matters**: the notation is doing real work for a returning user and is opaque to a first-time one. On a single-hero view it is worse, because at one enemy the strip is suppressed entirely, so the user meets it for the first time only after adding a second hero, with no introduction.

**Fix**: a one-line legend under the grid heading, or a `title`/`abbr` on the count. It does not need a modal or a tour.
**Suggested command**: `$impeccable clarify`

### [P2] The rank is hidden from screen readers

`#1` carries `aria-hidden` on the card and the ordering is not conveyed any other way. Sighted users get the ranking for free from position and badge; a screen-reader user gets an unordered-sounding list of eight items.

**Fix**: the grid is a `<ul>`; either drop the `aria-hidden` and let the badge read, or add `sr-only` "ranked 1 of 8" text.
**Suggested command**: `$impeccable audit`

### [P3] Two headings for one list

`h2 Counters — 8 items` sits above `h3 Best items against Lash`. The `h2` is generic and count-shaped, the `h3` is specific. One of them is redundant, and it is the outer one.

**Fix**: let the specific heading own the section and drop the wrapper, or move the count into the specific heading.
**Suggested command**: `$impeccable layout`

## Persona Red Flags

**Jordan (Confused First-Timer)**: reaches this view from a search result for "how to counter Lash". Gets eight items with costs and reasons, which is exactly right. Does not know what the category pills mean, what `T3` is, or why one item is `#1`. Nothing on the page defines its own terms, and the glossary that would have is gone.

**Sam (Accessibility-Dependent)**: well served. Real buttons, `aria-pressed` on situations, native disclosures, tokenised focus ring, and the smooth scroll now honours reduced motion. Two flags: the rank is `aria-hidden` so ordering is lost, and the shared sub-components' 11px uppercase tracked text is the hardest thing here to read at 200% zoom.

**The mid-match player (from PRODUCT.md)**: best served on this surface of any in the product. The answer is the first card, the reason is one readable sentence, and the prose does not compete for the same space. This is the view that delivers the product thesis.

## Minor Observations

- On narrow screens the two columns stack, so the matchup overview sits below eight full cards. Acceptable at eight; it is the same mechanism that made the team view a problem at twenty.
- The situation highlight scrolls even when its target is already fully visible, which reads as a jolt for no reason. Worth a visibility check before scrolling.
- Hero pages and the tool now share this component but not the surrounding chrome, so the same view has a provenance stamp in one context and not the other.

## Questions to Consider

- If a first-time visitor from a search engine is the second-largest audience, what does this page owe them that it currently gives to nobody?
- The single-hero view is the best surface in the product. What would the other surfaces look like if they were held to it?
- Does the outer `Counters — N items` heading exist for a reason, or because the tool needed a wrapper before this component existed?
