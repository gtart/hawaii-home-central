'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TAGLINE =
  'A Hawai\u02BBi-first guide to renovating, maintaining, and loving your home.'
const EMAIL = 'hello@hawaiihomecentral.com'

const LEGAL_LINKS = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/disclaimer', label: 'Disclaimer' },
]

export function Footer() {
  const pathname = usePathname()
  const currentYear = new Date().getFullYear()

  // Hide footer on admin pages
  if (pathname.startsWith('/admin')) return null

  return (
    <>
      {/* Trust block */}
      <div className="border-t border-cream/5 bg-basalt">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center">
          <p className="text-sm text-cream/60 mb-2">
            We&apos;re homeowners who&apos;ve been through it. We built Hawaii Home Central
            to help other homeowners get the best out of their partnerships with contractors—and
            get the most out of what their home has to offer.
          </p>
          <p className="text-xs text-cream/40">
            We&apos;re not contractors or attorneys. This isn&apos;t legal or professional
            advice—just practical guidance and tools to help you stay organized and informed.
          </p>
        </div>
      </div>

      {/* Existing footer */}
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
            <p className="mt-2 text-sm text-cream/50">{TAGLINE}</p>
          </div>

          <div className="text-center md:text-right">
            <p className="text-sm text-cream/70">
              Contact:{' '}
              <a
                href={`mailto:${EMAIL}`}
                className="text-sandstone hover:text-sandstone-light transition-colors"
              >
                {EMAIL}
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
    </>
  )
}
