'use client'
/**
 * Jump to a card without overriding a motion preference.
 *
 * The global reduced-motion block sets `scroll-behavior: auto`, which governs
 * CSS-driven scrolling only. A JavaScript `behavior: "smooth"` argument ignores
 * it, so this is the one motion in the interface that would otherwise bypass
 * the accommodation entirely.
 */
export function scrollCardIntoView(node: Element | undefined) {
  if (!node) return
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  node.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' })
}
