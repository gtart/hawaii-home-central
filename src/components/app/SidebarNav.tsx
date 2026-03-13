'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useNavBadges } from '@/hooks/useNavBadges'
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

const NAV_ITEMS = [
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
]

const MANAGE_ITEMS = [
  {
    href: '/app/tools/project-summary',
    label: 'Plan & Changes',
    matchMode: 'prefix' as const,
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="9" y="3" width="6" height="4" rx="1" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 12h8M8 16h5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/app/tools/finish-decisions',
    label: 'Selections',
    matchMode: 'prefix' as const,
    badgeKey: 'selectionsNeedDecisions' as const,
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="9" y="3" width="6" height="4" rx="1" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 14l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/app/tools/punchlist',
    label: 'Fix List',
    matchMode: 'prefix' as const,
    badgeKey: 'fixListOpen' as const,
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

const GETTING_STARTED_ITEMS = [
  {
    href: '/app/tools/mood-boards',
    label: 'Mood Boards',
    matchMode: 'prefix' as const,
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/app/tools/before-you-sign',
    label: 'Contract Checklist',
    matchMode: 'prefix' as const,
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

function isActive(pathname: string, href: string, matchMode: 'exact' | 'prefix'): boolean {
  if (matchMode === 'exact') return pathname === href
  return pathname.startsWith(href)
}

export function SidebarNav() {
  const pathname = usePathname()
  const badges = useNavBadges()
  const { total: inboxCount, refetch: refetchInbox } = useInboxCount()
  const [showCapture, setShowCapture] = useState(false)
  const [sortItem, setSortItem] = useState<CapturedResult | null>(null)

  return (
    <>
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

      <nav className="hidden md:flex fixed left-0 top-16 bottom-0 w-56 border-r border-cream/10 bg-basalt flex-col z-30">
        <div className="flex-1 py-4 space-y-1">
          {/* Quick Capture button */}
          <button
            type="button"
            onClick={() => setShowCapture(true)}
            className="flex items-center gap-2.5 px-4 py-2.5 mx-2 mb-1 rounded-lg text-sm bg-sandstone/10 text-sandstone hover:bg-sandstone/15 transition-colors w-[calc(100%-1rem)]"
          >
            <div className="flex items-center gap-0.5 shrink-0">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="flex-1 text-left leading-tight">
              <span className="block">Quick Capture</span>
              <span className="block text-[9px] text-sandstone/50 -mt-0.5">Capture now, sort later</span>
            </span>
            {inboxCount > 0 && (
              <span className="bg-sandstone/20 text-sandstone text-[10px] font-medium px-1.5 py-0.5 rounded-full tabular-nums">
                {inboxCount}
              </span>
            )}
          </button>

          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href, item.matchMode)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-sandstone/10 text-sandstone'
                    : 'text-cream/40 hover:text-cream/60 hover:bg-cream/5'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}

          {/* Inbox link */}
          <Link
            href="/app/inbox"
            className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors ${
              pathname === '/app/inbox'
                ? 'bg-sandstone/10 text-sandstone'
                : 'text-cream/40 hover:text-cream/60 hover:bg-cream/5'
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 12h-6l-2 3H10l-2-3H2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="flex-1">Inbox</span>
            {inboxCount > 0 && (
              <span className="bg-cream/15 text-cream/50 text-[10px] font-medium px-1.5 py-0.5 rounded-full tabular-nums">
                {inboxCount}
              </span>
            )}
          </Link>

          <div className="mx-4 my-3 border-t border-cream/8" />

        <p className="px-4 pt-2 pb-1 text-[10px] uppercase tracking-wider text-cream/40">
          Manage Renovation
        </p>
        {MANAGE_ITEMS.map((item) => {
          const active = isActive(pathname, item.href, item.matchMode)
          const badgeKey = 'badgeKey' in item ? item.badgeKey : undefined
          const badgeCount = badgeKey && badges ? badges[badgeKey] : 0
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-sandstone/10 text-sandstone'
                  : 'text-cream/40 hover:text-cream/60 hover:bg-cream/5'
              }`}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {badgeCount > 0 && (
                <span className="ml-auto bg-cream/15 text-cream/50 text-[10px] font-medium px-1.5 py-0.5 rounded-full tabular-nums">
                  {badgeCount}
                </span>
              )}
            </Link>
          )
        })}

        <p className="px-4 pt-4 pb-1 text-[10px] uppercase tracking-wider text-cream/30">
          Preparation
        </p>
        {GETTING_STARTED_ITEMS.map((item) => {
          const active = isActive(pathname, item.href, item.matchMode)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-sandstone/10 text-sandstone'
                  : 'text-cream/40 hover:text-cream/60 hover:bg-cream/5'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}
        {/* Find Pros — coming soon */}
        <span className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm text-cream/20 cursor-default">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="flex-1">Find Pros</span>
          <span className="text-[9px] text-cream/15">Soon</span>
        </span>
      </div>
    </nav>
    </>
  )
}
