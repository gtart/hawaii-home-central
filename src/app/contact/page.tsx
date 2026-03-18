import type { Metadata } from 'next'
import { FadeInSection } from '@/components/effects/FadeInSection'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Have feedback, a story, or a pro we should know about? Get in touch with Hawaii Home Central.',
}

export default function ContactPage() {
  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <FadeInSection>
          <h1 className="font-serif text-4xl md:text-5xl text-sandstone mb-6">
            Get in Touch
          </h1>
          <p className="text-lg text-cream/70 mb-12">
            Have feedback, a renovation story, a tip, or a great pro we should know about? We&apos;d genuinely love to hear from you.
          </p>
        </FadeInSection>

        <FadeInSection delay={100}>
          <div className="bg-basalt-50 rounded-card p-8 mb-8">
            <h2 className="font-serif text-2xl text-cream mb-6">
              Email Us
            </h2>
            <a
              href="mailto:hello@hawaiihomecentral.com"
              className="text-2xl text-sandstone hover:text-sandstone-light transition-colors"
            >
              hello@hawaiihomecentral.com
            </a>
            <p className="mt-4 text-cream/50 text-sm">
              We read everything and try to respond within a couple days.
            </p>
          </div>
        </FadeInSection>

        <FadeInSection delay={200}>
          <div className="bg-basalt-50 rounded-card p-8">
            <h2 className="font-serif text-2xl text-cream mb-4">
              Share Your Story
            </h2>
            <p className="text-cream/70 mb-4">
              Went through a renovation in Hawai&#x02BB;i? We&apos;re collecting real stories&mdash;the good, the bad, and the &quot;I wish someone had told me.&quot; Your experience might save someone else a lot of headaches.
            </p>
            <p className="text-cream/50 text-sm">
              Just email us with &quot;My Story&quot; in the subject line.
            </p>
          </div>
        </FadeInSection>

        <FadeInSection delay={300}>
          <div className="mt-12 text-cream/50 text-sm">
            <p>
              Based in Hawai&#x02BB;i. Built for Hawai&#x02BB;i homeowners.
            </p>
          </div>
        </FadeInSection>
      </div>
    </div>
  )
}
