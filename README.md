# Deadlock Counter Helper

A counter-item helper for [Deadlock](https://store.steampowered.com/app/1422450/Deadlock/):
pick the enemy team, see every item that answers their kit — with costs, tiers, slots, and the
specific ability each item counters.

Fan project. Deadlock is the property of Valve Corporation.

## Why this exists

Existing counter tools have three problems this one is built to fix:

1. **They lose information as you add heroes.** The common pattern is a rich single-hero view
   that collapses into a flat shared-counters list the moment you pick a second enemy. Here,
   detail accumulates instead of being replaced.
2. **They can't survive patches.** Advice hardcoded against English item names breaks the day
   Valve renames something. Everything here is keyed on the game's internal `class_name` and
   derived from a synced snapshot, so a rename changes display text and nothing else.
3. **They don't show their work.** Given how often the game patches, "when was this last
   verified" is the most important thing on the page. It's in the header.

## Architecture

Counters are **derived, not authored**. Three layers:

| Layer | What | Who maintains it |
| --- | --- | --- |
| **A — Snapshot** | Heroes, abilities, items pulled from the [Deadlock assets API](https://github.com/deadlock-api/deadlock-api-assets), normalised and committed to `data/snapshot/` | Automated, daily |
| **B — Published counters** | Per-hero counter advice from [Deadlock Item Builder](https://deadlockitembuilder.com/counter-item-helper), resolved to `class_name` and committed to `data/counters/` | Imported, with attribution |
| **C — Ranking** | Pure function combining per-hero advice into team-wide recommendations | Code |

## Where the advice comes from

The counter recommendations — which items answer which hero, the matchup summaries, the lane
advice and the situational calls — are published by
**[Deadlock Item Builder](https://deadlockitembuilder.com/counter-item-helper)** and used here
with attribution. Costs, tiers, ability text and artwork come from the game's own assets.

Two consequences worth stating plainly:

1. **We follow their cadence, not the patch cycle.** If they stop updating, this stops being
   right, and nothing in our pipeline would notice. Every view shows when the data was last
   fetched for that reason.
2. **A hero they have not written up gets no advice here.** The UI says so explicitly rather
   than rendering an empty list — "nobody has published this" and "nothing counters them" are
   different claims.

When Valve ships a new hero, see **[docs/NEW-HERO.md](docs/NEW-HERO.md)**. The short version:
CI fails on purpose, you acknowledge the gap in one line, and the site shows an honest empty
state until the source catches up.

Their data is keyed on English display names. Ours is not: `npm run sync:counters` resolves
every name to a `class_name` at import and **fails rather than degrading** if one will not
resolve. That already earned its keep — `Curse` and `Superior Stamina` had both been renamed
upstream, and `Curse` is the top counter for fourteen heroes.

A scheduled job diffs the snapshot daily and opens a PR on any change — new hero, renamed
item, retuned ability. Anything a diff touches is flagged `needs_review` and shows amber in
the UI until a human confirms it.

## Getting started

```bash
npm install
npm run dev
```

Useful scripts:

| Script | Does |
| --- | --- |
| `npm run verify` | typecheck + lint + build — run before pushing |
| `npm run backlog` | regenerate `docs/BACKLOG.md` from `scripts/enhancements.mjs` |
| `npm run seed:issues:dry` | preview the GitHub issues that would be created |
| `npm run seed:issues` | create the labels and issues (needs `gh auth login`) |

## Roadmap

32 enhancements across five epics — see **[docs/BACKLOG.md](docs/BACKLOG.md)**.

The spec for each lives in `scripts/enhancements.mjs`, which is the single source of truth
for both the backlog doc and the GitHub issues. Edit there, run `npm run backlog`, commit.

Rough order: foundation (design profile + data pipeline) → core UX (team builder) →
distribution (SEO and sharing) → quality → advanced.

## Design

The design profile lives in [docs/DESIGN.md](docs/DESIGN.md) (see E02) and is implemented as
tokens, not prose. The brief is specific: this tool is glanced at for a few seconds mid-match,
in a dark room, often on a second monitor. Dark-first, dense, scannable, and never encoding
meaning in colour alone.

## Credits

- Game data and art: [Deadlock API](https://deadlock-api.com/) /
  [deadlock-api-assets](https://github.com/deadlock-api/deadlock-api-assets)
- Community reference: [deadlock.wiki](https://deadlock.wiki)
