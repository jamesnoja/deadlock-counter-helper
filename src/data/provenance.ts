/**
 * What the last patch touched, and how confident we are in each entity.
 *
 * `changes.json` is written by the sync and describes the most recent change
 * the data actually underwent. Entities it flagged stay amber until a human
 * confirms the curation still holds; everything else is green.
 */

import changes from '../../data/snapshot/changes.json' with { type: 'json' }
import type { SnapshotDiff } from './diff.ts'
import { META } from './snapshot.ts'

interface ChangeRecord extends SnapshotDiff {
  detected_at: string
  patch: { title: string; published_at: string; link: string } | null
}

export const CHANGES = changes as unknown as ChangeRecord

const flagged = new Set(CHANGES.needsReview)

export type ProvenanceState = 'verified' | 'stale'

/**
 * `stale` means the last patch touched this and nobody has re-checked the
 * curation. It is not a claim that the data is wrong — only that we have not
 * confirmed it is still right, which is the honest thing to show.
 */
export const provenanceFor = (className: string): ProvenanceState =>
  flagged.has(className) ? 'stale' : 'verified'

export const needsReview = (className: string): boolean => flagged.has(className)

export interface ProvenanceSummary {
  patchTitle: string
  patchLink: string
  syncedAt: string
  flaggedCount: number
  untaggedCount: number
}

export function provenanceSummary(): ProvenanceSummary {
  return {
    patchTitle: META.patch?.title ?? 'unknown patch',
    patchLink: META.patch?.link ?? '',
    syncedAt: META.synced_at,
    flaggedCount: CHANGES.needsReview.length,
    untaggedCount: CHANGES.untaggedAdditions.length,
  }
}
