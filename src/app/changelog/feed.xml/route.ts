import { PATCH_NOTES } from '@/data/patch-archive.ts'
import { absolute } from '@/data/site.ts'

/**
 * RSS for the changelog — E24 step 3.
 *
 * Points at our pages rather than Valve's, because the pairing is the reason to
 * subscribe: the measured diff next to the note that explains it. Each item
 * still credits and links the original announcement in its body.
 *
 * Hand-rolled rather than pulling a library. The feed is twenty items of
 * escaped text, and a dependency here would be more code to audit than the
 * thirty lines it replaces.
 */

export const dynamic = 'force-static'

/** XML-escapes text. Everything interpolated below goes through this. */
function escape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** A short plain-text summary: the first few changes, or the intro line. */
function summarise(blocks: { kind: string; text: string }[]): string {
  const notes = blocks.filter((block) => block.kind === 'note')
  if (notes.length === 0) {
    return blocks[0]?.text ?? 'No itemised changes.'
  }
  const shown = notes.slice(0, 5).map((note) => `- ${note.text}`)
  const rest = notes.length - shown.length
  return [...shown, rest > 0 ? `...and ${rest} more` : ''].filter(Boolean).join('\n')
}

export function GET(): Response {
  const items = PATCH_NOTES.map((note) => {
    const link = absolute(`/changelog/${note.slug}`)
    const body = `${summarise(note.blocks)}\n\nOriginal announcement: ${note.url}`

    return [
      '    <item>',
      `      <title>${escape(note.title)}</title>`,
      `      <link>${escape(link)}</link>`,
      // Stable across title edits, unlike the link, which is slug-derived.
      `      <guid isPermaLink="false">${escape(note.gid)}</guid>`,
      `      <pubDate>${new Date(note.published_at).toUTCString()}</pubDate>`,
      `      <description>${escape(body)}</description>`,
      '    </item>',
    ].join('\n')
  })

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    '  <channel>',
    '    <title>Deadlock patch changelog</title>',
    `    <link>${escape(absolute('/changelog'))}</link>`,
    '    <description>Measured Deadlock game-data changes paired with Valve&apos;s official patch notes.</description>',
    '    <language>en</language>',
    ...items,
    '  </channel>',
    '</rss>',
  ].join('\n')

  return new Response(xml, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      // Static export, so this is advisory for whatever sits in front.
      'cache-control': 'public, max-age=3600',
    },
  })
}
