'use client'

/**
 * Copy-to-clipboard chat export — E19.
 *
 * The real workflow is telling four teammates what to buy, in chat, in about
 * eight seconds. The button shows the exact text it will copy, because pasting
 * something you have not seen into team chat mid-match is a bad surprise.
 */

import { useState } from 'react'
import { formatForChat } from '@/data/export.ts'
import type { RankedCounter } from '@/data/derive.ts'
import type { Hero } from '@/data/schema.ts'

export function ChatExport({
  counters,
  team,
}: {
  counters: readonly RankedCounter[]
  team: readonly Hero[]
}) {
  const [copied, setCopied] = useState(false)
  const text = formatForChat(counters, team)
  if (!text) return null

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be refused. The text is on screen either way, so
      // there is nothing to recover from and nothing worth alarming anyone with.
      setCopied(false)
    }
  }

  return (
    <details className="min-w-0">
      <summary className="cursor-pointer text-caption text-brand marker:content-none hover:underline">
        <span aria-hidden>▸ </span>
        Copy for team chat
      </summary>
      <div className="mt-xs flex flex-col gap-xs rounded-card bg-surface p-md">
        <p className="break-words text-caption text-text-muted">{text}</p>
        <div className="flex items-center gap-sm">
          <button
            type="button"
            onClick={copy}
            className="rounded-pill bg-brand px-xl py-xs text-micro font-bold text-on-brand hover:bg-brand-soft"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
          <span className="text-micro text-text-muted">
            <span className="text-tabular">{text.length}</span> characters — fits a game chat box
          </span>
        </div>
      </div>
    </details>
  )
}
