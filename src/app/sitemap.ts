import type { MetadataRoute } from 'next'
import { absolute } from '@/data/site.ts'
import { PATCH_SUMMARIES } from '@/data/patch-archive.ts'
import { HEROES, META } from '@/data/snapshot.ts'

/**
 * Generated from the snapshot, like the pages themselves — adding a hero
 * upstream adds a page *and* its sitemap entry with no other change, which is
 * E21's acceptance criterion.
 *
 * Aliases are deliberately excluded: they exist so old links resolve, not so
 * crawlers index the same content twice. Their pages carry a canonical link to
 * the primary slug.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(META.synced_at)

  return [
    { url: absolute('/'), lastModified, changeFrequency: 'weekly', priority: 1 },
    ...HEROES.map((hero) => ({
      url: absolute(`/counter/${hero.slug}`),
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    { url: absolute('/changelog'), lastModified, changeFrequency: 'daily' as const, priority: 0.7 },
    // Patch pages are dated records; once published they do not change, so
    // lastModified is the patch's own date rather than our sync clock.
    ...PATCH_SUMMARIES.map((patch) => ({
      url: absolute(`/changelog/${patch.slug}`),
      lastModified: new Date(patch.published_at),
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    })),
  ]
}
