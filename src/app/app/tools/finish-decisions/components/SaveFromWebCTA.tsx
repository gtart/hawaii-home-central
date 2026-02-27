'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BookmarkletButton } from './BookmarkletButton'

const DISMISSED_KEY = 'hhc_save_tip_dismissed'

/**
 * Expandable "Tip" banner for the "Save to HHC" bookmarklet.
 * Placed near the top of the Decision Tracker page.
 * Collapsible — users can dismiss it, and it stays collapsed.
 */
export function SaveFromWebCTA({ className = '' }: { className?: string }) {
  const [expanded, setExpanded] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISSED_KEY) === '1') setDismissed(true)
    } catch { /* ignore */ }
  }, [])

  function handleDismiss() {
    setDismissed(true)
    try { localStorage.setItem(DISMISSED_KEY, '1') } catch { /* ignore */ }
  }

  if (dismissed) {
    return (
      <button
        type="button"
        onClick={() => {
          setDismissed(false)
          setExpanded(true)
          try { localStorage.removeItem(DISMISSED_KEY) } catch { /* ignore */ }
        }}
        className={`inline-flex items-center gap-1.5 text-[11px] text-sandstone/50 hover:text-sandstone transition-colors ${className}`}
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
        </svg>
        Tip: Save images from any website
      </button>
    )
  }

  return (
    <div
      data-testid="savefromweb-cta"
      className={`border border-sandstone/20 bg-sandstone/5 rounded-xl overflow-hidden ${className}`}
    >
      {/* Collapsed header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left hover:bg-sandstone/5 transition-colors"
      >
        <svg className="w-4 h-4 text-sandstone/70 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
        </svg>
        <span className="flex-1 text-sm text-sandstone/80 font-medium">
          Tip: Save images from any website to your boards
        </span>
        <svg
          className={`w-3.5 h-3.5 text-sandstone/40 transition-transform ${expanded ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-sandstone/10">
          <p className="text-xs text-cream/50 pt-3">
            Drag the button below to your bookmarks bar. Then click it on any website to capture images
            and save them directly to your Decision Tracker or Mood Boards.
          </p>

          <BookmarkletButton compact />

          <div className="flex items-center gap-3 pt-1">
            <Link
              href="/app/save-from-web"
              className="text-[11px] text-sandstone/60 hover:text-sandstone transition-colors"
            >
              Full setup guide →
            </Link>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-[11px] text-cream/25 hover:text-cream/40 transition-colors ml-auto"
            >
              Dismiss tip
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
