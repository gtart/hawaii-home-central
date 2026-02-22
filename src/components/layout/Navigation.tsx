'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { UserMenu } from '@/components/auth/UserMenu'

interface NavLink {
  href: string
  label: string
  matchMode?: 'exact' | 'prefix'
}

export function Navigation() {
  const { data: session } = useSession()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  const toolsLabel = session?.user ? 'Workspace' : 'Tools'
  const toolsHref = session?.user ? '/app' : '/tools'

  const primaryLinks: NavLink[] = [
    { href: '/resources', label: 'Guides', matchMode: 'prefix' },
    { href: toolsHref, label: toolsLabel, matchMode: 'prefix' },
    { href: '/stories', label: 'Stories' },
  ]

  const moreLinks: NavLink[] = [
    { href: '/about', label: 'About' },
    { href: '/directory', label: 'Directory' },
    { href: '/early-access', label: 'Early Access' },
    { href: '/contact', label: 'Contact' },
  ]

  // Hide nav on admin, app workspace, public share, and report pages
  if (pathname.startsWith('/admin') || pathname.startsWith('/app') || pathname.startsWith('/share') || pathname.includes('/report')) return null

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
    setMoreOpen(false)
  }, [pathname])

  // Close "More" dropdown on outside click
  useEffect(() => {
    if (!moreOpen) return
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [moreOpen])

  const isLinkActive = (link: NavLink) => {
    if (link.href === '/app' || link.href === '/tools') {
      return pathname.startsWith('/app') || pathname.startsWith('/tools')
    }
    if (link.matchMode === 'prefix') {
      return pathname === link.href || pathname.startsWith(link.href + '/')
    }
    return pathname === link.href
  }

  const isMoreActive = moreLinks.some((link) => isLinkActive(link))

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
            <div className="hidden lg:flex items-center gap-6">
              <ul className="flex items-center gap-6">
                {primaryLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        'text-sm transition-colors',
                        link.href === '/app' || link.href === '/tools'
                          ? cn(
                              'bg-sandstone/10 px-3 py-1 rounded-full',
                              isLinkActive(link)
                                ? 'text-sandstone bg-sandstone/20'
                                : 'text-cream/80 hover:text-cream hover:bg-sandstone/15'
                            )
                          : isLinkActive(link)
                          ? 'text-sandstone'
                          : 'text-cream/70 hover:text-cream'
                      )}
                      aria-current={isLinkActive(link) ? 'page' : undefined}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                {/* More dropdown */}
                <li>
                  <div className="relative" ref={moreRef}>
                    <button
                      type="button"
                      onClick={() => setMoreOpen(!moreOpen)}
                      className={cn(
                        'text-sm transition-colors flex items-center gap-1',
                        isMoreActive || moreOpen
                          ? 'text-sandstone'
                          : 'text-cream/70 hover:text-cream'
                      )}
                      aria-expanded={moreOpen}
                    >
                      More
                      <svg
                        className={cn(
                          'w-3 h-3 transition-transform',
                          moreOpen && 'rotate-180'
                        )}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    {moreOpen && (
                      <div className="absolute right-0 top-full mt-2 bg-basalt-50 border border-cream/10 rounded-card shadow-lg py-2 min-w-[160px]">
                        {moreLinks.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                              'block px-4 py-2 text-sm transition-colors',
                              isLinkActive(link)
                                ? 'text-sandstone'
                                : 'text-cream/70 hover:text-cream hover:bg-cream/5'
                            )}
                            aria-current={isLinkActive(link) ? 'page' : undefined}
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
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

          {/* Mobile menu — flat list with section divider */}
          {isMobileMenuOpen && (
            <ul className="lg:hidden mt-4 py-4 border-t border-cream/10 space-y-1 bg-basalt rounded-b-card">
              {primaryLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      'block py-2.5 text-base transition-colors',
                      (link.href === '/app' || link.href === '/tools') && 'font-medium',
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
              {session?.user && (
                <li>
                  <Link
                    href="/app/projects"
                    className={cn(
                      'block py-2.5 text-base transition-colors',
                      pathname.startsWith('/app/projects')
                        ? 'text-sandstone'
                        : 'text-cream/70 hover:text-cream'
                    )}
                    aria-current={pathname.startsWith('/app/projects') ? 'page' : undefined}
                  >
                    My Projects
                  </Link>
                </li>
              )}
              <li className="border-t border-cream/10 pt-2 mt-2" aria-hidden="true">
                <span className="block text-[11px] text-cream/30 uppercase tracking-wide py-1">
                  More
                </span>
              </li>
              {moreLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      'block py-2 text-sm transition-colors',
                      isLinkActive(link)
                        ? 'text-sandstone'
                        : 'text-cream/50 hover:text-cream/70'
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
