/**
 * What to do with the copied entries.
 *
 * There is no backend by design — the overlay is a committed file, which is
 * what makes builds reproducible and every change reviewable. That puts a
 * manual step at the end, so it is written out in full rather than assumed:
 * someone curating is not necessarily someone who knows the repo layout.
 */
export function PasteInstructions() {
  return (
    <details className="rounded-card bg-surface p-card">
      <summary className="cursor-pointer text-heading marker:content-none hover:text-brand">
        Where to paste what you copy ▾
      </summary>

      <p className="mt-sm text-caption text-text-muted">
        Nothing here saves. The button copies overlay entries to your clipboard and the change
        lands when someone commits them — which is deliberate: every edit to what the tool
        recommends should be visible in a diff.
      </p>

      <ol className="mt-md flex flex-col gap-sm text-caption text-text-muted">
        <li>
          <strong>1.</strong> Open <code>data/overlay/item-counters.ts</code> for items, or{' '}
          <code>data/overlay/ability-threats.ts</code> for abilities.
        </li>
        <li>
          <strong>2.</strong> Each copied line starts with a <code>class_name</code> such as{' '}
          <code>&quot;upgrade_auto_cleanse&quot;</code>. Search the file for that string — it
          appears exactly once — and replace that whole line with the copied one. Repeat per
          entry. Do not append them at the end; the file holds one line per item and a duplicate
          key silently wins over the original.
        </li>
        <li>
          <strong>3.</strong> Run <code>npm run verify</code>. It typechecks, lints, runs the
          tests and builds. A mistyped tag or an unknown <code>class_name</code> fails here rather
          than shipping.
        </li>
        <li>
          <strong>4.</strong> Commit on a branch and open a PR. Anything you touched is marked{' '}
          <code>review: &quot;curated&quot;</code>, which freezes it against the scaffold —{' '}
          <code>npm run overlay:scaffold</code> re-derives machine suggestions but never
          overwrites a curated entry.
        </li>
      </ol>

      <p className="mt-md text-caption text-text-muted">
        If you would rather not touch the repo: paste the copied block into the PR or issue and
        someone else can apply it. The block is the complete change — it needs no explanation to
        be usable.
      </p>
    </details>
  )
}
