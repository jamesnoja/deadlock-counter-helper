import type { MetadataRoute } from 'next'
import { absolute } from '@/data/site.ts'

/**
 * The admin worklist is internal tooling and has no business in an index; the
 * styleguide is a development surface. Both are excluded here as well as
 * carrying their own noindex, because belt and braces costs nothing.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin/', '/styleguide'] },
    sitemap: absolute('/sitemap.xml'),
  }
}
