import type { Metadata } from 'next'
import { Suspense } from 'react'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { EarlyAccessSignupForm } from '@/components/forms/EarlyAccessSignupForm'

export const metadata: Metadata = {
  title: 'Early Access',
  description: 'Be the first to try our renovation basics, checklists, and pro directory when Hawaii Home Central launches.',
}

export default function EarlyAccessPage() {
  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-md mx-auto">
        <FadeInSection>
          <div className="text-center mb-10">
            <h1 className="font-serif text-4xl md:text-5xl text-sandstone mb-6">
              Get Early Access
            </h1>
            <p className="text-lg text-cream/70">
              Be the first to try our renovation basics, checklists, and pro directory when we launch.
            </p>
          </div>
        </FadeInSection>

        <FadeInSection delay={100}>
          <div className="bg-basalt-50 rounded-card p-8">
            <Suspense fallback={null}>
              <EarlyAccessSignupForm />
            </Suspense>
          </div>
        </FadeInSection>

        <FadeInSection delay={200}>
          <div className="mt-12 text-center">
            <h2 className="font-serif text-xl text-cream mb-4">
              What You&apos;ll Get
            </h2>
            <ul className="text-cream/60 space-y-2">
              <li>Priority access to interactive renovation checklists</li>
              <li>First look at renovation basics and stories</li>
              <li>Early access to the verified pros directory</li>
              <li>Beta access to homeowner planning tools</li>
            </ul>
          </div>
        </FadeInSection>
      </div>
    </div>
  )
}
