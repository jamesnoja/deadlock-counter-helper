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
