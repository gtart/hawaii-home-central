import { Card } from '@/components/ui/Card'
import { FadeInSection } from '@/components/effects/FadeInSection'

const FEATURES = [
  {
    title: 'Lessons From Real Renovations',
    description: 'Real stories from Hawaiʻi homeowners—what worked, what didn\'t, and what they wish they knew earlier.',
    href: '/stories',
    badge: 'Coming Soon',
  },
  {
    title: 'Hawaiʻi Playbooks',
    description: 'Step-by-step guides for common projects, tailored for local conditions, regulations, and best practices.',
    href: '/resources',
    badge: 'Live',
  },
  {
    title: 'Trusted Pros Directory',
    description: 'A curated directory of vetted contractors and trades, built on real referrals and verified work.',
    href: '/directory',
    badge: 'Coming Soon',
  },
  {
    title: 'Homeowner Tools',
    description: 'Practical tools to help you stay organized: bid checklists, project binders, upkeep reminders, and more.',
    href: '/resources',
    badge: 'Coming Soon',
  },
]

export function FeatureCards() {
  return (
    <section
      className="py-24 px-6"
      aria-labelledby="features-heading"
    >
      <div className="max-w-6xl mx-auto">
        <FadeInSection>
          <h2
            id="features-heading"
            className="font-serif text-3xl md:text-4xl text-sandstone mb-4 text-center"
          >
            What&apos;s Coming
          </h2>
          <p className="text-cream/60 text-center mb-12 max-w-2xl mx-auto">
            We&apos;re building the resources we wished existed when we started our own renovation journeys.
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
      </div>
    </section>
  )
}
