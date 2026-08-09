# When Valve ships a new hero

Counter advice is published by a third party, not derived here, so a new hero arrives in two
stages that can be **weeks apart**: it appears in the game's assets immediately, and in the
counter source whenever someone gets round to writing it up.

The repo is built to make that gap visible and safe rather than to hide it. Nothing here is
urgent — the site keeps working throughout.

---

## Stage 1 — the hero appears upstream

`npm run sync` picks it up. The scheduled job runs daily and opens a PR, so usually this
happens without anyone doing anything.

**What you will see.** The sync PR's description flags the hero under *New and uncovered*, and
CI fails with **three** tests:

| Test | File | Saying |
| --- | --- | --- |
| `has no coverage gap nobody has looked at` | `published.test.ts` | A hero has no published advice and nobody has acknowledged it |
| `answers every hero except the gaps we have acknowledged` | `counters.test.ts` | Selecting that hero would return an empty list |
| `agrees with the counts recorded in meta` | `snapshot.test.ts` | Only if the sync half-completed — a clean sync updates the counts itself |

This failure is deliberate. It is the only thing standing between a new hero and a page that
silently says nothing counters them.

**What to do.** Acknowledge the gap. Add the hero's `class_name` to
`data/counters/acknowledged-gaps.json`:

```json
{ "heroes": ["hero_whatever"] }
```

That is the whole fix — one line, one commit, CI green. Do **not** reach for anything cleverer:
the point of the file is that a human decided, in a reviewable commit, that shipping this hero
without counter advice is acceptable for now.

**What the site does meanwhile.** Correctly, and without further work:

- `/counter/<slug>` generates from the snapshot and shows *"No published advice yet … That is not
  the same as nothing countering them"*, with the hero's abilities and stats still listed.
- The hero is pickable in the tool. Selecting it puts a line at the top naming it as having no
  published advice, and it is excluded from the ranking rather than dragging it down.
- Every other hero is unaffected.

---

## Stage 2 — the source writes them up

Check <https://deadlockitembuilder.com/counter-item-helper> now and then. There is no
notification; we follow their cadence.

```bash
npm run sync:counters
```

**If it succeeds**, it prints the new counts and tells you every hero is covered. Then:

1. Remove the hero from `data/counters/acknowledged-gaps.json`.
2. `npm run verify` — the two coverage tests now pass on their own.
3. Check `/counter/<slug>` in a browser. Tests prove the data is wired; they do not prove the
   page reads well.
4. Commit both the regenerated `published.json` and the emptied gaps file together.

**If it fails**, it will be one of two things, and it fails without writing anything.

### "N name(s) in the source do not resolve against the snapshot"

A display name in their data has no match in ours. Almost always a rename — new heroes ship
alongside new items, and their write-up may use an older name.

Find the real identity by `class_name`, not by guessing from the name. `Superior Stamina` was
found because the snapshot entry still read `upgrade_superior_stamina`; `Curse` was found
because our description of `upgrade_glitch` matched theirs almost word for word.

Add it to `ALIASES` in `scripts/sync-counters.mts` **with its evidence** — the field is
required, and a mapping without reasoning is indistinguishable from a guess six months later.

### "no inline script carrying groupData and counterData"

They restructured their page. The extractor reads two object literals out of an inline
`<script>`; if that shape changed, the script needs revisiting rather than patching. Nothing is
written, so the committed data stays valid while you work it out.

---

## What you never have to do

Worth stating, because the repo used to work the other way and the old instructions are wrong:

- **No tagging.** There are no threat tags, no ability tagging, no item strengths, no curation
  page. That whole layer was retired.
- **No editing `data/counters/published.json` by hand.** It is generated. Fix the source data or
  the alias table.
- **No touching the hero page, the picker, the sitemap or the routes.** All generate from the
  snapshot.

---

## If the source never covers them

A permanent entry in `acknowledged-gaps.json` is a supported state, not a failure — the hero
keeps its page, its abilities and its empty state.

But if it happens to several heroes, that is a signal about the source rather than about any
one hero, and the honest options are to find a second source, write those heroes up yourselves
under a clearly-marked authored layer, or say so on the page. Do not let a growing gaps file
become the answer by default.
