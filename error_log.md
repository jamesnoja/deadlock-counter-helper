# Error log

Runtime and build errors observed while developing, newest last. Per `CLAUDE.md`, every
error gets an entry so we can verify features actually work rather than assuming they do.

Format:

```
## <page or feature>
- [YYYY-MM-DD HH:mm] <message> (file:line)
```

## Sync game data (scheduled workflow)

- [2026-09-08 11:16] `npm error Missing script: "overlay:scaffold"` — every scheduled run
  failed here from 2026-08-09 onward. #77 deleted `scripts/scaffold-overlay.mts` and the
  script entry, but left the workflow step that calls it. The step had no `if:` guard and
  ran before verify and PR, so the job fetched upstream data, printed the diff and discarded
  it; no sync PR was ever opened. The 2026-09-08 run detected 8 retuned abilities this way.
  (.github/workflows/sync.yml:39)
- [2026-09-08 23:44] `GitHub Actions is not permitted to create or approve pull requests
  (createPullRequest)` — repo setting, not code. `can_approve_pull_request_reviews` was
  false. The data branch pushed fine; only `gh pr create` failed.
  (.github/workflows/sync.yml:75)
- [2026-09-08 23:46] `! [rejected] data/sync-2026-09-08 (stale info)` — `git push
  --force-with-lease` with nothing to lease against. actions/checkout fetches only `main`,
  so no `refs/remotes/origin/data/sync-<date>` exists and the lease fails closed rather than
  falling back to a plain force. The re-run path the step's own comment describes had
  therefore never worked. (.github/workflows/sync.yml:54)

## Patch note parser

- [2026-09-09 11:44] No thrown error — wrong output. Valve is inconsistent about paragraphs:
  most posts wrap each change in its own `[p]`, but 08-12-2026 puts all thirty in one,
  newline separated. That parsed as a single 2,000-character "note" mentioning half the
  roster, which matched almost any correlation query and hid the notes explaining three of
  eight retunes. Splitting on newlines took that post from 1 note to 31 and the archive from
  ~1,200 to 3,705. (src/data/patches.ts:24)

## Provenance stamp

- [2026-09-09 11:57] No thrown error — wrong claim. The stamp read `META.patch`, sourced
  from the forum RSS, and displayed "Synced from 06-30-2026 Update" while the committed data
  reflected Valve's 08-22-2026 changes. Six weeks stale on every page, in the one component
  whose purpose is establishing trust. (src/components/provenance-stamp.tsx:31)

## Local tooling

- [2026-09-09 10:12] `TS2307: Cannot find module '../../../src/app/admin/untagged/page.js'`
  from `.next/dev/types/validator.ts` — stale Next type cache referencing a page #77 deleted.
  Tracked code was fine; `rm -rf .next` clears it. (.next/dev/types/validator.ts:42)
