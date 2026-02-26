'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { UserMenu } from '@/components/auth/UserMenu'
import { ProjectSwitcher } from '@/components/app/ProjectSwitcher'
import { TOOL_REGISTRY } from '@/lib/tool-registry'

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
  const [toolsOpen, setToolsOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)
  const toolsRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
    setMoreOpen(false)
    setToolsOpen(false)
  }, [pathname])

  // Close dropdowns on outside click
  useEffect(() => {
    if (!moreOpen && !toolsOpen) return
    function handleClick(e: MouseEvent) {
      if (moreOpen && moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
      if (toolsOpen && toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setToolsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [moreOpen, toolsOpen])

  // Hide nav on admin, public share, and report pages
  if (pathname.startsWith('/admin') || pathname.startsWith('/share') || pathname.includes('/report')) return null

  const toolsLabel = session?.user ? 'My Home Tools' : 'Tools'
  const toolsHref = session?.user ? '/app' : '/tools'

  const primaryLinks: NavLink[] = [
    { href: '/hawaii-home-renovation', label: 'Renovation Guides', matchMode: 'prefix' },
    { href: toolsHref, label: toolsLabel, matchMode: 'prefix' },
    { href: '/stories', label: 'Stories' },
  ]

  const moreLinks: NavLink[] = [
    { href: '/about', label: 'About' },
    { href: '/directory', label: 'Directory' },
    { href: '/waitlist', label: 'Waitlist' },
    { href: '/contact', label: 'Contact' },
  ]

  const isLinkActive = (link: NavLink) => {
    if (link.href === '/app' || link.href === '/tools') {
      return pathname.startsWith('/app') || pathname.startsWith('/tools')
    }
    // Renovation Guides link: active for both /hawaii-home-renovation and /resources sub-pages
    if (link.href === '/hawaii-home-renovation') {
      return pathname.startsWith('/hawaii-home-renovation') || pathname.startsWith('/resources')
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
            {/* Brand + project context */}
            <div className="flex items-center gap-2.5 min-w-0">
              <Link
                href={session?.user ? '/app' : '/'}
                className="font-serif text-xl text-sandstone hover:text-sandstone-light transition-colors shrink-0"
              >
                Hawaii Home Central
              </Link>
              <span className="inline-block text-[10px] font-medium tracking-wide uppercase text-sandstone/70 bg-sandstone/10 border border-sandstone/20 rounded-full px-2 py-0.5 leading-tight shrink-0">
                Beta
              </span>
              {session?.user && (
                <div className="hidden sm:flex items-center gap-1.5 min-w-0">
                  <span className="text-cream/20">/</span>
                  <ProjectSwitcher />
                </div>
              )}
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-6">
              <ul className="flex items-center gap-6">
                {primaryLinks.map((link) => {
                  const isTools = link.href === '/app' || link.href === '/tools'
                  const active = isLinkActive(link)

                  if (isTools && session?.user) {
                    return (
                      <li key={link.href}>
                        <div className="relative" ref={toolsRef}>
                          <div className="flex items-center gap-1">
                            <Link
                              href={link.href}
                              className={cn(
                                'text-sm transition-colors',
                                active ? 'text-sandstone' : 'text-cream/70 hover:text-cream'
                              )}
                              aria-current={active ? 'page' : undefined}
                            >
                              {link.label}
                            </Link>
                            <button
                              type="button"
                              onClick={() => setToolsOpen(!toolsOpen)}
                              className={cn(
                                'p-0.5 transition-colors rounded',
                                active || toolsOpen ? 'text-sandstone' : 'text-cream/50 hover:text-cream'
                              )}
                              aria-expanded={toolsOpen}
                              aria-label="Show tools menu"
                            >
                              <svg
                                className={cn('w-3 h-3 transition-transform', toolsOpen && 'rotate-180')}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                          </div>
                          {toolsOpen && (
                            <div className="absolute left-0 top-full mt-2 bg-basalt-50 border border-cream/10 rounded-card shadow-lg py-2 min-w-[200px]">
                              {TOOL_REGISTRY.map((tool) => (
                                <Link
                                  key={tool.toolKey}
                                  href={tool.href}
                                  className={cn(
                                    'block px-4 py-2 text-sm transition-colors',
                                    pathname.startsWith(tool.href)
                                      ? 'text-sandstone'
                                      : 'text-cream/70 hover:text-cream hover:bg-cream/5'
                                  )}
                                >
                                  {tool.title}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      </li>
                    )
                  }

                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={cn(
                          'text-sm transition-colors',
                          active ? 'text-sandstone' : 'text-cream/70 hover:text-cream'
                        )}
                        aria-current={active ? 'page' : undefined}
                      >
                        {link.label}
                      </Link>
                    </li>
                  )
                })}
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

          {/* Mobile menu */}
          {isMobileMenuOpen && (
            <ul className="lg:hidden mt-4 py-4 border-t border-cream/10 space-y-1 bg-basalt rounded-b-card">
              {/* Project context on mobile */}
              {session?.user && (
                <li className="px-1 py-2 mb-2">
                  <ProjectSwitcher />
                </li>
              )}

              {primaryLinks.map((link) => {
                const isTools = (link.href === '/app' || link.href === '/tools') && session?.user
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        'block py-2.5 text-base transition-colors',
                        isTools && 'font-medium',
                        isLinkActive(link)
                          ? 'text-sandstone'
                          : 'text-cream/70 hover:text-cream'
                      )}
                      aria-current={isLinkActive(link) ? 'page' : undefined}
                    >
                      {link.label}
                    </Link>
                    {isTools && (
                      <ul className="pl-4 pb-1 space-y-0.5">
                        {TOOL_REGISTRY.map((tool) => (
                          <li key={tool.toolKey}>
                            <Link
                              href={tool.href}
                              className={cn(
                                'block py-1.5 text-sm transition-colors',
                                pathname.startsWith(tool.href)
                                  ? 'text-sandstone'
                                  : 'text-cream/50 hover:text-cream/70'
                              )}
                            >
                              {tool.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                )
              })}
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
