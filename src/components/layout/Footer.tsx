'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Footer() {
  const pathname = usePathname()
  const currentYear = new Date().getFullYear()

  // Hide footer on admin pages
  if (pathname.startsWith('/admin')) return null

  return (
    <footer className="border-t border-cream/10 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <Link
              href="/"
              className="font-serif text-lg text-sandstone hover:text-sandstone-light transition-colors"
            >
              Hawaii Home Central
            </Link>
            <p className="mt-2 text-sm text-cream/50">
              A Hawai&#x02BB;i-first guide to renovating, maintaining, and loving your home.
            </p>
          </div>

          <div className="text-center md:text-right">
            <p className="text-sm text-cream/70">
              Contact:{' '}
              <a
                href="mailto:hello@hawaiihomecentral.com"
                className="text-sandstone hover:text-sandstone-light transition-colors"
              >
                hello@hawaiihomecentral.com
              </a>
            </p>
            <p className="mt-2 text-xs text-cream/40">
              &copy; {currentYear} Hawaii Home Central. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
