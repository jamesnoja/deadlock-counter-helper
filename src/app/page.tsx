/**
 * Placeholder. Deliberately unstyled beyond defaults — E02 defines the design
 * profile and tokens, and inventing a look here would only be undone there.
 */
export default function Home() {
  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col justify-center gap-4 px-6 py-24">
      <h1 className="text-3xl font-semibold tracking-tight">Deadlock Counter Helper</h1>
      <p className="text-lg">
        Pick the enemy team, see every item that answers their kit — with costs, tiers, slots,
        and the specific ability each item counters.
      </p>
      <p>
        Under construction. The roadmap lives in{" "}
        <a
          className="underline"
          href="https://github.com/jamesnoja/deadlock-counter-helper/blob/main/docs/BACKLOG.md"
        >
          docs/BACKLOG.md
        </a>
        .
      </p>
      <p className="text-sm">
        Fan project. Deadlock is the property of Valve Corporation.
      </p>
    </main>
  );
}
