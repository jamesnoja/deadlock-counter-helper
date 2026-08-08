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
