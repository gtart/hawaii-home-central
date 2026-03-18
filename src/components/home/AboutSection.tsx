'use client'

import { FadeInSection } from '@/components/effects/FadeInSection'

export function AboutSection() {
  return (
    <section
      className="py-24 px-6 bg-basalt-50"
      aria-labelledby="about-heading"
    >
      <FadeInSection className="max-w-3xl mx-auto">
        <h2
          id="about-heading"
          className="font-serif text-3xl md:text-4xl text-sandstone mb-8 text-center"
        >
          Why Hawaii Home Central?
        </h2>

        <div className="space-y-5 text-cream/80 leading-relaxed">
          <p className="text-lg md:text-xl text-cream/90 font-medium">
            We built this site because taking care of a home can be a pain in the a$$.
          </p>

          <p>
            Repairs are expensive. Renovating is stressful. And the list of things to deal with somehow never gets shorter.
          </p>

          <p>
            So we wanted to build something actually useful for Hawai&#x02BB;i homeowners: free tools and resources to help with renovation projects, repairs, and ongoing home upkeep.
          </p>

          <p>
            We&apos;re still figuring out what&apos;s most helpful, so the site will keep changing as we learn and get feedback.
          </p>

          <p>
            Got ideas, feedback, story tips, or great pros we should know about?{' '}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event('open-feedback-form'))}
              className="text-sandstone hover:text-sandstone-light transition-colors underline underline-offset-2"
            >
              Send them our way
            </button>.
          </p>
        </div>

        <p className="mt-8 text-sandstone/80 text-center italic">
          We&apos;re also working on a Pro Directory and sharing renovation stories from across Hawai&#x02BB;i.
        </p>
      </FadeInSection>
    </section>
  )
}
