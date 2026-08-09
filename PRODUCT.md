# Product

## Register

product

## Users

Deadlock players, mid-match, deciding what to buy next.

The context is unusually specific and it settles most design arguments on its own: the tool is
glanced at for about three seconds, often on a second monitor or a phone propped beside the
keyboard, usually in a dark room, while something is happening in the game. Nobody is reading
this. They are looking for one item name and a cost.

The job to be done: *"the enemy team has this shape — what do I buy to answer it?"* Sometimes
against one hero they are laning into, more often against the whole lineup.

Secondary audience: players searching *"how to counter haze deadlock"* before or after a match,
who land on a per-hero page from a search engine. Same answer, more time to read it.

## Product Purpose

A counter-item helper for Deadlock: pick the enemy team, see the items that answer them, with
costs, tiers, and the reason each one works.

Two things make it worth building rather than using what already exists.

**Detail accumulates instead of collapsing.** The common pattern elsewhere is a rich single-hero
view that flattens into a shared-counters list the moment you pick a second enemy — the tool gets
*less* useful as your problem gets harder. Here, adding a hero adds information: the shortlist
gains coverage per item, the lineup gains a threat profile, and every hero keeps its own write-up.

**It shows its work.** Counter advice is published by a third party and used with attribution, so
every view names the source and the date it was fetched. Game data comes from the assets API and
carries its own patch stamp. Where nobody has published advice for a hero, the tool says exactly
that rather than rendering an empty list — "nobody has published this" and "nothing counters them"
are different claims and must never be conflated.

Success is time-to-answer. If someone finds the item they need without reading a paragraph, it
worked.

## Brand Personality

**Confident, dense, honest.**

A well-made tool by someone who plays the game. Not a fan site, and not a Valve product.

The voice is direct and unhedged: it names an item and says why, in the fewest words that survive
being read at a glance. It does not sell, does not pad, and does not perform expertise. Where the
tool is uncertain — stale data, an uncovered hero, advice it did not write — it says so plainly
in the same voice, because admitting a gap is what makes the rest credible.

Visually it commits: heavy type, one loud colour, no timid greys. Timid is the one thing this is
not.

## Anti-references

**Deadlock Item Builder** is the content source and is credited on every view. Its *interface* is
still the anti-reference, specifically:

- **Detail collapses on the second hero.** The single-hero view is genuinely good; picking a
  second replaces it with a flat category list. This is the failure the product exists to fix.
- **Everything set in caps.** Measurably harder to scan, and the opposite of a three-second read.
- **Three redundant analytics stacks plus ads** on a tool people alt-tab into mid-match.
- **Non-semantic markup** — near-everything a `div`, almost no real controls, unusable by keyboard.

Also not this:

- **The game's own art direction.** Deadlock is dieselpunk occult noir. Cloning it would imply
  official status we do not have, and Valve's assets are not ours to restyle. We sit adjacent to
  the game, taking its darkness and density and nothing else.
- **A landing page.** No hero-metric templates, no marketing gradient, no scroll-driven reveals.
  Information density earns its keep here.
- **A wiki.** Long prose is a failure state, not a feature.

## Design Principles

**1. Time-to-answer is the only metric.** If a layout is prettier but slower to read, it loses.
The test is whether someone finds the item without reading prose.

**2. Detail accumulates, never collapses.** Adding an enemy must add information. Any change that
makes the six-hero view *less* informative than the one-hero view is wrong, however much tidier it
looks.

**3. Show your work.** Provenance is a feature, not chrome. Where advice came from, when it was
fetched, what a patch touched, and what nobody has written yet all belong on screen.

**4. Say "we don't know" out loud.** An absent answer and a negative answer are different, and the
interface must always be able to tell them apart. Silence that looks like an answer is the worst
failure this tool can have.

**5. Adjacent to the game, not inside it.** Never imply official status. Never restyle Valve's
assets. The credibility comes from being obviously a fan tool that is obviously well made.

## Accessibility & Inclusion

**WCAG 2.2 AA is the floor**, enforced in code: `src/design/contrast.ts` and its test check every
token pair used for text, and the build fails on a regression.

**Colour never carries meaning alone.** Every state that uses colour also carries a glyph, a shape,
or a word — counter strength is spelled out beside its tint, and the provenance marker changes
*shape* between verified and stale rather than only hue. This is not a checkbox: roughly one in
twelve men has some form of colour vision deficiency, and this audience skews heavily that way.

**Reduced motion is honoured**, and no content is gated behind a reveal transition — a section that
never animates must still be readable.

**Read at arm's length.** Type does not go below 13px; touch targets clear 44px, since a phone
beside the keyboard is a real usage mode.

**Dark is the default surface**, not a theme variant, because the room is dark. Light mode is
supported and documented as the secondary case.
