---
target: home page (/)
total_score: 27
p0_count: 0
p1_count: 2
timestamp: 2026-08-09T04-53-53Z
slug: src-app-page-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Provenance stamp, "0 of 6" slot count, `role="status"` live regions on filtering and on the six-enemy cap. |
| 2 | Match System / Real World | 2 | The hero paragraph promises "the specific ability each item counters". That feature was deleted in the redesign. It also promises slots, which no card shows. |
| 3 | User Control and Freedom | 3 | Clear one, clear all, shareable URL, nothing traps the user. |
| 4 | Consistency and Standards | 3 | Coherent vocabulary. Em dashes are used as a separator in five different UI strings, which is consistent but wrong. |
| 5 | Error Prevention | 3 | Six-enemy cap is enforced and explained in a live region rather than silently ignoring clicks. |
| 6 | Recognition Rather Than Recall | 3 | Search box with real examples in the placeholder. Nothing is hidden behind memory. |
| 7 | Flexibility and Efficiency | 3 | `/` focuses search, arrow keys and Enter move into the grid, URL carries state. Genuinely good accelerators. |
| 8 | Aesthetic and Minimalist Design | 3 | Clean at rest. The gradient header is the only decorative element and it earns its place as the one brand moment. |
| 9 | Error Recovery | 2 | The empty state says "Pick a hero above to see counters" and stops. It names the action without teaching anything. |
| 10 | Help and Documentation | 2 | No explanation of what the tool does beyond a promise that is no longer accurate. |
| **Total** | | **27/40** | **Acceptable. Significant improvements needed.** |

## Anti-Patterns Verdict

**Would someone say AI made this? No.** `detect.mjs` exited 0 with zero findings across `page.tsx`, `counter-single.tsx`, `counter-card.tsx` and `hero-picker.tsx`. No eyebrow scaffolding, no numbered sections, no gradient text, no ghost-card borders, no over-rounding. The one gradient is a full-bleed header background, not `background-clip: text`.

**Visual overlays**: unavailable, no Chrome binary. Evidence is source reading plus rendered-HTML inspection of `/`.

## Overall Impression

The machinery under this page is better than the page admits. The hero picker in particular is the best-built component in the project: real `<label>`, `type="search"`, a `/` shortcut, arrow-key entry into the grid, and live regions for both filtering and the enemy cap. Almost nothing advertises any of that.

The single biggest problem is that the front door describes a different product. The hero paragraph sells per-ability counter detail, which the redesign deliberately removed six PRs ago.

## What's Working

**The hero picker is quietly excellent.** `/` to focus, type to filter, ArrowDown or Enter to step into the grid, `role="status"` announcing the filtered count. This is the accelerator layer a mid-match tool needs and it was built without being asked for.

**The empty state is honest and calm.** No fake skeleton, no illustration, no "get started" theatre. It names the next action in six words.

**Provenance sits above the tool, not below it.** Patch stamp before interaction rather than buried in a footer, which is the correct weight for a tool whose whole claim is freshness.

## Priority Issues

### [P1] The front door promises a feature that no longer exists

> "Pick the enemy team, see every item that answers their kit, with costs, tiers, slots, and the specific ability each item counters."

**The specific ability each item counters was deleted.** It came from the tag overlay; the per-ability breakdown went with `ability-breakdown.tsx` and `explain.ts`. Nothing on any surface now attributes a counter to a named ability. "Slots" is also unshown: cards carry cost and category, not slot.

**Why it matters**: this is the first sentence a new user reads and the sentence a search engine indexes. It sets an expectation the product cannot meet, and the mismatch is discovered at exactly the moment the user is deciding whether to trust the tool. It is also the one claim on the page that a competitor could disprove in ten seconds.

**Fix**: rewrite against what the product actually does now. Something in the shape of: pick the enemy team, get the items that answer them, with costs and the reason each one works. Drop "slots" and the ability clause. While in there, the em dash violates the copy rules.
**Suggested command**: `$impeccable clarify`

### [P1] The primary action has no heading

The heading outline at rest is `h1 Deadlock Counter Helper`, then `h2 Enemy team — 0 of 6`, then nothing. The hero picker, which is 38 buttons and the entire point of the page, sits in an unlabelled `<div>`. Its inner grid has `role="group" aria-label="Heroes"`, which helps, but there is no heading a screen-reader user can navigate to and no landmark for the main task.

**Why it matters**: heading navigation is the primary way screen-reader users move around a page. Here the only heading below the title describes the *result* area, not the *input* area. A user tabbing in has to discover the search box by walking the tab order.

**Fix**: give the picker a real heading, and reconsider which section deserves `h2`. "Enemy team" is a status readout; "Pick the enemy team" is the task.
**Suggested command**: `$impeccable audit`

### [P2] The whole tool renders twice in the HTML

The Suspense fallback renders a complete `CounterTool` at `EMPTY_STATE`, and the resolved tool renders beside it. At rest that is 76 buttons and 76 images in the markup where 38 of each are real, and two `h2 Enemy team — 0 of 6` headings.

**Why it matters**: without JavaScript the fallback is what shows, so a shared four-enemy link renders an empty tool. Crawlers may index the empty version, which undercuts the per-hero pages' whole SEO argument. It also doubles the initial HTML for a tool whose stated context is a second monitor mid-match.

**Fix**: the comment says the fallback is "what a crawler with no JS sees", but a crawler seeing the empty state is the failure, not the design. Render the decoded state in the fallback rather than `EMPTY_STATE`, or move the `useSearchParams` dependency so the boundary is not needed at page level.
**Suggested command**: `$impeccable optimize`

### [P2] The all-caps fix was partial

The previous critique's P1 was fixed in `counter-card`, `counter-team` and `counter-single`. `text-micro` is 11px uppercase tracked and still carries sentences elsewhere: the hero picker's own instruction ("Search heroes, press / to jump here"), and `team-bar`'s `h2` which puts the section heading itself on the smallest tier.

**Why it matters**: the picker instruction is where the keyboard accelerators are documented. Setting the one line that teaches the shortcut in 11px caps is why nobody knows the shortcut exists.

**Fix**: same rule as before. Sentences to `text-caption`; `text-micro` for labels of four words or fewer. The team-bar `h2` should not be the smallest type on the page.
**Suggested command**: `$impeccable typeset`

### [P3] The empty state names an action but teaches nothing

"No enemies selected. Pick a hero above to see counters." It is honest and calm, which is why it is P3 and not higher. But this is the first-run experience for every new visitor, and it spends its one opportunity restating the obvious.

**Fix**: use it to teach one thing the user would not guess: that picking a second enemy adds detail rather than replacing it, or that the URL is shareable, or that `/` jumps to search.
**Suggested command**: `$impeccable onboard`

## Persona Red Flags

**Jordan (Confused First-Timer)**: reads the hero paragraph, expects to see which ability each item counters, and never finds it. Picks a hero and gets 8 cards with no explanation of what "Answers 3 of 4" means or what the coverage portraits are. The empty state told him to pick a hero but not what he would get.

**Alex (Impatient Power User)**: **better served than my previous critique claimed.** `/` focuses search, typing filters, ArrowDown enters the grid, and the URL is shareable and hand-editable. My last report said "no keyboard shortcuts anywhere, no type-to-select", and that was wrong. What is still missing: no shortcut to clear the team, no way to paste a lineup, and the shortcut that does exist is documented in 11px caps.

**Sam (Accessibility-Dependent)**: live regions on filtering and on the enemy cap, real labels, focus ring as a token. Two flags: no heading for the primary input region, and the tool appearing twice in the DOM means the virtual cursor may encounter two "Enemy team" sections.

## Minor Observations

- Em dashes appear as a separator in at least five UI strings (`Enemy team —`, `Counters —`, `Search heroes —`, the chat-export hint, the provenance note). The project's copy rules ban them.
- `h1` is `text-display` on a gradient. Worth confirming contrast of `--on-brand` against all three gradient stops, not just the middle one; the contrast test covers token pairs, not gradients.
- The footer order puts the fan-project disclaimer above the source credit, so the attribution is the last thing on the page. Given the advice is not ours, it arguably outranks the Valve disclaimer.

## Questions to Consider

- If the hero paragraph had to describe the product in one sentence with no adjectives, what would it say?
- The picker is the best component in the project and looks like the least important thing on the page. What would it look like if the layout said "this is the main event"?
- Should the empty state be empty at all, or should it show what a good answer looks like using a sample lineup?
