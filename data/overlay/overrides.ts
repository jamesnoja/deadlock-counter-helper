/**
 * The editorial escape hatch.
 *
 * The tag join gets most things right and will get some things wrong. This is
 * where a human overrules it — and `reason` is required by the type, so every
 * override has to justify itself. An override with no reason is
 * indistinguishable from a bug six months later.
 *
 * Keep this file small. A long overrides list means the tags are wrong and
 * should be fixed in the overlay instead; overriding the same item repeatedly
 * is a symptom, not a solution.
 */

import type { CounterOverride } from '../../src/data/derive.ts'

export const COUNTER_OVERRIDES: CounterOverride[] = [
  // Empty by design. The tags have not yet been confirmed by a human, so
  // overriding them now would be correcting a guess with another guess.
]
