'use client'

import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

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
          className="font-serif text-4xl md:text-5xl lg:text-6xl text-cream leading-tight mb-8"
        >
          Renovate your Hawai&#x02BB;i home with confidence—
          <span className="text-sandstone">not guesswork</span>.
        </h1>

        <p className="text-lg md:text-xl text-cream/70 mb-10 max-w-3xl mx-auto leading-relaxed">
          Free guides, interactive tools, and real homeowner lessons—built for
          Hawai&#x02BB;i&apos;s humidity, permitting, supply delays, and tight scheduling.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Link href="/tools">
            <Button variant="primary" size="lg">
              Browse Free Tools
            </Button>
          </Link>
          <Link href="/stories">
            <Button variant="secondary" size="lg">
              Read Renovation Stories
            </Button>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => {
            document.getElementById('waitlist-form')?.scrollIntoView({ behavior: 'smooth' })
          }}
          className="text-cream/60 hover:text-cream text-sm transition-colors"
        >
          Join the Waitlist &darr;
        </button>
      </div>
    </section>
  )
}
