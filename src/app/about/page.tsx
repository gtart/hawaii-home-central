import type { Metadata } from 'next'
import { FadeInSection } from '@/components/effects/FadeInSection'

export const metadata: Metadata = {
  title: 'About',
  description: 'Hawaii Home Central is a free set of tools and resources for Hawaiʻi homeowners dealing with renovations, repairs, and home upkeep.',
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
          <div className="space-y-5 text-cream/80 leading-relaxed">
            <p className="text-lg md:text-xl text-cream/90 font-medium">
              We built this site because taking care of a home can be a pain in the a$$.
            </p>

            <p>
              Repairs are expensive. Renovating is stressful. And the list of things to deal with somehow never gets shorter&mdash;especially in Hawai&#x02BB;i, where everything costs more, takes longer, and comes with its own set of surprises.
            </p>

            <p>
              So we wanted to build something actually useful: free tools and resources to help Hawai&#x02BB;i homeowners stay organized during renovation projects, keep track of repairs, and deal with ongoing home upkeep without losing their minds.
            </p>

            <p>
              We&apos;re still figuring out what&apos;s most helpful, so the site will keep changing as we learn and get feedback. If something&apos;s broken or missing, that&apos;s probably because we haven&apos;t gotten to it yet.
            </p>
          </div>
        </FadeInSection>

        <FadeInSection delay={200}>
          <div className="mt-12 p-8 bg-basalt-50 rounded-card">
            <h2 className="font-serif text-2xl text-sandstone mb-4">
              Our Mission
            </h2>
            <p className="text-cream/70 italic">
              Help homeowners show up more organized and informed&mdash;so projects go better for everyone, including the pros.
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
                <span>Organized homeowners make better partners for contractors.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-sandstone">02</span>
                <span>Trust should be earned through real work, not just marketing.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-sandstone">03</span>
                <span>Hawai&#x02BB;i&apos;s conditions are unique and deserve locally-tailored guidance.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-sandstone">04</span>
                <span>Real stories from real homeowners are more useful than glossy before-and-afters.</span>
              </li>
            </ul>
          </div>
        </FadeInSection>

        <FadeInSection delay={400}>
          <div className="mt-12 p-8 bg-basalt-50 rounded-card text-center">
            <p className="text-cream/70 mb-3">
              Got ideas, feedback, story tips, or great pros we should know about?
            </p>
            <a
              href="mailto:hello@hawaiihomecentral.com"
              className="text-lg text-sandstone hover:text-sandstone-light transition-colors font-medium"
            >
              hello@hawaiihomecentral.com
            </a>
          </div>
        </FadeInSection>
      </div>
    </div>
  )
}
