import { Card } from '@/components/ui/Card'
import { FadeInSection } from '@/components/effects/FadeInSection'

const FEATURES = [
  {
    title: 'Guides & Tools',
    description:
      'Interactive tools and step-by-step guides tailored for Hawaiʻi conditions and regulations.',
    href: '/hawaii-home-renovation',
    badge: 'Live',
  },
  {
    title: 'Lessons From Real Renovations',
    description:
      'Real stories from Hawaiʻi homeowners — what worked, what didn\'t, and what they wish they knew.',
    href: '/stories',
  },
  {
    title: 'Trusted Pros Directory',
    description:
      'A curated directory of vetted contractors and trades, built on real referrals and verified work.',
    href: '/directory',
  },
]

export function FeatureCards() {
  return (
    <section className="py-24 px-6" aria-labelledby="features-heading">
      <div className="max-w-6xl mx-auto">
        <FadeInSection>
          <h2
            id="features-heading"
            className="font-serif text-3xl md:text-4xl text-sandstone mb-4 text-center"
          >
            What we help you do
          </h2>
          <p className="text-cream/60 text-center mb-12 max-w-2xl mx-auto">
            Guides, tools, and community&mdash;built for Hawai&#x02BB;i homeowners.
          </p>
        </FadeInSection>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FEATURES.map((feature, index) => (
            <FadeInSection key={feature.href} delay={index * 100}>
              <Card
                href={feature.href}
                title={feature.title}
                description={feature.description}
                badge={feature.badge}
              />
            </FadeInSection>
          ))}
        </div>

        <FadeInSection delay={300}>
          <p className="text-cream/40 text-sm text-center mt-8">
            Plus real renovation stories and a trusted pros directory.
          </p>
        </FadeInSection>
      </div>
    </section>
  )
}
