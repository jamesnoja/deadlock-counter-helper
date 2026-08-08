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
| **B — Overlay** | `ability -> threat tags` and `item -> counter tags`, keyed on `class_name` | Hand-curated. The only file a human edits per patch. |
| **C — Derivation** | Pure function joining A and B into ranked recommendations | Code |

Add a hero upstream and it inherits sensible counters from its ability tags with zero
editorial work. Curation becomes refinement, not authorship.

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

31 enhancements across five epics — see **[docs/BACKLOG.md](docs/BACKLOG.md)**.

The spec for each lives in `scripts/enhancements.mjs`, which is the single source of truth
for both the backlog doc and the GitHub issues. Edit there, run `npm run backlog`, commit.

Rough order: foundation (data pipeline) → core UX (team builder) → distribution (SEO and
sharing) → quality → advanced.

## Credits

- Game data and art: [Deadlock API](https://deadlock-api.com/) /
  [deadlock-api-assets](https://github.com/deadlock-api/deadlock-api-assets)
- Community reference: [deadlock.wiki](https://deadlock.wiki)
