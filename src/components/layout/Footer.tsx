'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const DEFAULT_TAGLINE =
  'A Hawai\u02BBi-first guide to renovating, maintaining, and loving your home.'
const DEFAULT_EMAIL = 'hello@hawaiihomecentral.com'

const LEGAL_LINKS = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/disclaimer', label: 'Disclaimer' },
]

export function Footer() {
  const pathname = usePathname()
  const currentYear = new Date().getFullYear()
  const [tagline, setTagline] = useState(DEFAULT_TAGLINE)
  const [email, setEmail] = useState(DEFAULT_EMAIL)

  useEffect(() => {
    fetch('/api/public/settings?keys=site_contact_email,site_footer_tagline')
      .then((r) => r.json())
      .then((data: Record<string, string>) => {
        if (data.site_footer_tagline) setTagline(data.site_footer_tagline)
        if (data.site_contact_email) setEmail(data.site_contact_email)
      })
      .catch(() => {
        // keep defaults
      })
  }, [])

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
            <p className="mt-2 text-sm text-cream/50">{tagline}</p>
          </div>

          <div className="text-center md:text-right">
            <p className="text-sm text-cream/70">
              Contact:{' '}
              <a
                href={`mailto:${email}`}
                className="text-sandstone hover:text-sandstone-light transition-colors"
              >
                {email}
              </a>
            </p>
            <div className="mt-2 flex items-center justify-center md:justify-end gap-3 text-xs text-cream/40">
              {LEGAL_LINKS.map((link, i) => (
                <span key={link.href} className="flex items-center gap-3">
                  {i > 0 && <span aria-hidden="true">&middot;</span>}
                  <Link
                    href={link.href}
                    className="hover:text-cream/60 transition-colors"
                  >
                    {link.label}
                  </Link>
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs text-cream/40">
              &copy; {currentYear} Hawaii Home Central. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
