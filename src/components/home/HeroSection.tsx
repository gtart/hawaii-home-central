'use client'

import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'
import { Suspense } from 'react'
import Link from 'next/link'
import { EarlyAccessSignupForm } from '@/components/forms/EarlyAccessSignupForm'

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

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link
            href="/early-access"
            className="inline-flex items-center px-6 py-3 bg-sandstone text-basalt font-medium rounded-button hover:bg-sandstone-light transition-colors"
          >
            Get Early Access
          </Link>
          <Link
            href="/resources/renovation-stages"
            className="text-cream/70 hover:text-cream text-sm transition-colors"
          >
            See Renovation Stages &rarr;
          </Link>
        </div>

        <div className="max-w-md mx-auto">
          <Suspense fallback={null}>
            <EarlyAccessSignupForm />
          </Suspense>
        </div>
      </div>
    </section>
  )
}
