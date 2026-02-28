'use client'

import { Suspense } from 'react'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { EarlyAccessSignupForm } from '@/components/forms/EarlyAccessSignupForm'

export function WaitlistSection() {
  return (
    <section
      id="waitlist-form"
      className="py-24 px-6 bg-basalt-50"
      aria-labelledby="waitlist-heading"
    >
      <div className="max-w-md mx-auto text-center">
        <FadeInSection>
          <h2
            id="waitlist-heading"
            className="font-serif text-3xl text-sandstone mb-4"
          >
            Request early access
          </h2>
          <p className="text-cream/60 text-sm mb-8">
            We&apos;re opening access in waves. Leave your email to get invited.
          </p>
          <Suspense fallback={null}>
            <EarlyAccessSignupForm />
          </Suspense>
        </FadeInSection>
      </div>
    </section>
  )
}
