# Error log

Runtime and build errors observed while developing, newest last. Per `CLAUDE.md`, every
error gets an entry so we can verify features actually work rather than assuming they do.

Format:

```
## <page or feature>
- [YYYY-MM-DD HH:mm] <message> (file:line)
```

## Sync game data (scheduled workflow)

- [2026-08-09 07:14] `npm error Missing script: "overlay:scaffold"` — every scheduled run
  failed here, 7 for 7, from the first run through 2026-08-15. `#77` removed the script from
  `package.json` but left the step that calls it. The step ran before the verify and PR steps,
  so the job fetched upstream data and discarded it; no sync PR was ever opened.
  (.github/workflows/sync.yml:39)
