'use client'

import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'
import { EarlyAccessForm } from '@/components/forms/EarlyAccessForm'

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
          A Hawaiʻi-first guide to renovating, maintaining, and loving your home—built from real homeowner pain{' '}
          <span className="text-sandstone">(so you don&apos;t repeat it)</span>.
        </h1>

        <p className="text-lg md:text-xl text-cream/70 mb-12 max-w-3xl mx-auto leading-relaxed">
          Practical playbooks, real lessons, and a trust-first pros directory—made for Hawaiʻi&apos;s realities: from condos to older single-wall homes, humidity, salt air, termites, permitting, supply delays, and tight scheduling.
        </p>

        <div className="max-w-md mx-auto">
          <EarlyAccessForm />
        </div>
      </div>
    </section>
  )
}
