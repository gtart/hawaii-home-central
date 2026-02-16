'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { UserMenu } from '@/components/auth/UserMenu'

interface NavLink {
  href: string
  label: string
  matchMode?: 'exact' | 'prefix'
}

const NAV_LINKS: NavLink[] = [
  { href: '/about', label: 'About' },
  { href: '/hawaii-home-renovation', label: 'Renovation Basics', matchMode: 'prefix' },
  { href: '/resources', label: 'Guides', matchMode: 'prefix' },
  { href: '/tools', label: 'Tools', matchMode: 'prefix' },
  { href: '/stories', label: 'Stories' },
  { href: '/directory', label: 'Directory' },
  { href: '/early-access', label: 'Early Access' },
  { href: '/contact', label: 'Contact' },
]

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  // Hide nav on admin pages
  if (pathname.startsWith('/admin')) return null

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const isLinkActive = (link: NavLink) => {
    if (link.matchMode === 'prefix') {
      return pathname === link.href || pathname.startsWith(link.href + '/')
    }
    return pathname === link.href
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-basalt/80 lg:hidden transition-opacity duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
          isScrolled || isMobileMenuOpen
            ? 'bg-basalt/95 backdrop-blur-sm shadow-lg'
            : 'bg-transparent'
        )}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-sandstone focus:text-basalt focus:rounded-button focus:outline-none"
        >
          Skip to main content
        </a>

        <nav className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Link
                href="/"
                className="font-serif text-xl text-sandstone hover:text-sandstone-light transition-colors"
              >
                Hawaii Home Central
              </Link>
              <span className="inline-block text-[10px] font-medium tracking-wide uppercase text-sandstone/70 bg-sandstone/10 border border-sandstone/20 rounded-full px-2 py-0.5 leading-tight">
                Beta
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              <ul className="flex items-center gap-8">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        'text-sm transition-colors',
                        isLinkActive(link)
                          ? 'text-sandstone'
                          : 'text-cream/70 hover:text-cream'
                      )}
                      aria-current={isLinkActive(link) ? 'page' : undefined}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <UserMenu />
            </div>

            {/* Mobile: UserMenu + hamburger */}
            <div className="lg:hidden flex items-center gap-3">
              <UserMenu />
              <button
                className="p-2 text-cream hover:text-sandstone transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-expanded={isMobileMenuOpen}
                aria-label="Toggle navigation menu"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isMobileMenuOpen ? (
                    <path d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile menu — opaque background */}
          {isMobileMenuOpen && (
            <ul className="lg:hidden mt-4 py-4 border-t border-cream/10 space-y-2 bg-basalt rounded-b-card">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      'block py-2 text-base transition-colors',
                      isLinkActive(link)
                        ? 'text-sandstone'
                        : 'text-cream/70 hover:text-cream'
                    )}
                    aria-current={isLinkActive(link) ? 'page' : undefined}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </nav>
      </header>
    </>
  )
}
