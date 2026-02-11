'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const ADMIN_LINKS = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/content', label: 'Content' },
  { href: '/admin/collections', label: 'Collections' },
  { href: '/admin/tags', label: 'Tags' },
  { href: '/admin/settings', label: 'Settings' },
  { href: '/admin/feedback', label: 'Feedback' },
  { href: '/admin/signups', label: 'Signups' },
  { href: '/admin/import', label: 'Import / Export' },
  { href: '/admin/access', label: 'Access' },
]

export function AdminSidebar() {
  const pathname = usePathname()

  const isActive = (link: (typeof ADMIN_LINKS)[number]) => {
    if (link.exact) return pathname === link.href
    return pathname === link.href || pathname.startsWith(link.href + '/')
  }

  return (
    <aside className="w-56 shrink-0 border-r border-cream/10 min-h-[calc(100vh-4rem)]">
      <nav className="p-4 space-y-1">
        {ADMIN_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'block px-3 py-2 rounded-lg text-sm transition-colors',
              isActive(link)
                ? 'bg-sandstone/20 text-sandstone font-medium'
                : 'text-cream/60 hover:text-cream hover:bg-cream/5'
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-cream/10">
        <Link
          href="/"
          className="text-xs text-cream/40 hover:text-cream/60 transition-colors"
        >
          &larr; Back to site
        </Link>
      </div>
    </aside>
  )
}
