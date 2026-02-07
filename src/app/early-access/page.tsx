import type { Metadata } from 'next'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { EarlyAccessForm } from '@/components/forms/EarlyAccessForm'

export const metadata: Metadata = {
  title: 'Early Access',
  description: 'Join the early access list for Hawaii Home Central. Be the first to access our guides, stories, directory, and tools.',
}

export default function EarlyAccessPage() {
  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-xl mx-auto">
        <FadeInSection>
          <div className="text-center mb-12">
            <h1 className="font-serif text-4xl md:text-5xl text-sandstone mb-6">
              Get Early Access
            </h1>
            <p className="text-lg text-cream/70">
              Join our early access list and be the first to know when we launch new guides, stories, and tools. Early subscribers get priority access to everything we build.
            </p>
          </div>
        </FadeInSection>

        <FadeInSection delay={100}>
          <div className="bg-basalt-50 rounded-card p-8">
            <EarlyAccessForm />
          </div>
        </FadeInSection>

        <FadeInSection delay={200}>
          <div className="mt-12 text-center">
            <h2 className="font-serif text-xl text-cream mb-4">
              What You&apos;ll Get
            </h2>
            <ul className="text-cream/60 space-y-2">
              <li>Early access to new guides and tools</li>
              <li>First look at renovation stories</li>
              <li>Priority access to the pros directory</li>
              <li>Beta access to homeowner tools</li>
              <li>Occasional insights and tips (no spam, we promise)</li>
            </ul>
          </div>
        </FadeInSection>
      </div>
    </div>
  )
}
