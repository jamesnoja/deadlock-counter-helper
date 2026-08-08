'use client'

/**
 * Every piece of game artwork on the site goes through here.
 *
 * Three things E12 asks for, in one place rather than nine:
 *
 * 1. `next/image` with **explicit dimensions**, so the grid never shifts. The
 *    box is sized by CSS before the bytes arrive; cumulative layout shift from
 *    images should be zero.
 * 2. A **local fallback** when an upstream asset 404s. Patches retire art, and
 *    a broken-image glyph in a dense grid is worse than an honest placeholder.
 * 3. Decorative by default. These images sit next to the name they depict, so
 *    an alt text repeating it just makes a screen reader say everything twice.
 *    Pass `alt` only when the image is the sole carrier of meaning.
 */

import Image from 'next/image'
import { useState } from 'react'

interface GameImageProps {
  src: string | null | undefined
  /** Rendered in the placeholder when art is missing — usually the first letters of a name. */
  fallback: string
  size: number
  alt?: string
  className?: string
}

export function GameImage({ src, fallback, size, alt = '', className = '' }: GameImageProps) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <span
        aria-hidden={alt === '' ? true : undefined}
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        className={`grid place-items-center bg-surface-elevated text-micro text-text-muted ${className}`}
        style={{ width: size, height: size }}
      >
        {fallback.slice(0, 2)}
      </span>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      // Reserve the box up front; the intrinsic size is what stops the reflow.
      className={`object-cover ${className}`}
      onError={() => setFailed(true)}
      unoptimized={false}
    />
  )
}
