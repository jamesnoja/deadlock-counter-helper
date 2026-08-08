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

- [ ] 1. Cut the branch off `main`.
- [ ] 2. Add Vitest per `node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md`:
      `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`,
      `@testing-library/dom`, `vite-tsconfig-paths`, `@vitest/coverage-v8`.
      `vitest.config.mts` with jsdom env and tsconfig path resolution.
- [ ] 3. Add `test` (run-once, for CI) and `test:watch` scripts. Fold `test` into `verify`
      between lint and build, so `verify` = typecheck + lint + test + build per E01's
      acceptance criteria.
- [ ] 4. Write one real test, not a placeholder assertion. Target the backlog data model in
      `scripts/enhancements.mjs`: unique IDs, every `depends` entry resolves to a real ID,
      no dependency cycles, every epic and priority key is known. That guards a file we
      actually edit and would otherwise only find broken at seed time.
- [ ] 5. Turn on `noUncheckedIndexedAccess` in `tsconfig.json`. Cheap now, expensive at E05
      when the derivation engine is indexing arrays everywhere. Fix any fallout.
- [ ] 6. `.github/workflows/ci.yml` — on push to `main` and all PRs: checkout, Node 22,
      `npm ci`, typecheck, lint, test, build. Concurrency group so superseded runs cancel.
- [ ] 7. `.github/dependabot.yml` — weekly npm + github-actions updates, grouped minor/patch
      so it does not open fifteen PRs a week.
- [ ] 8. Replace the create-next-app template page with a minimal honest placeholder naming
      the project and linking the backlog. Not a design pass — E02 owns that. This only
      removes the template so the CI build is testing our code.
- [ ] 9. Seed `error_log.md` with the format header from CLAUDE.md rule 2.
- [ ] 10. Run `npm run verify` locally; confirm green.
- [ ] 11. Push, open PR, confirm CI passes on the PR itself.
- [ ] 12. After merge: `npm run seed:issues:dry`, review, then `npm run seed:issues`.
- [ ] 13. Write the review section below.

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

_Pending._
