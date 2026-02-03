import type { Metadata } from 'next'
import { FadeInSection } from '@/components/effects/FadeInSection'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with Hawaii Home Central. We\'d love to hear from you.',
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
            Whether you have a question, want to share your renovation story, or just want to say aloha—we&apos;d love to hear from you.
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
              We typically respond within 1-2 business days.
            </p>
          </div>
        </FadeInSection>

        <FadeInSection delay={200}>
          <div className="bg-basalt-50 rounded-card p-8">
            <h2 className="font-serif text-2xl text-cream mb-4">
              Share Your Story
            </h2>
            <p className="text-cream/70 mb-4">
              Have a renovation experience you&apos;d like to share? We&apos;re always looking for real stories from Hawaiʻi homeowners. Your experience could help others navigate their own projects.
            </p>
            <p className="text-cream/50 text-sm">
              Drop us an email with &quot;My Story&quot; in the subject line.
            </p>
          </div>
        </FadeInSection>

        <FadeInSection delay={300}>
          <div className="mt-12 text-cream/50 text-sm">
            <p>
              Based in Hawaiʻi. Built for Hawaiʻi homeowners.
            </p>
          </div>
        </FadeInSection>
      </div>
    </div>
  )
}
