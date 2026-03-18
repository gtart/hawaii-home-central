'use client'

import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

const BENEFITS = [
  {
    icon: (
      <svg className="w-5 h-5 text-sandstone" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    text: 'Track fix items and walkthrough punch lists so nothing gets missed',
  },
  {
    icon: (
      <svg className="w-5 h-5 text-sandstone" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    text: 'Save selections, notes, and links before they get buried in texts and emails',
  },
  {
    icon: (
      <svg className="w-5 h-5 text-sandstone" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    text: 'Keep a clear record of plan changes so you know what was agreed on',
  },
]

export function HeroSection() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <section
      className={cn(
        'relative min-h-screen flex items-center justify-center py-32 px-6',
        'gradient-drift'
      )}
      aria-labelledby="hero-heading"
    >
      {/* Gradient animation only when motion is allowed */}
      {!prefersReducedMotion && (
        <div
          className="absolute inset-0 bg-gradient-to-br from-basalt via-basalt-50 to-basalt bg-200% animate-gradient-drift"
          aria-hidden="true"
        />
      )}

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <h1
          id="hero-heading"
          className="font-serif text-4xl md:text-5xl lg:text-6xl text-cream leading-tight mb-4"
        >
          Owning a home in Hawai&#x02BB;i can be a{' '}
          <span className="text-sandstone">pain in the a$$</span>.
        </h1>

        <p className="text-lg md:text-xl text-cream/60 mb-4 max-w-3xl mx-auto leading-relaxed">
          Renovations cost more. Repairs take longer. And the list of things to deal with never gets shorter.
        </p>

        <p className="text-base md:text-lg text-cream/75 mb-10 max-w-2xl mx-auto leading-relaxed">
          We built free tools to help you stay organized&mdash;so you can track fixes, compare selections, and keep your project on record without losing your mind.
        </p>

        {/* Benefit bullets */}
        <ul className="flex flex-col items-center gap-3 mb-10 max-w-xl mx-auto" aria-label="Key benefits">
          {BENEFITS.map((b) => (
            <li key={b.text} className="flex items-start gap-3 text-left">
              <span className="shrink-0 mt-0.5" aria-hidden="true">{b.icon}</span>
              <span className="text-cream/80 text-sm md:text-base">{b.text}</span>
            </li>
          ))}
        </ul>

        {/* Truth line */}
        <p className="text-cream/40 text-xs tracking-wide uppercase mb-6">
          Free to use &middot; Built for Hawai&#x02BB;i homeowners
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Link href="/waitlist">
            <Button variant="primary" size="lg" data-ph-capture-click="hero-request-access">
              Request Early Access
            </Button>
          </Link>
          <Link href="/tools">
            <Button variant="secondary" size="lg" data-ph-capture-click="hero-see-tools">
              See the Tools
            </Button>
          </Link>
        </div>

        <p className="text-cream/50 text-sm max-w-md mx-auto">
          We&apos;re opening access in waves while we get things right. Request an invite to get started.
        </p>
      </div>
    </section>
  )
}
