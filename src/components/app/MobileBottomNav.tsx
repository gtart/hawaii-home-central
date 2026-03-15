'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
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
    label: 'Fix List',
    matchMode: 'prefix' as const,
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
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
  {
    href: '/app/tools/mood-boards',
    label: 'Mood Boards',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/app/tools/before-you-sign',
    label: 'Bid Checklist',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 15l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

function isActive(pathname: string, href: string, matchMode: 'exact' | 'prefix'): boolean {
  if (matchMode === 'exact') return pathname === href
  return pathname.startsWith(href)
}

export function MobileBottomNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on route change
  useEffect(() => {
    setMoreOpen(false)
  }, [pathname])

  // Click-away close
  useEffect(() => {
    if (!moreOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [moreOpen])

  const moreActive = MORE_ITEMS.some((item) => pathname.startsWith(item.href))

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-basalt border-t border-cream/12 z-30 md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center">
        {TABS.map((tab) => {
          const active = isActive(pathname, tab.href, tab.matchMode)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] transition-colors ${
                active ? 'text-sandstone' : 'text-cream/40'
              }`}
            >
              {tab.icon}
              {tab.label}
            </Link>
          )
        })}

        {/* More menu */}
        <div className="flex-1 relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMoreOpen(!moreOpen)}
            className={`w-full flex flex-col items-center gap-0.5 py-2 text-[10px] transition-colors ${
              moreActive ? 'text-sandstone' : 'text-cream/40'
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
            More
          </button>

          {moreOpen && (
            <div className="absolute bottom-full right-1 mb-2 w-48 bg-stone border border-cream/15 rounded-lg shadow-xl overflow-hidden py-1">
              {MORE_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                    pathname.startsWith(item.href)
                      ? 'text-sandstone bg-sandstone/8'
                      : 'text-cream/80 hover:bg-cream/5 hover:text-cream'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
