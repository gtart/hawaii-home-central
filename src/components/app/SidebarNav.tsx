'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

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

const TOOL_ITEMS = [
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
    label: 'Selection Lists',
    matchMode: 'prefix' as const,
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="9" y="3" width="6" height="4" rx="1" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 14l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
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

  return (
    <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-56 pt-16 border-r border-cream/10 bg-basalt flex-col z-30">
      <div className="flex-1 py-4 space-y-1">
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

        <div className="mx-4 my-3 border-t border-cream/8" />

        {TOOL_ITEMS.map((item) => {
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
      </div>
    </nav>
  )
}
