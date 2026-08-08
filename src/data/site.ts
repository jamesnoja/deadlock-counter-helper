/**
 * Where this site lives.
 *
 * Sitemap and canonical links need absolute URLs, and getting them wrong is
 * the kind of SEO bug nobody notices for months. One constant, overridable per
 * environment so preview deploys do not claim to be production.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://deadlock-counter-helper.vercel.app'
).replace(/\/$/, '')

export const absolute = (path: string): string =>
  `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
