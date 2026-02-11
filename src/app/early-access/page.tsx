import type { Metadata } from 'next'
import { Suspense } from 'react'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { EarlyAccessSignupForm } from '@/components/forms/EarlyAccessSignupForm'

export const metadata: Metadata = {
  title: 'Early Access — Beta Preview',
  description: 'Hawaii Home Central is in beta preview. Sign in with Google for an early look, or leave your email to be notified at launch.',
}

export default function EarlyAccessPage() {
  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-lg mx-auto">
        <FadeInSection>
          <div className="text-center mb-10">
            <div className="inline-block bg-sandstone/15 text-sandstone text-xs font-medium tracking-wider uppercase px-3 py-1 rounded-full mb-6">
              Beta Preview
            </div>
            <h1 className="font-serif text-4xl md:text-5xl text-sandstone mb-6">
              We&apos;re Building Something
            </h1>
            <p className="text-lg text-cream/70 leading-relaxed">
              Hawaii Home Central is under construction. The site is being actively updated and will change continuously as we add new content and features.
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
          <div className="mt-12 space-y-8">
            <div className="text-center">
              <h2 className="font-serif text-xl text-cream mb-4">
                Two Ways to Join
              </h2>
              <div className="grid gap-4 text-left">
                <div className="bg-basalt-50/50 rounded-lg p-5">
                  <p className="text-cream font-medium mb-1">Sign in with Google</p>
                  <p className="text-cream/60 text-sm leading-relaxed">
                    Get early preview access right now. Browse renovation basics, stories, and tools as we build them. Just be patient with us while things are still in progress.
                  </p>
                </div>
                <div className="bg-basalt-50/50 rounded-lg p-5">
                  <p className="text-cream font-medium mb-1">Leave your email</p>
                  <p className="text-cream/60 text-sm leading-relaxed">
                    We&apos;ll send you one email when the site officially launches. No spam.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center border-t border-cream/10 pt-8">
              <p className="text-cream/50 text-sm">
                Have feedback or ideas? We&apos;d love to hear from you.
              </p>
              <a
                href="mailto:hello@hawaiihomecentral.com"
                className="text-sandstone hover:text-sandstone-light transition-colors text-sm font-medium"
              >
                hello@hawaiihomecentral.com
              </a>
            </div>
          </div>
        </FadeInSection>
      </div>
    </div>
  )
}
