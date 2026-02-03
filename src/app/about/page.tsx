import type { Metadata } from 'next'
import { FadeInSection } from '@/components/effects/FadeInSection'

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about Hawaii Home Central and our mission to help homeowners renovate, maintain, and enjoy their homes with confidence.',
}

export default function AboutPage() {
  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        <FadeInSection>
          <h1 className="font-serif text-4xl md:text-5xl text-sandstone mb-8">
            About Hawaii Home Central
          </h1>
        </FadeInSection>

        <FadeInSection delay={100}>
          <div className="space-y-6 text-cream/80 leading-relaxed">
            <p>
              Hawaii Home Central started after a few friends and I lived through the same surprise: renovating a home is less about inspiration and more about navigating complexity—especially in Hawaiʻi. Even with excellent professionals, the process can be intense.
            </p>

            <p>
              One of the biggest challenges is coordination: so many moving pieces, so many specialties, tight calendars, changing sequences, and a constant stream of decisions that stack up fast. Then you run into the bigger system issues—scattered information, and differing incentives between homeowners, trades, suppliers, and everyone in between—plus the simple reality that trust is hard to verify.
            </p>

            <p>
              This site is my attempt to turn hard-earned lessons into a clearer path—so the next homeowner can renovate, maintain, and enjoy their home with more confidence.
            </p>
          </div>
        </FadeInSection>

        <FadeInSection delay={200}>
          <div className="mt-12 p-8 bg-basalt-50 rounded-card">
            <h2 className="font-serif text-2xl text-sandstone mb-4">
              Our Mission
            </h2>
            <p className="text-cream/70 italic">
              Great pros matter. This site helps homeowners show up informed, so projects go better for everyone.
            </p>
          </div>
        </FadeInSection>

        <FadeInSection delay={300}>
          <div className="mt-12">
            <h2 className="font-serif text-2xl text-sandstone mb-6">
              What We Believe
            </h2>
            <ul className="space-y-4 text-cream/80">
              <li className="flex gap-4">
                <span className="text-sandstone">01</span>
                <span>Informed homeowners make better partners for contractors.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-sandstone">02</span>
                <span>Trust should be earned through verified work, not just marketing.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-sandstone">03</span>
                <span>Hawaiʻi&apos;s unique conditions deserve locally-tailored guidance.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-sandstone">04</span>
                <span>Real stories teach more than glossy before-and-afters.</span>
              </li>
            </ul>
          </div>
        </FadeInSection>
      </div>
    </div>
  )
}
