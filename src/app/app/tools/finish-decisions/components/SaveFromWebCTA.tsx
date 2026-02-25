'use client'

import Link from 'next/link'

/**
 * A small CTA banner encouraging users to save ideas from the web.
 * Placed across the Selections Board, Room Detail, etc.
 */
export function SaveFromWebCTA({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/app/save-from-web"
      className={`flex items-center gap-3 bg-basalt-50 border border-cream/10 rounded-xl px-4 py-3 hover:border-sandstone/30 transition-colors group ${className}`}
    >
      <div className="w-9 h-9 rounded-lg bg-sandstone/10 flex items-center justify-center shrink-0 group-hover:bg-sandstone/20 transition-colors">
        <svg className="w-4.5 h-4.5 text-sandstone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" strokeLinecap="round" />
          <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-cream/70 group-hover:text-cream/90 transition-colors">
          Save ideas from the web
        </p>
        <p className="text-[11px] text-cream/35">
          Paste a link to save photos, prices, and notes
        </p>
      </div>
      <svg className="w-4 h-4 text-cream/20 group-hover:text-cream/40 transition-colors shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  )
}
