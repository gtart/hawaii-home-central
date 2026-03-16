import { Card } from '@/components/ui/Card'
import { FadeInSection } from '@/components/effects/FadeInSection'

const FEATURES = [
  {
    title: 'Fix List',
    description:
      'Track punch list items, walkthrough notes, and loose ends — nothing slips through the cracks.',
    href: '/tools',
    badge: 'Live',
  },
  {
    title: 'Selections',
    description:
      'Save your finish choices, product links, and notes so decisions don\u2019t get lost in texts.',
    href: '/tools',
  },
  {
    title: 'Plan & Changes',
    description:
      'Keep a clear record of what was agreed on and what changed during the build.',
    href: '/tools',
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
            Practical tools for the messy parts
          </h2>
          <p className="text-cream/60 text-center mb-12 max-w-2xl mx-auto">
            Simple, focused tools for the things that usually get lost during a renovation.
          </p>
        </FadeInSection>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FEATURES.map((feature, index) => (
            <FadeInSection key={feature.title} delay={index * 100}>
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
            Plus step-by-step renovation guides to help you plan ahead.
          </p>
        </FadeInSection>
      </div>
    </section>
  )
}
