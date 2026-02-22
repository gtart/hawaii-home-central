'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useProject } from '@/contexts/ProjectContext'
import { ProjectSwitcher } from './ProjectSwitcher'
import { cn } from '@/lib/utils'

interface NavLink {
  href: string
  label: string
  exact?: boolean
}

const NAV_LINKS: NavLink[] = [
  { href: '/app', label: 'My Tools', exact: true },
  { href: '/app/projects', label: 'My Projects' },
  { href: '/resources', label: 'Guides' },
  { href: '/app/settings', label: 'Account', exact: true },
]

export function AppNavigation() {
  const pathname = usePathname()
  const { currentProject, projects } = useProject()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const hasMultipleProjects = projects.filter((p) => p.status === 'ACTIVE').length >= 2

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const isActive = (link: NavLink) => {
    if (link.exact) return pathname === link.href
    return pathname === link.href || pathname.startsWith(link.href + '/')
  }

  return (
    <>
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
        <nav className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Brand + project context */}
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href="/app"
                className="font-serif text-xl text-sandstone hover:text-sandstone-light transition-colors shrink-0"
              >
                Hawaii Home Central
              </Link>
              {currentProject && (
                <div className="hidden sm:flex items-center gap-2 min-w-0">
                  <span className="text-cream/20">/</span>
                  <span className="text-sm text-cream/60 truncate max-w-[180px]">
                    {currentProject.name}
                  </span>
                  {hasMultipleProjects && <ProjectSwitcher />}
                </div>
              )}
            </div>

            {/* Desktop links */}
            <div className="hidden lg:flex items-center gap-6">
              <ul className="flex items-center gap-6">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        'text-sm transition-colors',
                        isActive(link)
                          ? 'text-sandstone'
                          : 'text-cream/70 hover:text-cream'
                      )}
                      aria-current={isActive(link) ? 'page' : undefined}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-sm text-cream/50 hover:text-cream transition-colors"
              >
                Sign Out
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 text-cream hover:text-sandstone transition-colors"
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

          {/* Mobile menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden mt-4 py-4 border-t border-cream/10 space-y-1">
              {/* Project context on mobile */}
              {currentProject && (
                <div className="flex items-center gap-2 px-1 py-2 mb-2">
                  <svg className="w-4 h-4 text-sandstone/60 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-sm text-cream/60 truncate">{currentProject.name}</span>
                  {hasMultipleProjects && <ProjectSwitcher />}
                </div>
              )}

              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'block py-2.5 text-base transition-colors',
                    isActive(link)
                      ? 'text-sandstone'
                      : 'text-cream/70 hover:text-cream'
                  )}
                  aria-current={isActive(link) ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              ))}

              <div className="border-t border-cream/10 pt-2 mt-2">
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="block w-full text-left py-2.5 text-base text-cream/50 hover:text-cream transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </nav>
      </header>
    </>
  )
}
