# todo

Running log. Newest task at the bottom.

## 2026-08-08 — E01: project scaffold, CI, and deploy pipeline

### Intent

Close out E01 so every later PR lands against a build that fails loudly, then seed the
32 backlog enhancements as GitHub issues.

### Working parameters — stack translation

`CLAUDE.md` is written against Flutter/Dart. This repo is Next.js 16 / React 19 / TypeScript.
Intent preserved, commands translated:

| CLAUDE.md says | Here it means |
| --- | --- |
| `dart analyze`, `custom_lint`, `riverpod_lint` | `npm run lint` (ESLint + `eslint-config-next`) |
| `flutter test`, goldens in `test/goldens/` | `npm run test` (Vitest). No golden/snapshot suite yet — revisit at E02 when there is UI worth pinning. |
| `dart run build_runner build` | `next typegen` (already wired into `npm run typecheck`) |
| Riverpod-only state management | N/A — no Flutter. State strategy is decided at E09; React Server Components by default, client state only where interaction demands it. |
| `pubspec.yaml` approval gate | `package.json` — no new npm dependency without approval |
| Never hand-edit `*.g.dart` / `*.freezed.dart` | Never hand-edit `next-env.d.ts` or `.next/types/**` |
| Dart naming (`snake_case.dart`) | TS naming: `kebab-case.ts` files, `PascalCase` components/types, `camelCase` members |
| `flutter run` to confirm visual changes | `npm run dev` and view the page |

Unchanged and in force: branch-per-concern, small atomic commits, squash PR, never commit to
`main`, no dead code, error logging to `error_log.md`, 80% coverage minimum on new logic.

### Current state

Done: Next.js 16 + React 19 + Tailwind v4 scaffold, `npm run verify`
(typecheck + lint + build), backlog generator, issue seeder, README.

Missing: no `.github/` at all, no test runner, `noUncheckedIndexedAccess` off,
`src/app/page.tsx` is still the create-next-app template, issues not seeded.

### Plan

Branch: `chore/e01-ci-and-test-harness`

- [x] 1. Cut the branch off `main`.
- [x] 2. Add Vitest per `node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md`:
      `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`,
      `@testing-library/dom`, `vite-tsconfig-paths`, `@vitest/coverage-v8`.
      `vitest.config.mts` with jsdom env and tsconfig path resolution.
      *Dropped `vite-tsconfig-paths` — Vite 7 resolves tsconfig paths natively and warns
      on startup that the plugin is redundant. Six deps, not seven.*
- [x] 3. Add `test` (run-once, for CI) and `test:watch` scripts. Fold `test` into `verify`
      between lint and build, so `verify` = typecheck + lint + test + build per E01's
      acceptance criteria.
- [x] 4. Write one real test, not a placeholder assertion. Target the backlog data model in
      `scripts/enhancements.mjs`: unique IDs, every `depends` entry resolves to a real ID,
      no dependency cycles, every epic and priority key is known. That guards a file we
      actually edit and would otherwise only find broken at seed time.
- [x] 5. Turn on `noUncheckedIndexedAccess` in `tsconfig.json`. Cheap now, expensive at E05
      when the derivation engine is indexing arrays everywhere. Fix any fallout.
      *No fallout — nothing in the repo indexes yet.*
- [x] 6. `.github/workflows/ci.yml` — on push to `main` and all PRs: checkout, Node 22,
      `npm ci`, typecheck, lint, test, build. Concurrency group so superseded runs cancel.
- [x] 7. `.github/dependabot.yml` — weekly npm + github-actions updates, grouped minor/patch
      so it does not open fifteen PRs a week.
- [x] 8. Replace the create-next-app template page with a minimal honest placeholder naming
      the project and linking the backlog. Not a design pass — E02 owns that. This only
      removes the template so the CI build is testing our code.
      *Also removed the five unreferenced template SVGs in `public/`.*
- [x] 9. Seed `error_log.md` with the format header from CLAUDE.md rule 2.
- [x] 10. Run `npm run verify` locally; confirm green.
- [x] 11. Push, open PR, confirm CI passes on the PR itself. → PR #33, green in 38s.
- [x] 12. ~~After merge: seed issues.~~ **Already seeded** — all 32 issues (#1–#32) exist in
      the repo. My earlier claim that they were unseeded was wrong; I inferred it from the
      absence of local state instead of asking GitHub.
- [x] 13. Write the review section below.

### Follow-ups (not this PR)

- [ ] Coverage thresholds at E05, when `deriveCounters` makes the number meaningful.
- [ ] Snapshot/golden tests at E02, when there is UI worth pinning.
- [ ] Vercel preview deploys — owner action, vercel.com/new.

### Needs a decision from you

1. **New dependencies** (CLAUDE.md rule 4). Step 2 adds seven devDependencies. All are the
   Next.js-documented Vitest setup plus the coverage reporter needed for the 80% rule.
   Approve?
2. **Vercel.** E01 wants preview deploys per PR. That is a dashboard action I cannot do —
   you connect the repo at vercel.com/new. I can add `vercel.json` if we need build config,
   but the default Next.js preset likely needs nothing. Want me to leave it to you?
3. **Branch protection on `main`.** "A PR that breaks types or lint cannot be merged" needs
   a required status check, configured in repo settings. I can set it with
   `gh api` once CI has run at least once and the check name exists. Want that?
4. **Issue seeding timing.** Plan has it after the E01 PR merges. Say the word if you want
   the issues up front instead.

### Review

**PR #33** — `chore/e01-ci-and-test-harness`, five commits, CI green.

What landed:

1. **Vitest harness** (`vitest.config.mts`, jsdom, native tsconfig path resolution).
   `test` / `test:watch` / `test:coverage` scripts; `verify` is now typecheck + lint +
   test + build, satisfying E01's acceptance criterion.
2. **`scripts/enhancements.test.mts`** — 10 assertions over the backlog data model.
   Chose this over a placeholder because the backlog file is edited on every enhancement
   and its failure mode (a dangling `depends`) otherwise appears at seed time against the
   live repo.
3. **`noUncheckedIndexedAccess`** enabled.
4. **CI** (`.github/workflows/ci.yml`) — four named steps so a red X names its stage.
   Concurrency cancellation. Runs 38s.
5. **Dependabot** — weekly, minor/patch grouped, majors individual.
6. **Template page removed**, metadata fixed, five orphan SVGs deleted.
7. **`todo.md`, `error_log.md`** created per the working parameters.

Repo settings applied outside the diff:

- Branch protection on `main`: required status check `typecheck / lint / test / build`,
  strict (branch must be current), linear history required, force pushes and deletions
  blocked, **`enforce_admins: true`** — so a red build blocks the owner too. That is what
  E01's "cannot be merged" asks for. Flip it in Settings → Branches if it becomes
  obstructive.
- Merge method restricted to squash; branches auto-delete on merge. Both implement rules
  already written in `CLAUDE.md`.

Deviations from plan, all noted above: one fewer dependency than approved, coverage
thresholds deferred with a rationale comment, issues turned out to be already seeded.

Not done, owner action: Vercel preview deploys.

## 2026-08-08 — Housekeeping: Node pinning and dependency majors

### Intent

Align Node across local / CI / Vercel, then clear the five open Dependabot PRs before
starting feature work. Cheap now; much more annoying to debug mid-E03.

### Findings

- `typescript@7.0.2` and `eslint@10.8.1` are both `latest`, not prereleases. TS 7 is the
  native (Go) compiler rewrite, so peer ranges being satisfied proves nothing — test it.
- `eslint-config-next@16.3.0` peers: `eslint >=9.0.0`, `typescript >=3.3.1`. Both majors
  are permitted.
- **Dependabot #37 is wrong for us.** `@types/node` majors track the Node *runtime*, and
  26.x describes APIs Node 24 does not have. Typecheck would go green on code that throws
  in production. We want `^24` while we run Node 24.

### Plan

One concern per branch. Riskiest last.

- [x] 1. `chore/pin-node-24` — `engines.node`, `.nvmrc`, CI `node-version` 22 -> 24.
      → **PR #39**, green. CI reads `.nvmrc` via `node-version-file` rather than repeating
      the number.
- [x] 2. Dependabot #34 / #35 — `actions/checkout` and `actions/setup-node` 5 -> 7.
      Mechanical, CI green on both. *Awaiting merge — see note below.*
- [x] 3. `chore/constrain-dependency-majors` — `@types/node` to `^24` plus Dependabot
      `ignore` rules. → **PR #41**, green.
- [x] 4. Dependabot #38 — `eslint` 9 -> 10. **Rejected.** Breaks lint outright.
- [x] 5. Dependabot #36 — `typescript` 5 -> 7. **Rejected.** Typecheck and build pass;
      lint dies.
- [x] 6. Unplanned: `chore/lint-ignore-coverage-output` → **PR #40**. `npm run test:coverage`
      left `coverage/` being linted; flat config does not read `.gitignore`.
- [x] 7. Review section.

**Blocked:** I cannot merge PRs — the action is denied by the harness permission
classifier. All four PRs are green and waiting on the owner.

### Review

Four PRs, all green, all awaiting owner merge.

| PR | What | Notes |
| --- | --- | --- |
| #39 | Pin Node 24 across local / CI / Vercel | `.nvmrc` is the single source; CI reads it via `node-version-file`, Vercel via `engines` |
| #40 | Exclude `coverage/` from linting | Unplanned; found while verifying #39 |
| #41 | `@types/node` -> `^24`, Dependabot majors constrained | Supersedes #37 |
| #34, #35 | `actions/checkout` and `actions/setup-node` 5 -> 7 | Dependabot's own, mechanical |

**Two majors tested and rejected.** Both fail for the same underlying reason —
`eslint-config-next@16.3.0` bundles plugins that have not caught up:

- **typescript 7.0.2** — `typescript-eslint` refuses to load. Notable that typecheck and
  build both pass under the native compiler; only lint breaks. Tracking:
  typescript-eslint#10940.
- **eslint 10.8.0** — `eslint-plugin-react@7.37.5` calls a rule-context API ESLint 10
  removed, so every React rule throws on load, on real source files.

Both are worth retrying when Next bumps its bundled plugins. The Dependabot `ignore`
entries carry the reason and the unblock condition so this is not re-litigated from
scratch.

**`@types/node` was quietly wrong before Dependabot touched it.** The scaffold pinned
`^20` while local Node was 24. Dependabot proposed 26, which would have been wrong in the
other direction. Now `^24`, matching the runtime.

**Process notes:**

- Vercel preview deploys confirmed working — every PR above got one.
- I could not merge anything; the harness denies the action. Worth knowing for future
  sessions: plan on handing merges back rather than assuming an end-to-end flow.
- This log entry rides along on #41 rather than getting its own PR. Slight bend of
  one-concern-per-branch, in exchange for not opening a fifth PR to record the other four.

## 2026-08-08 — Backlog status tracking + E03 assets sync pipeline

### Intent

Add a completion marker to the backlog so finished work stops reading as outstanding, then
build the Deadlock assets sync pipeline (E03).

### API reconnaissance (done before planning)

Probed `api.deadlock-api.com` live. Everything E03 assumes exists, plus some numbers that
change downstream issues:

| Finding | Consequence |
| --- | --- |
| `/v1/assets/heroes` returns 38 heroes; all pass `player_selectable && !disabled && !in_development` | The filter is real but currently a no-op. Still implement it — it is the thing that keeps an unreleased hero out of the UI on patch day. |
| `/v1/assets/items` returns 726: 251 `upgrade`, 389 `ability`, 86 `weapon` | Only upgrades are counter-items. |
| **173** upgrades are `shopable && !disabled` | That is the real counter-item universe, not 251. |
| **15 of those 173 have no `image`/`image_webp`** | E12's "local fallback placeholder" is not hypothetical — it is needed on day one. |
| Upgrades expose `cost`, `item_tier` (1-5), `item_slot_type` (weapon/spirit/vitality) | E13 is fully satisfied by the snapshot. Note tiers run **1-5**, not 1-4. |
| Abilities link to heroes via `heroes: number[]`; 285 of 389 are hero-linked | The other 104 are NPC/creep abilities. Walk `hero.items.signature1..N` instead — cleaner and avoids the junk. |
| `/v1/patches` returns 20 entries; latest `06-30-2026 Update`, `pub_date 2026-07-28` | Gives E07 its "synced from patch X" stamp. |
| `/v1/assets/client-versions` returns build numbers | Second provenance signal. |

### Part A — backlog status tracking

- [ ] A1. Add an optional `status` field (`done` | `in-progress`) to entries in
      `scripts/enhancements.mjs`. Absent means not started.
- [ ] A2. `render-backlog.mjs`: Status column in the index, and a status line per entry.
- [ ] A3. Extend `enhancements.test.mts` to reject unknown status values.
- [ ] A4. Mark E01 `done`, E03 `in-progress`. Regenerate `docs/BACKLOG.md`.
- [ ] A5. Close issue #1 with a pointer to PR #33.

### Part B — E03 assets sync pipeline

- [ ] B1. `src/data/schema.ts` — typed shapes plus the tag-free normalised model.
      Everything keyed on `class_name`; `id` kept only for resolving `heroes[]` references.
- [ ] B2. `scripts/sync.mjs` — fetch heroes, items, patches, client-versions.
      Fetch heroes **unfiltered** and apply our own filter, so exclusions are visible and
      testable rather than delegated to a query param.
- [ ] B3. Normalise to a lean projection. The raw items payload is 5.7 MB; we keep only
      fields the product uses. A field we later need is one re-sync away, whereas an
      unreadable 6 MB diff makes E06's review PR useless.
- [ ] B4. Write `data/snapshot/{heroes,items,abilities}.json` + `meta.json`.
      Deterministic: arrays sorted by `class_name`, object keys sorted, stable formatting.
- [ ] B5. **Timestamp churn guard.** `meta.json` carries a `content_hash`. `synced_at`
      only advances when the hash changes. Without this, E06's daily job opens a PR every
      single day whose only diff is a timestamp, and people stop reading them.
- [ ] B6. `npm run sync` script. Build reads the committed snapshot only — never network.
- [ ] B7. Tests: snapshot validates against the schema; `class_name` unique; every ability
      referenced by a hero resolves; no entity keyed on display name; filter excludes what
      it should. Normalisation is a pure function tested against a fixture.
- [ ] B8. Verify, PR.

### Corrections to the reconnaissance above

Two numbers in that table were measured against `?only_active=true` and are wrong:

- **The hero filter is not a no-op.** Unfiltered, `/v1/assets/heroes` returns **57**, of
  which 38 are playable. 19 unreleased or disabled heroes are excluded by our own filter.
- **No item is actually missing artwork.** 15 upgrades lack `image`/`image_webp`, but all
  15 carry `shop_image`. The normaliser keeps both, so coverage is complete and E12's
  placeholder is a genuine edge case rather than a day-one requirement.

### Decisions I want confirmed

1. **Lean projection vs full payload** (B3). I want to store only what the product uses.
   Costs a re-sync if we later need a dropped field; buys reviewable diffs forever.
2. **Snapshot committed to git** — the backlog says so, and it makes builds reproducible
   and immune to upstream downtime. Confirming because it does mean data in the repo.
3. **Weapons excluded.** 86 `type: weapon` entries are hero primaries, not shop items.
   Not counter-items. Say if you want them anyway.

### Review

**PR #42** (status tracking) merged. **PR for E03** covers the pipeline.

Part A shipped a `status` field rendered as a checkbox column, plus two tested invariants:
`docs/BACKLOG.md` must match its generator, and nothing can be `done` while a dependency
is not. Issue #1 closed.

Part B — E03, five commits:

| Layer | File | Role |
| --- | --- | --- |
| Upstream boundary | `src/data/upstream.ts` | API payload shapes. The only file an upstream change should touch. |
| Our model | `src/data/schema.ts` | Normalised types, all keyed on `class_name`. |
| Transform | `src/data/normalise.ts` | Pure, no I/O, 20 unit tests. |
| I/O | `scripts/sync.mts` | Fetch, hash, write. The only thing that talks to the network. |
| App access | `src/data/snapshot.ts` | Reads committed files. 12 integrity tests over the real snapshot. |

Snapshot: 38 heroes, 152 abilities, 173 items, 429 KB. Re-running `npm run sync` against
unchanged upstream produces byte-identical files.

**Written in TypeScript and run by Node 24 directly.** Native type stripping means the
pipeline shares types with the app with no build step and no new dependency. This is the
first thing in the repo to depend on the Node 24 pin from #39 being real.

**`"type": "module"` added to package.json.** Everything here was already ESM; Node was
warning on every sync run.

**Findings that change later issues:**

1. **26 of 38 heroes have a `class_name` unrelated to their display name.** Abrams is
   `hero_atlas`, Paige is `hero_bookworm`, Paradox is `hero_chrono`. The backlog says slugs
   derive from `class_name`, which the code now does — but that produces `/counter/atlas`
   for a page meant to rank for "how to counter abrams". E21's whole premise is those 38
   landing pages ranking. **E20 and E21 need a decision** and I would not build them on the
   current slug without one.
2. Live tier spread is 1:23, 2:43, 3:46, 4:44, 5:17 across 173 items — not the 251-item
   spread quoted earlier. E15's slot-economy caps should use these.
3. Every hero has exactly four signature abilities, so E17's per-ability granularity has a
   uniform shape to build against.

### Follow-ups

- [ ] Decide hero slug strategy before E20/E21 (see finding 1).
- [ ] E06 will add the scheduled job; the content hash is already in place for it.

## 2026-08-08 — E02: design profile and token system

### Intent

Implement the uploaded "Up Inspired" design spec, with primary swapped from `#ff7a64` to
`#69e799`, adapted to a Deadlock counter tool and to E02's accessibility bar.

### Source and adaptation

Spec: `C:\Users\james\iCloudDrive\cc\filing-cabinet\deadlock\up\DESIGN.md`. It describes a
banking app, so several tokens have no counterpart here and are translated rather than
copied:

| Up spec | Here |
| --- | --- |
| `balance-hero` (64px tabular money) | Coverage count — "answers 5 of 6" is our hero number |
| `transaction-row` | Item card |
| `emoji-avatar` | Hero portrait / item icon in the same circular slot. Real game art from E12 beats emoji, so the geometry is kept and the emoji is not. |
| Saver accent palette (swappable) | Item category accents (weapon / vitality / spirit) |
| `money-in` / `money-out` | Counter strength and threat severity |
| `up.` wordmark | Not applicable — do not imply a brand that is not ours |

### Decisions taken (confirmed with owner)

1. **Two greens, clearly separated.** Brand mint `#69e799` stays the voltage and marks a
   hard counter. Provenance-verified gets deep emerald `#1f9d55` — measured 2.24:1 apart
   in luminance, and AA on both dark surfaces (5.52:1 canvas, 4.87:1 card). The obvious
   candidate `#2ecc71` from the spec was rejected at 1.35:1 from the brand: same colour at
   a glance.
2. **Gradient re-derived around green** — mint -> teal -> deep green. Header only, never
   behind body text.
3. **Comfortable default, compact opt-in.** Up's generous spacing is the default; a
   `data-density="compact"` switch tightens it, feeding E27.

### Forced by accessibility, not a preference

`on-primary: #ffffff` fails at **1.56:1** on `#69e799`. Dark ink gives 11.18:1. Note the
spec was already non-compliant here — white on the original coral was 2.55:1, also under
the 4.5 AA floor. E02 requires verified pairs, so this is fixed rather than inherited.

### Plan

- [ ] 1. `docs/DESIGN.md` — positioning, usage context, principles, full token rationale,
      and an explicit record of where we diverge from the source spec and why.
- [ ] 2. `src/app/globals.css` — every token as a CSS custom property, wired into the
      Tailwind v4 theme. Dark default, documented light mode, density switch.
- [ ] 3. `src/design/tokens.ts` — token metadata (name, value, intended background) so the
      styleguide and the contrast test read from one source rather than duplicating hexes.
- [ ] 4. Primitives: hero chip, item card, threat tag, coverage badge, provenance dot,
      accordion, slot, empty state, skeleton.
- [ ] 5. `/styleguide` route rendering every token and primitive, light and dark, both
      densities.
- [ ] 6. `src/design/contrast.test.ts` — every semantic pair asserted at WCAG AA, so a
      token edit cannot silently break contrast. Runs in CI via `npm run test`.
- [ ] 7. ESLint rule rejecting raw hex, px font sizes, and spacing literals in components.
- [x] 8. Verify, PR.

All eight done. 67 tests green.

### Review

**What shipped**

`docs/DESIGN.md` (positioning, usage context, five principles, full rationale, and an
explicit divergence table), tokens as CSS custom properties wired into Tailwind v4,
`src/design/tokens.ts` as the machine-readable mirror, ten primitives, `/styleguide`, 24
contrast assertions, and the raw-value lint rule.

**Three defects the work surfaced, all fixed**

1. `on-primary: #ffffff` on the mint is **1.56:1**. Now near-black at 11.03:1. The source
   spec was already failing here at 2.55:1 on its coral, so this was a pre-existing bug
   inherited with the spec rather than one the colour swap introduced.
2. `--brand-deep` at `#2fb56b` was **2.64:1** on white — caught by the test as I wrote it,
   not by eye. Now `#158048` at 4.98:1, which also lets it carry white text in light mode.
3. A long item name collided with the strength label, because that label could shrink.
   Caught only by loading the page — the tests were green throughout. Worth remembering:
   the visual check in the working parameters earns its place.

**Verification of the lint rule.** Ran it against a deliberate violation file to confirm it
fires on all three shapes (raw hex, px literal, Tailwind arbitrary value) rather than
passing silently. Removed the probe afterwards.

**Divergences from the uploaded spec** are recorded in `docs/DESIGN.md` with reasons — the
banking-specific pieces (balance hero, savers, money in/out, emoji primitive, `up.`
wordmark) are translated rather than copied, and the wordmark is dropped outright because
we must not imply a brand that is not ours.

### Follow-ups

- [ ] Hero slug decision still open from E03, and it now blocks E20/E21.
- [ ] Snapshot/golden tests for primitives — deferred at E01, now has UI worth pinning.
- [x] ~~E27 wires `?compact=1` to the density switch.~~ **Compact removed on request.** One
      spacing scale ships instead. E27's spec updated: `?compact=1` changes layout (columns,
      what collapses) rather than swapping spacing tokens, so the backlog no longer points
      at a switch that does not exist.

## 2026-08-08 — E04: threat-tag overlay schema

### Intent

Layer B: the hand-curated mapping from ability -> threat tags and item -> counter tags,
keyed on `class_name`. This is the file a human edits per patch; everything else derives.

### Plan

- [x] 1. `src/data/tags.ts` — 12-tag vocabulary as a union, counter strengths, review states.
- [x] 2. `data/overlay/{ability-threats,item-counters}.ts` — the curated layer.
- [x] 3. `scripts/scaffold-overlay.mts` — additive-only generator, round-trip stable.
- [x] 4. `src/data/overlay.ts` — typed joins and coverage reporting.
- [x] 5. Tests for every E04 acceptance criterion.
- [x] 6. Verify, PR.

### Decisions

**TypeScript, not YAML.** The acceptance criterion is "a typo fails the build". The tag
union delivers that at typecheck with no dependency; YAML needs a parser (a rule-4 approval)
plus runtime validation to reach the same place. E04's spec text updated to match.

**Scaffold is additive and round-tripping.** It reads existing entries back and re-emits
them unchanged, only adding what is missing. Curation can never be overwritten by a re-run,
which is what makes it safe to run after every sync. Verified by running it twice and
confirming an empty diff. Cost: comments do not survive, so entries carry a `note` field.

**`review: 'suggested'` on everything.** See the honesty note below.

### The honest state of the data

The schema is done. **The curation is not, and I am not the right author for it.**

Tags were derived mechanically from the game's own description text by conservative keyword
rules — not from knowledge of how these matchups actually play. Every entry is marked
`review: 'suggested'` for exactly that reason. Coverage:

| | Total | Tagged | Untagged | Confirmed by a human |
| --- | --- | --- | --- | --- |
| Abilities | 152 | 101 | 51 | 0 |
| Items | 173 | 49 | 124 | 0 |

Items are much weaker because 32 have no description at all, and item text usually says what
an item *does*, not what it *answers*.

I dropped the `burst_spirit` and `high_dps_gun` auto-rules after an early run tagged 52
abilities `burst_spirit` off the phrase "spirit damage" — which nearly every ability
contains, and which does not mean burst. A wrong tag is worse than a missing one: the
missing one shows up in the coverage report, the wrong one becomes confident bad advice.

Coverage numbers are asserted as ratchets so curation cannot silently regress.

### Review

**Five commits.** 84 tests green.

One hero, `hero_mirage`, currently has no tagged ability at all, so E05 would return nothing
for it. Guarded by a test that stops the count growing.

### Follow-ups

- [ ] Human curation pass — flip entries to `review: 'curated'`, starting with the heroes
      people actually look up.
- [ ] Hero slug decision, still open from E03, still blocking E20/E21.

## 2026-08-08 — E05: counter derivation engine

### Intent

Layer C. `deriveCounters(heroes, context) -> RankedCounter[]` — pure, deterministic, joining
ability threat tags to item counter tags and ranking the result.

### Plan

- [ ] 1. Threat severity weights in `tags.ts` — the last editorial judgement the engine needs.
- [ ] 2. `data/overlay/overrides.ts` — the editorial escape hatch, `reason` required.
- [ ] 3. `src/data/derive.ts` — pure function, data injected rather than imported, so tests
      run against fixtures and not the live snapshot.
- [ ] 4. Tests: determinism, stable tie-breaks, coverage counting, override precedence, and
      the acceptance criterion that a new tagged hero produces counters with no other change.
- [x] 1. Threat severity weights in `tags.ts`.
- [x] 2. `data/overlay/overrides.ts`, `reason` required by the type.
- [x] 3. `src/data/derive.ts` pure engine + `src/data/counters.ts` bound to real data.
- [x] 4. 21 unit tests on fixtures, 8 integration tests on the real snapshot.
- [x] 5. Sanity-checked against a real comp.
- [x] 6. Verify, PR.

### Review

121 tests green.

**Scoring.** For each answered tag: `enemies presenting it × counter strength × tag severity`,
summed across tags. Summing rather than taking the best single tag is deliberate — an item
answering two different threats across a team really is more useful than one answering a
single threat, and the shortlist should say so.

**Determinism** is enforced by a three-key sort: score, then coverage size, then `class_name`.
The last key guarantees a total order, so output cannot depend on the order items or heroes
arrived in. Both are tested by reversing the inputs.

**Two editorial judgements**, both isolated so the argument happens in one place:

- `THREAT_SEVERITY` in `tags.ts` — how much each threat hurts unanswered, 1–3. This drives
  ranking order more than anything else in the repo.
- `STRENGTH_WEIGHT` — hard 3, soft 2, situational 1.

**Overrides** carry a required `reason`. The file ships empty on purpose: the tags are still
unconfirmed, so overriding them now would be correcting one guess with another. Exclusion
beats a contradictory include — a contradictory pair is a curation mistake, and refusing to
show a banned item is the safer failure.

**Real output, six-hero comp** (Abrams, Bebop, Lady Geist, Haze, Infernus, Wraith):

```
63  Cursed Relic          5/6  hard         channeled_ult+hard_cc
45  Counterspell          5/6  hard         burst_spirit+hard_cc
42  Celestial Blessing    4/6  hard         dot_debuff+hard_cc
36  Cloak of Opportunity  4/6  hard         hard_cc
28  Debuff Reducer        4/6  soft         dot_debuff+hard_cc
```

Every hero in the snapshot returns at least one counter, asserted by test.

**What the sanity check exposed about the data, not the engine.** Unstoppable ranks 7th at
`situational`, because the scaffold defaulted its strength. It is one of the game's premier
CC-immunity items and should almost certainly be `hard` for `hard_cc`. The engine ranked the
data it was given correctly — this is a curation fix, and a good example of why every entry
is still `review: "suggested"`.

### Follow-ups

- [ ] Curation pass, now with visible consequences: strength values directly move the ranking.
- [ ] E10 truncates the shortlist; the engine returns all 58 matching items by design.

## 2026-08-08 — E06: patch-diff detection and needs-review flagging

### Intent

Find out a patch landed before our users do, and mark what it touched as unreviewed.

### Plan

- [x] 1. `src/data/diff.ts` — pure snapshot comparison.
- [x] 2. `data/snapshot/changes.json` — written by the sync.
- [x] 3. `src/data/provenance.ts` — `needsReview(class_name)` for E07.
- [x] 4. `.github/workflows/sync.yml` — daily, PR only when content moved.
- [x] 5. Tests, including the simulated-upstream-change criterion.
- [x] 6. Verify, PR.

### Review

138 tests green.

**The diff answers one question:** which curated decisions might this patch have invalidated?
Not "what bytes moved". So a removal never needs review (it is gone), a rename never needs
review (nothing keys on display name — that is the point of the whole architecture), and a
stat change only counts on an ability carrying overlay tags, because retuning something we
made no claim about invalidates nothing.

**Proved end to end, not only unit tested.** I mutated the committed snapshot to simulate a
patch and ran the real sync. It reported a new hero, a renamed item, a retuned tagged
ability, and two entities flagged for review — then I restored the data.

**A real bug the simulation caught.** The sync decided "unchanged" by comparing against the
hash recorded in `meta.json` — our own bookkeeping. If the committed data ever drifted from
that record, it would report no change while sitting on a real difference. It now hashes the
files actually on disk, so "unchanged" means the bytes are identical.

**The workflow** opens a pull request only when content moved, reuses the day's branch on a
re-run rather than opening a second one, and runs `npm run verify` against the new data
before proposing it.

### Follow-ups

- [ ] E24 turns `changes.json` into a public changelog.
- [ ] The Discord webhook E06 lists as optional is not built.

## 2026-08-08 — E07: patch stamp and provenance UI

### Review

Foundation epic complete. 139 tests green.

`ProvenanceStamp` reads snapshot metadata and the change record — nothing hand-written. The
home page now renders real derived counters with real artwork, so the whole A -> B -> C
pipeline is visible on a page for the first time.

**Deviation from the spec, deliberate.** E07 says "hovering the badge explains the pipeline".
It is a `<details>` disclosure instead. Hover is unreachable by keyboard and on touch, and
the design profile's second principle rules out affordances only some people can use. Same
information, one more click, everyone can get to it.

**Provenance is a shape, not a colour.** Circle for verified, rotated square for needs-review,
each with text. Satisfies "distinguishable without colour vision" without a second mechanism.

**Wording matters here.** Amber says "we have not confirmed this is still right", not "this is
wrong". Those are different claims and the tool should only make the one it can support.

### A data problem found by looking at the rendered page

Item costs are purely a function of tier: 800 / 1600 / 3200 / 6400 / **9999**. The doubling
breaks at tier 5, where 9999 reads as a placeholder rather than a price — 12800 would
continue the pattern. 17 items are affected.

Flagged, not corrected. Guessing a price in a tool built to answer "can I afford this right
now" would be worse than showing the upstream value. A test now pins cost-per-tier so the
anomaly is visible rather than buried. **E14's soul-budget filter needs this settled before
it ships**, since it would mis-filter every tier-5 item.

### Follow-ups

- [ ] Resolve the tier-5 cost placeholder before E14.
- [ ] E24 turns `changes.json` into a public changelog; the stamp will link to it.

## 2026-08-08 — Exclude non-ranked items from recommendations

Owner confirmed 6400 souls is the ranked ceiling; anything dearer is mode-restricted or not
yet live. 17 items at 9999, all tier 5.

Excluded from recommendations, **kept in the snapshot**. `Item.ranked` is the flag,
`RANKED_ITEMS` is what the engine draws from, `NON_RANKED_ITEMS` keeps them reachable, and
`/admin/untagged` lists them so the exclusion is visible and reversible rather than a silent
filter someone rediscovers in six months.

Two of them — Celestial Blessing and Cloak of Opportunity — were in the top four of the
sample shortlist, so this materially changes what the tool recommends. Counterspell and
Cursed Relic now lead.

Coverage recalculated over ranked items only: 51 of 156 tagged. The earlier 58 of 173
included items nobody can buy.

This also resolves the E07 follow-up: the tier-5 price was never a price, so E14's budget
filter has nothing left to settle.

## 2026-08-08 — E08 and E09: hero picker and team builder

### Review

The site is usable. Pick heroes, get counters. 161 tests.

**E08.** Real buttons with `aria-pressed`, a labelled group, roving tabindex, and arrow keys
that measure the column count from the rendered layout rather than assuming one — the grid
wraps responsively, so a hardcoded count would send Up and Down to the wrong row at some
widths. Search is pure and tested against the real roster; the three cases E08 names each
break naive matching differently, and "doorman" only resolves because the alias survived the
slug change.

Two defects found and fixed rather than suppressed: clamping the roving index in an effect
cascaded a render (now clamped during render), and `aria-pressed` is invalid on
`role="gridcell"`, which would have cost the one attribute that communicates selection.

**Not done: axe.** E08's second criterion is an axe pass. That needs a devDependency, which
is gated, and E25 already owns wiring axe into CI. Manual equivalent done; no axe pass
claimed.

**E09.** Six explicit slots, always rendered — a bar that grows from nothing hides how many
picks are left. Sticky, so the lineup stays visible against the results that came from it.
The whole filled slot is the clear control rather than a small ×, which is a poor target
mid-match. At six, remaining chips disable **and** a visible line explains why; the original
site disabled silently.

Verified in a browser end to end: `/` → search → Enter → Enter selects; six picks trigger the
cap message; scrolling keeps the bar pinned; clearing a slot restores the empty outline,
re-enables the chip, and recomputes from 36 counters to 35.

### Follow-ups

- [ ] E20 moves selection into the URL. State is deliberately in-memory until then.
- [ ] E10 replaces the flat card list with the coverage matrix.

## 2026-08-08 — E10 and E11: coverage matrix and the two lenses

### Review

Shipped together in one PR. They are genuinely coupled: E11 is a toggle between two lenses,
and shipping E10 alone would have meant a toggle with one option. Noted as a deliberate bend
of one-concern-per-branch rather than an oversight.

**E10 — the coverage matrix.** Fixed columns shared by every row, which is what lets the
table be read down a column ("what answers Abrams?") as well as across. Four states, each
with its own glyph as well as a tint, so the grid survives greyscale — it matters more here
than anywhere else in the product, since the whole thing is small coloured marks. Category
chips carry live counts, and a filter box narrows by name.

**E11 — two lenses over one result set.** Both read the same `deriveCounters` output and
neither re-ranks; two lenses disagreeing about what matters would be worse than having one.
The heroes lens splits each hero's answers into core and situational using the derived
per-pair strength, shows role and counter count, and keeps an "all threats combined" strip
so the aggregate is never more than a glance away. Clicking a coverage cell in the items lens
switches lens and focuses that hero — the bridge between the two views.

**Two legibility defects found by looking at the rendered page, not by tests:**

1. Table auto-layout starved the purpose column to three words — "A parry that negates
   the…" identifies nothing. Explicit column widths, and three lines instead of two.
2. Item tiles in the heroes lens were 5rem wide, so every label read "COUNTER…",
   "CURSED R…", "DEBUFF R…". Widened to 7rem with two-line names.

Neither was catchable by a test. The visual-confirmation rule keeps paying.

### Follow-ups

- [ ] E33 adds the three core/flexible cards above the shortlist.
- [ ] E34 adds the item detail panel; `perHero` already carries what it needs.

## 2026-08-08 — Align the counters table with the design guide

Owner: reformat the table to match the design guide, and give the heroes lens one hero
per row.

**The table was violating the guide in a specific, checkable way.** It was built on
`border-b border-hairline` between rows, and `docs/DESIGN.md` says plainly that depth comes
from layered charcoal and soft shadows, *not* hairlines — and that a square corner reads as
third-party. Rows are now rounded surfaces floating on the canvas, using `border-separate`
with row spacing rather than `border-collapse`; rounding sits on the end cells, since
border-separate leaves no row box to round.

Also brought into line: item names at `text-heading` rather than caption (bold is the
brand), category as a pill tag, cost in tabular figures, and the coverage count promoted to
the row's hero number in brand mint — it is the thing you scan the column for.

**Heroes lens is one hero per row.** Two columns squeezed every item grid into half the
width, so four-item rows wrapped into two ragged lines and no two heroes' grids lined up,
which defeats comparing them. Each row now has a fixed identity rail — portrait, name, role,
counter count — so every hero's items start at the same x.

## 2026-08-08 — E12, E33, E34

### Review

E12 first, deliberately: it changes how every component renders images, so building E33 and
E34 on top of it avoided writing more raw `<img>` tags to migrate later.

**E12 — artwork.** One `GameImage` component instead of nine hand-rolled `<img>` tags.
`next/image` with explicit dimensions so the grid cannot shift, a local placeholder when an
asset 404s, and decorative-by-default alt text — these images sit next to the name they
depict, so repeating it makes a screen reader say everything twice. `next.config.ts` allows
one host by pathname rather than a wildcard, so an upstream change fails loudly.

**E33 — counter plan.** Three cards above the shortlist. One rule, stated once and tested:
*core answers more than half the lineup; flexible answers fewer but decisively.* It slices
the engine's existing order rather than ranking again — a lens, not a second opinion.

**E34 — item detail.** Per-hero effectiveness, derived. Real output for Counterspell:

```
Abrams  ● strong          Answers Abrams's Shoulder Charge and Seismic Impact — Hard CC.
Apollo  ● strong          Answers Apollo's Riposte and Disengaging Sigil — Spirit burst, Hard CC.
Bebop   ● strong          Answers Bebop's Sticky Bomb — Spirit burst.
Billy   · not addressed   Does nothing about Billy.
```

Every selected enemy appears, including the ones the item ignores — omitting them would
leave the reader unsure whether a hero was considered and dismissed or simply forgotten. The
overlay can override any line with authored prose, which renders marked as editorial.

**A defect caught by reading the rendered panel.** Counterspell carries two distinct
properties both labelled "Spirit Power" (20 and 5), and the stats list was keyed on label —
duplicate React keys. Keyed on the upstream property name now.

**A mis-specified dependency, corrected.** E34 listed E17 as a prerequisite. It is not: the
per-hero line names abilities straight from the engine's `perHero` attribution, which E05
already provides. E17 adds ability icons and live numbers *on top of* this panel. Fixed the
spec rather than leaving a dependency that would have blocked the invariant test for no
reason.

## 2026-08-08 — Remaining UX epic (E13–E19, E35)

Eight left. Grouped into four PRs by what they share, rather than one per issue.

1. **E13 + E35** — item metadata and the stat card. Both about what a single item tells you.
2. **E14 + E15** — soul budget and slot economy. Both about affordability and build shape.
3. **E16 + E17** — game phase and ability granularity. Both need an overlay dimension added.
4. **E18 + E19** — your-hero context and chat export.

### Data findings before starting

- **E15's spec assumed a "per-category slot count".** Upstream actually models
  `item_slot_info: { weapon: { max_purchases_for_tier: [6,6,6] }, ... }` — a cap on purchases
  per tier per category, not a flat slot count. Building against the real shape.
- **E16 needs a phase dimension the overlay does not have.** Adding `phases` to item entries
  with a tier-derived default, marked suggested, so curation refines rather than authors.
- **E18 cannot be built in full.** Its redundancy warnings ("your ult already grants CC
  immunity") need to know what an ability *provides*; the overlay only records what an
  ability *threatens*. Role-weighted re-ranking is derivable and will ship; redundancy
  detection needs a new overlay dimension and will be split into a follow-up rather than
  faked.

### Review — remaining UX epic

All fifteen UX enhancements done. 200 tests.

**Architecture that made this cheap.** The engine ranks once against the lineup; the context
filters then narrow or re-weight that single result. Phase, budget and role cannot see each
other and none can change what the engine believes — which is why the three lenses never
disagree about what matters.

**E13/E35.** Category is a glyph *and* a label everywhere, via one `ItemMeta` component
rather than the same markup in four places. Stats are a `<details>` disclosure per row, not
a hover tooltip — hover is unreachable by keyboard and absent on touch.

**E14.** Splits rather than filters: hiding the next tier entirely would answer "what can I
buy" while destroying "what am I saving for".

**E15.** The spec assumed a flat per-category slot count. Upstream models
`max_purchases_for_tier` per category — currently 6 — so it is built against the real shape,
and the opportunity cost of the last pick is stated rather than implied.

**E16.** Phase lives in the overlay, defaulting from tier, so curation refines rather than
authors and switching phase re-ranks rather than changing prose.

**E17.** Per-ability breakdown with live numbers, shown when focused on one hero. An item
appears against an ability only if a tag it answers is one *that ability* presents.

**E18 — partial, and split rather than faked.** Role weighting shipped. Redundancy warnings
did not: they need the overlay to record what an ability *provides*, and it only records what
it *threatens*. New **E36** carries that properly instead of inventing a schema inside a UI
issue. The UI says so on screen rather than implying the feature is complete.

**E19.** Truncates on whole items — a message cut mid-name is worse than a shorter complete
one — and shows the text before you paste it into team chat.

**A bug the tests caught.** With no role affinity, re-sorting still reshuffled equal-scoring
items alphabetically, so picking a hero with an unknown role looked like it had done
something. No opinion now means no reorder.

## 2026-08-08 — E20 and E21: URL state and per-hero pages

### Review

214 tests. 39 static pages plus sitemap and robots.

**E20.** The URL *is* the state. Encoded with hero slugs, because a link is something a person
reads and pastes into chat — `?enemies=abrams,haze` does that and `hero_atlas` does not.
Retired slugs still decode, so links shared before the rename keep working. An unknown slug
costs you one hero, not the whole page.

`replace`, not `push`: every filter tweak would otherwise become a history entry and the back
button would crawl through them instead of leaving the page.

**Decoded on the server**, so a shared link renders its counters in the initial HTML. That
makes the home page dynamic rather than static — a real cost, taken deliberately, because a
shared link that renders nothing until hydration is not worth sharing, and E22's preview
images need the server-rendered markup.

**E21.** 38 hero pages plus alias routes, all static, all server components with no
interactivity — the content must exist with JavaScript off, and a page that ships no client
bundle is also the cheapest thing to serve. Verified by curling the HTML.

Alias URLs resolve *and* carry a canonical link to the primary slug, so `/counter/atlas`
keeps working without competing with `/counter/abrams` for the same query. The sitemap lists
primaries only — 39 entries, generated from the snapshot, so a new hero adds a page and its
entry with no other change.

The ability breakdown is the part worth having: each ability with its icon, live numbers,
threat tags, and the items that answer **that specific ability**, each with a derived line
naming what it stops. Capped at 8 per ability with the remainder stated.

### Two data problems this surfaced

1. **Ability stats were showing upstream's "not applicable" values** — over half of all
   ability stat entries are zero, and `Charge Delay -1` appears 119 times and never at any
   other value. Filtered at *display* time, not in the data, because E06's retune detection
   needs a value moving to zero to stay visible.
2. **A real tagging error, found by reading a public page.** Sleep Dagger was tagged
   `channeled_ult` because its description says it does *not* interrupt enemies' channelling
   — the keyword rule matched the word and missed the negation. Corrected, with the reason in
   the entry. Exactly one ability was affected; I checked the rest rather than assuming.

## 2026-08-08 — Bug: items with no upstream description were never counters

Owner asked why Indomitable never appears. It is in the snapshot, ranked and buyable, but the
overlay had it `untagged`.

**Cause.** The scaffold's keyword rules read only `description`, and upstream ships **no
description at all** for 32 items. Every one of them was marked untagged regardless of what
it does — and the engine skips untagged items. The `class_name` said it plainly the whole
time: `upgrade_auto_cleanse`.

**Fix.** Rules now read description, `class_name` (underscores to spaces so word boundaries
work) and name. The scaffold also re-derives entries a machine produced that nobody has since
touched — still `suggested`, still `untagged`, no note — because when the rules improve those
entries should improve with them. Curated entries, and anything carrying a note, are still
re-emitted byte for byte.

**Three items recovered**, all genuine counters that were invisible:

| Item | class_name | Now answers |
| --- | --- | --- |
| Indomitable | `upgrade_auto_cleanse` | hard CC, damage over time |
| Dispel Magic | `upgrade_reduce_debuff_duration` | hard CC |
| Knockdown | `upgrade_knockdown` | channelled ult |

Knockdown is the item the reference site leads with. Dispel Magic is the rename example in
our own README.

### The bigger problem this exposed

They now appear at ranks 15, 29 and 31 — visible but buried, because **strength defaults to
`situational`** and that is the weakest multiplier in the engine. Across 54 tagged ranked
items: 40 situational, 8 soft, 6 hard. Nearly everything sits at the default.

Strength is the single largest lever on ranking quality and almost none of it is set. Not
guessing at it here — a wrong strength is worse than a missing one, and this is the part that
genuinely needs someone who plays the game.

## 2026-08-08 — First curated entries

Owner confirmed Indomitable, Knockdown and Unstoppable are hard counters. Set, and marked
`review: 'curated'` — a human who plays the game said so, which is what that state is for. It
also freezes them against the scaffold's re-derivation, verified by re-running it: 0
re-derived, diff limited to the three entries.

**The effect is out of proportion to the change**, which is the point about strength being the
biggest lever:

| Item | Before | After |
| --- | --- | --- |
| Unstoppable | 15th (score 6) | **2nd** (score 18) |
| Indomitable | 15th (score 3) | **3rd** (score 9) |
| Knockdown | 31st (score 3) | **8th** (score 9) |

Top six against Haze is now Cursed Relic, Unstoppable, Indomitable, Counterspell, Focus Lens,
Disarming Hex. Three curated entries moved that more than any code change has.

51 tagged ranked items still sit at the default `situational`.

**A correction.** The previous PR's table gave Knockdown's identifier as `upgrade_knockdown`.
It is `upgrade_target_stun` — the rule matched on the item's *name*, not its class_name. I
typed the identifier from memory instead of reading it. The curation script resolves names
against the snapshot rather than trusting a hand-typed one.

**Left alone deliberately.** Knockdown's description says stun duration increases against
airborne targets, which suggests an `airborne` tag. That is a tag change rather than a
strength one, so it is recorded for a deliberate decision instead of slipped in.

## 2026-08-09 — Housekeeping before the strength curation pass

Cleared the small stuff so the curation branch starts from a clean tree.

- [x] Closed #52 (E33) and #53 (E34) — shipped in #61 as `counter-plan.tsx` and
      `item-detail.tsx`, but the issues were never closed.
- [x] Closed #54 (E35) **noting it did not meet its own spec.** The issue asked for a stat
      card on hover and focus; it shipped as a `<details>` disclosure because hover is
      unreachable by keyboard and absent on touch. The capability is there, the trigger is
      not the one specified. Recorded rather than closed silently as done.
- [x] Merged #69 (actions/checkout 5→7). `ci.yml` was already on v7; only `sync.yml` lagged.
- [x] #68 (actions/setup-node 5→7) — merged after dependabot rebased itself; see below.
- [x] Removed `33` and `Echo Shard`, two empty files that entered in #49.
- [x] Committed the three lines npm writes into the lockfile for `engines.node`.

**#68 is blocked on a token scope, not on the change.** It is `MERGEABLE` but `BEHIND`, and
the repo requires branches be up to date. Rebasing it means pushing to
`.github/workflows/sync.yml`, which the local `gh` token cannot do — it has no `workflow`
scope. Repo auto-merge is also disabled, so `--auto` is not available. Asked dependabot to
rebase itself; it needs a manual merge once that lands. Fix for next time is
`gh auth refresh -h github.com -s workflow`.

### A stale file worth flagging

`CLAUDE.md` is Flutter/Riverpod boilerplate on a Next.js project. It mandates `dart analyze`,
`flutter test`, goldens, `build_runner`, and "state management is Riverpod-only". None of it
applies. The real gate is `npm run verify`. Left alone because it is a separate concern from
this branch, but any agent reading it will be told to run commands that do not exist here.
## 2026-08-09 — Strength worklist: make the 37 default-strength items reachable

**Intent.** The curation page can already set strength; it just never shows the items that
need it. Add the missing section so the biggest lever on ranking quality is clickable.

### The problem

`/admin/untagged` filters to `blocked` and `untagged` (`page.tsx:28`). The items that matter
now are `suggested` **with** tags — they have an answer but nobody has judged how strongly it
answers. They are the one bucket the worklist cannot reach, and `CurationList` already has
the strength dropdown, the why field and the paste-ready output. This is a filter, not a
feature.

**37 items, not 51.** The previous entry said 51. That is 54 ranked+tagged minus the 3
curated — *not curated*, which is a different thing from *still situational*. 17 already
carry soft or hard. Corrected here so the next person does not plan against a number that is
40% too big.

### Reach, and why the list is ordered by it

Setting strength on an item answering a tag no hero presents changes nothing. Counting heroes
per tag:

| Tag | Heroes | Tag | Heroes |
| --- | --- | --- | --- |
| `hard_cc` | 27 | `burst_spirit` | 10 |
| `sustain` | 24 | `airborne` | 10 |
| `channeled_ult` | 16 | `summon_pressure` | 6 |
| `displacement` | 15 | `high_dps_gun` | 4 |
| `dot_debuff` | 14 | `stealth` | 4 |
| `zone_denial` | 12 | | |
| `melee_pressure` | 11 | | |

14 of the 37 answer only `high_dps_gun` or `stealth` — a third of the list for a twentieth of
the value. Ordering by reach puts the 14 items covering `hard_cc`, `sustain` and
`channeled_ult` first, so a short session still moves the rankings.

### Plan

- [x] Add `heroesPresentingTag()` to `src/data/overlay.ts` — heroes per threat tag, built on
      the existing `threatsForHero`. Pure, no new data.
- [x] Add `strengthWorklist()` beside `itemCurationQueue()`: ranked items, `bucket ===
      'suggested'`, at least one tag, `strength === 'situational'`, sorted by reach then cost.
- [x] New section on `/admin/untagged` rendering it through the existing `CurationList`.
      No change to that component.
- [x] A stat card for the count, so the number is on screen rather than in a log entry.
- [x] Tests in `src/data/overlay.test.ts` for both functions, including that a curated
      entry leaves the list.
- [x] `npm run verify`, then load the page and confirm the items actually render.

### The list drains correctly — worth stating

`situational` is both "decided: weak" and "nobody looked". The scaffold writes it as the
default, so the value alone cannot tell them apart. Filtering on `bucket === 'suggested'`
rather than on strength is what makes this work: curating anything sets `review: 'curated'`,
which moves it out of the bucket whatever strength is chosen. An item deliberately judged
situational leaves the list. No schema change needed.

### Some of these need a tag fix, not a strength

Flagging before curation starts, because rating these `situational` would bury a wrong answer
rather than remove it:

- **Healing Rite** — tagged `hard_cc`, justified by "Grant Regen and Sprint Speed".
- **Blood Tribute** — tagged `hard_cc` off "Debuff Resistance" in a fire-rate toggle.
- **Crushing Fists** — tagged `hard_cc` + `high_dps_gun` + `melee_pressure`, all three.

`CurationList` already toggles tags, so the same pass can clear them. Not touching them here.

### Out of scope

Knockdown's `airborne` tag, still parked from #67. `CLAUDE.md` being Flutter/Riverpod
boilerplate on a Next.js project — real, but a separate branch.


### Review — strength worklist

Shipped. `/admin/untagged` now leads with the 37 tagged items nobody has judged the strength
of, ordered by reach. 226 tests, verify clean, page confirmed rendering `Showing 37 of 37`
with the new section first and Healing Rite at the top.

**A bug in my own plan, caught before it shipped.** The plan claimed picking any strength —
including `situational` — would mark an entry curated and drain it from the list. That was
false. `CurationList` only emits entries the user *changed*, and selecting `situational` on
an entry already set to `situational` fires no change event. Agreeing with the default was
unexpressible, so every item judged genuinely situational would have reappeared forever —
the exact failure the bucket filter was designed to avoid.

Fixed with a **Confirm as-is** button, shown only where the value under review is already the
one you might pick, and withdrawn the moment an entry is dirty by any other route. The plan
said "no change to `CurationList`"; that was wrong and the component changed.

**Three deviations from the approved plan**, all small, none silent:

| Planned | Done | Why |
| --- | --- | --- |
| Sort by reach then cost | Added `cost?` to `CurationEntry` | The type did not carry cost. Sorting by name instead would have quietly not been the plan. |
| No change to `CurationList` | Added a `confirmable` prop | The list could not otherwise drain. |
| Tests in `overlay.test.ts` | Also a new component test file | The confirm path is client-side; a data test cannot reach it. |

**First component test in the repo.** `@testing-library/react` and jsdom were installed and
unused. Chrome is not on this machine so Playwright could not drive the page, and asserting
on rendered HTML would not have exercised the click — the interaction is the part worth
proving, so it is tested directly, including that the clipboard payload carries
`review: "curated"` with tags and strength intact.

Two things it surfaced: the config does not set `globals`, so testing-library's automatic
cleanup never registers and renders leak between tests (explicit `cleanup()` in this file
rather than changing the suite for one file); and `@testing-library/user-event` is not
installed, so this uses `fireEvent` rather than adding a dependency without asking.

### Follow-ups

- [ ] Curate the 37. Top 14 cover `hard_cc` (27 heroes), `sustain` (24) and `channeled_ult`
      (16); the last 14 answer `high_dps_gun` or `stealth`, which 4 heroes each present.
- [ ] Healing Rite, Blood Tribute and Crushing Fists need their **tags** corrected, not their
      strength. Doing the strength pass first would bury three wrong answers rather than
      remove them.
- [ ] Knockdown's `airborne` tag, still parked from #67.
- [ ] `CLAUDE.md` is Flutter/Riverpod boilerplate on a Next.js project — it mandates
      `dart analyze`, `flutter test` and Riverpod-only state. The real gate is
      `npm run verify`. Separate branch.

## 2026-08-09 — Curation guidance: tag glossary and paste instructions

Owner is about to curate 37 items and asked for three things: the link, an explanation of what
each tag means in game, and where to put the output.

### What changed

- **`THREAT_TAG_MEANINGS`** in `tags.ts` — each tag gets a `covers` and an `excludes`. The
  exclusion is the important half. Every mis-tag currently in the overlay is a boundary
  error, not a comprehension one: `hard_cc` collecting slows is how Healing Rite and Blood
  Tribute ended up answering crowd control they do nothing about.
- **`STRENGTH_MEANINGS`** — hard/soft/situational as a question about outcome, not quality.
  "Is this item good" is what produced an overlay sitting entirely at the default; "does
  buying this change the fight" is answerable.
- **`Glossary`** — collapsed by default, sorted by how many heroes present each tag, showing
  severity and reach so the ordering of the worklist is explicable rather than arbitrary.
- **`PasteInstructions`** — the four steps after the copy button, including the one that was
  only implied: search for the `class_name` and **replace that line**, do not append. The file
  is one line per item and a duplicate key silently wins, which would look like the edit
  worked while doing something else.
- Three tests that a tag cannot enter `THREAT_TAGS` without a meaning, label and severity. A
  missing meaning would render a blank entry and invite guessing.

Placed above the worklist, both collapsed. Someone who has curated before should not have to
scroll past the manual to reach the work.

### Verification

229 tests, verify clean. Page loaded: glossary renders with counts ordered 27, 24, 16, 15;
instructions present; worklist still leads with the 37.

### Follow-ups

- [ ] The three tag corrections are still pending — this branch explains the vocabulary, it
      does not apply it.

## 2026-08-09 — Shop art on the curation worklist

Owner asked for the shop image beside items and abilities. The worklist is scanned visually —
an item is recognised by its art well before its name is read — and 37 rows of text is slow to
work through.

- `CurationEntry` carries `image`, from the existing `itemArtwork()` helper for items
  (`shop_icon` falling back to `icon`) and `ability.icon` for abilities. Reused rather than
  re-derived: #62 already decided shop art is the right source and put that in one place.
- Rendered through `GameImage`, so it inherits the fixed box, the local fallback on a 404 and
  the decorative-by-default alt. Row is now art left, name and description right.
- Two tests that every ranked item and every ability carries art.

**Confirmed it is shop art, not the internal icon.** Healing Rite renders
`items/vitality/healing_rite.webp`, not `mods_armor/stimpak.webp` — the two differ for most
items and the internal one is not what the shop shows. All 173 items have a `shop_icon` and
all 152 abilities an `icon`, so the fallback never fires today; the tests exist so a sync that
drops art fails rather than silently rendering placeholder squares.


## 2026-08-09 — Rework: published counters replace the tag overlay

**Intent.** Stop deriving counters from hand-applied threat tags. Take them from
deadlockitembuilder.com's published counter data, imported with attribution, and retire
Layer B.

**Decision recorded.** I recommended layering the source over derivation rather than
replacing it, and flagged that their prose is authored text. Owner chose replace-entirely and
import-with-attribution. Building that. The trade-offs are real and are written down below so
the cost is visible later, not so the decision gets relitigated.

### What the source has

Extracted from an inline `groupData` / `counterData` block in the page HTML — no API, no auth,
`robots.txt` allows all. Checked against our snapshot:

| | |
| --- | --- |
| Heroes | **38 of our 38.** Only mismatch is their `Holiday` vs our `Holliday` |
| Items | 44 of their 46 resolve; all ranked-buyable |
| Unresolvable | `Curse`, `Superior Stamina` — not in the current snapshot |
| Editorial | 38 summaries, 114 situations, 152 lane tips, why-bullets on all 46 items |
| Vocabulary | 9 answer-side groups, against our 12 threat-side tags |

**A correction while checking this.** Earlier entries and PR #71 say reach is out of 63
heroes. It is **38**. Ordering was unaffected — every reach number was computed from the same
snapshot — but the denominator was wrong wherever it was stated.

### What this costs, recorded now

1. **New heroes return nothing.** Derivation covered every hero the moment its abilities were
   tagged. This model is hand-authored per hero, so hero 39 has no advice until the source
   publishes it. Needs a real empty state, not an empty list.
2. **Keyed on English display names.** Two of 46 items are already stale, which is the exact
   failure the README says the project exists to avoid. Mitigated, not solved, by resolving
   names to `class_name` at import so a rename fails the import loudly.
3. **We inherit someone else's refresh cadence.** If they stop updating, we stop being right,
   and nothing in our own pipeline will notice.

### Plan

Staged so each PR leaves the repo working. Nothing is deleted until its replacement is live.

**Stage 1 — import, no behaviour change**
- [x] `scripts/sync-counters.mts`: fetch page, extract both objects, resolve every hero and
      item name to a `class_name`, write `data/counters/*.json`. Committed, like the snapshot,
      so builds stay reproducible.
- [x] Explicit alias map for `Holiday` → `Holliday`. Unresolved names fail the script with a
      list rather than being dropped.
- [x] Schema + tests: every referenced hero and item resolves, or the build fails.

**Stage 2 — engine**
- [x] New `planCounters(heroes)` returning the existing `RankedCounter` shape, so the
      UI keeps working while the source underneath changes.
- [x] Team ranking: how many selected heroes want an item, then its position in that hero's
      `topCounters`, then group coverage. This is the "shared team counters" behaviour.
- [ ] Decide what happens to budget, phase and role filters — phase derives from tier and
      survives; role weighting reads hero roles and survives; both need re-checking against
      the new ranking rather than assumed.

**Stage 3 — UI and attribution**
- [ ] Surface `summary`, `lanePhase` and `situations` on the per-hero pages. This is the
      content the tag model could never produce and the reason for the change.
- [ ] Attribution: visible credit and link wherever their content renders, plus README. Owner
      chose import-with-attribution, so the credit needs to be prominent and per-view, not a
      line in a footer.

**Stage 4 — retire Layer B**
- [ ] Delete `data/overlay/ability-threats.ts`, `item-counters.ts`, `scaffold-overlay.mts`,
      the whole `/admin/untagged` page and its components, and the tag vocabulary in
      `tags.ts` that nothing else uses.
- [ ] 24 files currently import the overlay or the tag types. Each needs checking, not a
      find-and-replace.

**Out of scope for now.** The 37-item strength worklist and the three tag corrections. Both
are work on a layer being retired — doing them first would be throwing effort away.


### Review — Stage 1

Import lands. 247 tests, verify clean. Nothing consumes the data yet; the engine still runs on
the tag overlay, which is what makes this stage safe to ship on its own.

**Resolving to `class_name` paid for itself immediately.** Both names I flagged as stale are
renames, and the identifier proves it in each case:

| Source name | Snapshot | Evidence |
| --- | --- | --- |
| `Superior Stamina` | Stamina Mastery | `class_name` is still `upgrade_superior_stamina` |
| `Curse` | Cursed Relic (`upgrade_glitch`) | Their "Interrupts, silences, and disarms. Removes buffs." against our "interrupting, Silencing, Disarming ... Removes all non-ultimate buffs" |
| `Holiday` | Holliday | Spelling |

Three aliases and **46 of 46 items and 38 of 38 heroes resolve**. Had we keyed on display
names, `Curse` alone would have silently removed the top counter for fourteen heroes.

**A bug in the source, found by refusing to degrade.** The script would not write, because
`Anti-Heal` does not resolve. It is the display name of their own `anti_heal` *group*, sitting
in `topCounters` for Rem and Silver where an item belongs. There is nothing to alias it to —
picking an item would be inventing advice they never gave — so it is dropped, and the drop is
recorded in the committed meta with the two heroes it shortened. A quietly shorter list looks
exactly like a correct one.

**My earlier reconciliation was incomplete.** When I first compared the two datasets I checked
their item *dictionary* against our snapshot and reported two mismatches. I did not check the
*references*, which is where `Anti-Heal` was. `Extra Stamina` was also referenced for four
heroes without appearing in their dictionary — harmless, since it exists in our snapshot, but I
would not have known either way from what I checked first.

**Design notes.**

- The script fails on the whole batch and prints every unresolved name at once. Fixing renames
  one run at a time would be miserable.
- The two declarations are evaluated in a `node:vm` context with a null prototype and no
  globals, rather than parsing the page or running its script. It needs to read two object
  literals, not execute a page.
- `heroesWithoutCounters()` exists and returns empty today. There is a ratchet test on it, so
  the day Valve ships hero 39 the build fails rather than the site rendering an empty list that
  reads as "nothing counters them".

### Follow-ups

- [ ] `sync.yml` should run `sync:counters` alongside the snapshot sync, and the daily diff
      should flag when the source drifts. Cannot edit that file — the local `gh` token has no
      `workflow` scope.
- [ ] Stage 2: the engine.

### Review — Stage 2

Ranking engine lands. 261 tests, verify clean. Still unconsumed: the UI runs on `derive.ts`
until Stage 3, which is what makes this safe to ship alone.

**One line of the plan was wrong and is not what shipped.** The plan said Stage 2 would return
the existing `RankedCounter` shape so the UI keeps working unchanged. Reading `derive.ts`
properly killed that: `RankedCounter` carries `matches[].tag`, `perHero.abilities` and a
per-item `CounterStrength` — all facts *derivation* produced from ability tags, none of which
the source has. Filling them would mean inventing values to satisfy a type. `planCounters`
returns its own shape, saying only what the source said, and the UI moves in Stage 3.

**The ranking.** Score is the sum of each selected hero's weight for an item. A hero
contributes `(len - index) / len` for its position in that hero's published list, plus 0.5 if
the source names it as the answer to a specific situation. One hero can contribute at most 1
from position, which is the property that keeps breadth dominant — tested directly rather than
assumed.

Checked against real output rather than trusting the tests:

| vs Haze alone | vs a six-hero team |
| --- | --- |
| Indomitable, Metal Skin, Return Fire | **Indomitable 6/6, score 9.0** |
| Matches the source's own worked example | Knockdown 4/6, Spirit Burn 3/6 |

**A correction the sanity check forced.** I had documented the ranking as "breadth first, the
source's own ordering as the tiebreak". It is not. `Reactive Barrier` covers 4 of 6 heroes and
ranks below `Dispel Magic` at 2 of 6, because every hero that wants it wants it *last*. That is
the intended behaviour — first answer against two beats ninth against four — but the comment
described something else. Corrected, and there is now a test asserting the inversion happens,
because a UI showing "4 of 6" below "2 of 6" looks like a bug and someone will need the reason.

**Groups are deliberately not scored.** They describe the kind of answer a hero needs. Treating
group membership as a recommendation would invent per-hero rankings the source never gave, so
they travel as metadata for grouping the shortlist.

**Unavailable heroes are named, not dropped.** `unavailable` carries any selected hero the
source has not written up, and such a hero still gets a `perHero` column at zero weight so the
coverage matrix cannot misalign. "No advice published" and "nothing counters them" are
different claims and the UI has to be able to tell them apart.

### Follow-ups

- [ ] Stage 3: UI and attribution.
- [ ] **Owner asked for a new-hero checklist** — what to do the next time Valve ships a hero.
      Deferred until the whole build is done, then written as a doc.
- [ ] Budget, phase and role filters in `context.ts` still read the overlay. They need
      re-pointing at `SourcedCounter` or retiring; deferred to Stage 3 where the UI decides
      which of them survive.
