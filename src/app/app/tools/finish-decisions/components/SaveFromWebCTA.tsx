'use client'

import Link from 'next/link'

/**
 * CTA banner for the "Save to HHC" feature (bookmarklet + URL import).
 * Placed on the Selection Boards page.
 */
export function SaveFromWebCTA({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/app/save-from-web"
      data-testid="savefromweb-cta"
      className={`flex items-center gap-3 bg-basalt-50 border border-cream/10 rounded-xl px-4 py-3 hover:border-sandstone/30 transition-colors group ${className}`}
    >
      <div className="w-9 h-9 rounded-lg bg-sandstone/10 flex items-center justify-center shrink-0 group-hover:bg-sandstone/20 transition-colors">
        <svg className="w-4.5 h-4.5 text-sandstone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-cream/70 group-hover:text-cream/90 transition-colors">
          Save to HHC
        </p>
        <p className="text-[11px] text-cream/35">
          Use the bookmarklet (best) or paste a link to capture images
        </p>
      </div>
      <svg className="w-4 h-4 text-cream/20 group-hover:text-cream/40 transition-colors shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  )
}
