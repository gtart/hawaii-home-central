'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useInboxCount } from '@/hooks/useInboxCount'
import { QuickCaptureSheet } from './QuickCaptureSheet'
import { SortWizard } from './SortWizard'

interface CapturedResult {
  id: string
  type: string
  title?: string | null
  thumbnailUrl?: string | null
  imageUrl?: string | null
  note?: string | null
}

const TABS_LEFT = [
  {
    href: '/app',
    label: 'Home',
    matchMode: 'exact' as const,
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/app/tools/punchlist',
    label: 'Fix',
    matchMode: 'prefix' as const,
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

const TABS_RIGHT = [
  {
    href: '/app/tools/finish-decisions',
    label: 'Selections',
    matchMode: 'prefix' as const,
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="9" y="3" width="6" height="4" rx="1" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 14l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

const MORE_ITEMS = [
  { href: '/app/inbox', label: 'Inbox' },
  { href: '/app/tools/mood-boards', label: 'Mood Boards' },
  { href: '/app/tools/before-you-sign', label: 'Contract Checklist' },
]

function isActive(pathname: string, href: string, matchMode: 'exact' | 'prefix'): boolean {
  if (matchMode === 'exact') return pathname === href
  return pathname.startsWith(href)
}

export function MobileBottomNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)
  const [showCapture, setShowCapture] = useState(false)
  const [sortItem, setSortItem] = useState<CapturedResult | null>(null)
  const { total: inboxCount, refetch: refetchInbox } = useInboxCount()

  return (
    <>
      {/* More sheet overlay */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-basalt border-t border-cream/10 rounded-t-2xl pb-[env(safe-area-inset-bottom)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-cream/15 rounded-full" />
            </div>
            <div className="px-4 pb-4 space-y-1">
              {MORE_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-colors ${
                    pathname.startsWith(item.href)
                      ? 'bg-sandstone/10 text-sandstone'
                      : 'text-cream/60 hover:bg-cream/5'
                  }`}
                >
                  {item.label}
                  {item.href === '/app/inbox' && inboxCount > 0 && (
                    <span className="bg-sandstone/20 text-sandstone text-[10px] font-medium px-1.5 py-0.5 rounded-full tabular-nums">
                      {inboxCount}
                    </span>
                  )}
                </Link>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setMoreOpen(false)}
              className="w-full py-3 text-sm text-cream/30 hover:text-cream/50 border-t border-cream/10 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Quick Capture Sheet */}
      {showCapture && (
        <QuickCaptureSheet
          onClose={() => setShowCapture(false)}
          onSort={(result) => {
            setShowCapture(false)
            setSortItem(result as CapturedResult)
          }}
        />
      )}

      {/* Sort Wizard */}
      {sortItem && (
        <SortWizard
          item={sortItem}
          onClose={() => setSortItem(null)}
          onSorted={() => {
            setSortItem(null)
            refetchInbox()
          }}
        />
      )}

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-basalt border-t border-cream/10 z-40 md:hidden pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-end">
          {TABS_LEFT.map((tab) => {
            const active = isActive(pathname, tab.href, tab.matchMode)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] transition-colors ${
                  active ? 'text-sandstone' : 'text-cream/30'
                }`}
              >
                {tab.icon}
                {tab.label}
              </Link>
            )
          })}

          {/* Center "+" capture button */}
          <div className="flex-1 flex justify-center">
            <button
              type="button"
              onClick={() => setShowCapture(true)}
              className="relative -mt-3 w-12 h-12 bg-sandstone rounded-full flex items-center justify-center shadow-lg hover:bg-sandstone-light transition-colors"
            >
              <svg className="w-6 h-6 text-basalt" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              {inboxCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {inboxCount > 99 ? '99+' : inboxCount}
                </span>
              )}
            </button>
          </div>

          {TABS_RIGHT.map((tab) => {
            const active = isActive(pathname, tab.href, tab.matchMode)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] transition-colors ${
                  active ? 'text-sandstone' : 'text-cream/30'
                }`}
              >
                {tab.icon}
                {tab.label}
              </Link>
            )
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] transition-colors ${
              moreOpen ? 'text-sandstone' : 'text-cream/30'
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
            More
          </button>
        </div>
      </nav>
    </>
  )
}
