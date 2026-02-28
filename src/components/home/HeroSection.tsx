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
    text: 'Better finishes — organize decisions before your contractor needs them',
  },
  {
    icon: (
      <svg className="w-5 h-5 text-sandstone" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    text: 'Fewer delays — track every punch-list item so nothing stalls the schedule',
  },
  {
    icon: (
      <svg className="w-5 h-5 text-sandstone" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    text: 'Easy sharing — send a read-only link to your contractor, designer, or family',
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
          className="font-serif text-4xl md:text-5xl lg:text-6xl text-cream leading-tight mb-6"
        >
          Your Hawai&#x02BB;i renovation,{' '}
          <span className="text-sandstone">organized</span>.
        </h1>

        <p className="text-lg md:text-xl text-cream/70 mb-10 max-w-3xl mx-auto leading-relaxed">
          Free tools that help you pick finishes, track punch-list items, and
          share progress with your contractor—built for Hawai&#x02BB;i&apos;s unique challenges.
        </p>

        {/* Benefit bullets */}
        <ul className="flex flex-col items-center gap-3 mb-10 max-w-xl mx-auto" aria-label="Key benefits">
          {BENEFITS.map((b) => (
            <li key={b.text} className="flex items-center gap-3 text-left">
              <span className="shrink-0" aria-hidden="true">{b.icon}</span>
              <span className="text-cream/80 text-sm md:text-base">{b.text}</span>
            </li>
          ))}
        </ul>

        {/* Truth line */}
        <p className="text-cream/40 text-xs tracking-wide uppercase mb-6">
          In early beta &middot; Built for Hawai&#x02BB;i homeowners
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Link href="/waitlist">
            <Button variant="primary" size="lg">
              Request Early Access
            </Button>
          </Link>
          <Link href="/tools">
            <Button variant="secondary" size="lg">
              See the Tools
            </Button>
          </Link>
        </div>

        <p className="text-cream/50 text-sm max-w-md mx-auto">
          We&apos;re opening access in waves. Join the list to get invited.
        </p>
      </div>
    </section>
  )
}
