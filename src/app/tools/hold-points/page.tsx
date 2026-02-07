import type { Metadata } from 'next'
import Link from 'next/link'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { Button } from '@/components/ui/Button'
import { breadcrumbSchema, faqSchema } from '@/lib/structured-data'

export const metadata: Metadata = {
  title: 'Hold Points Tool \u2014 Lock Specs Before Construction Moves On',
  description:
    'Free interactive tool: track the spec decisions that must be locked before each construction stage. 5 stages, 24 hold-point items, with Hawai\u02BBi-specific callouts for island renovations.',
}

const FAQ_ITEMS = [
  {
    question: 'What is a hold point in construction?',
    answer:
      'A hold point is a stage in construction where work should not proceed until certain decisions are resolved. Once you pass a hold point, changes become expensive, disruptive, or impossible.',
  },
  {
    question: 'Why do hold points matter for Hawai\u02BBi renovations?',
    answer:
      'Hawai\u02BBi renovations face unique challenges: shipping delays for materials (add 4\u20138 weeks), limited local stock for appliances and fixtures, salt-air corrosion requiring marine-grade materials, and humidity considerations for finishes. Locking decisions early is even more critical when lead times are longer.',
  },
  {
    question: 'How many hold points does a typical kitchen or bath renovation have?',
    answer:
      'This tool covers 24 hold-point items across 5 construction stages: Order Long-Lead, Rough-In, Close Walls, Waterproof / Tile, and Closeout. Each item represents a decision that must be finalized before that stage begins.',
  },
]

export default function HoldPointsLandingPage() {
  const breadcrumb = breadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Tools', href: '/tools' },
    { name: 'Hold Points', href: '/tools/hold-points' },
  ])
  const faq = faqSchema(FAQ_ITEMS)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
      />
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <FadeInSection>
            <h1 className="font-serif text-4xl md:text-5xl text-sandstone mb-6">
              Hold Points
            </h1>
            <p className="text-lg text-cream/70 mb-8 leading-relaxed">
              The costliest renovation mistakes happen when decisions are made after construction moves on. This tool shows what must be locked in before each stage&mdash;so you catch gaps before they become change orders.
            </p>
          </FadeInSection>

          <FadeInSection delay={100}>
            <div className="bg-basalt-50 rounded-card p-6 mb-8">
              <h2 className="font-serif text-xl text-sandstone mb-3">
                What this tool does
              </h2>
              <p className="text-cream/70 text-sm leading-relaxed mb-3">
                Hold Points walks you through 5 construction stages&mdash;from ordering long-lead items through closeout&mdash;with 24 spec decisions that need to be locked before each stage begins. Each item explains why it matters, what it impacts, and what to ask your contractor.
              </p>
              <p className="text-cream/60 text-sm leading-relaxed">
                Items with Hawai&#x02BB;i-specific callouts flag local considerations: shipping timelines, salt-air corrosion, humidity, termite exposure, and island permitting requirements.
              </p>
            </div>
          </FadeInSection>

          <FadeInSection delay={200}>
            <div className="bg-basalt-50 rounded-card p-6 mb-8">
              <h2 className="font-serif text-xl text-sandstone mb-4">
                Key features
              </h2>
              <ul className="text-cream/60 space-y-2 text-sm">
                <li className="flex gap-3">
                  <span className="text-sandstone shrink-0">&rarr;</span>
                  <span>5 construction stages from ordering through closeout</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-sandstone shrink-0">&rarr;</span>
                  <span>24 spec decisions organized by category and stage</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-sandstone shrink-0">&rarr;</span>
                  <span>Expandable detail: why it matters, what it impacts, and what to ask</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-sandstone shrink-0">&rarr;</span>
                  <span>Hawai&#x02BB;i-specific callouts for island conditions</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-sandstone shrink-0">&rarr;</span>
                  <span>Progress saved to your account across devices</span>
                </li>
              </ul>
            </div>
          </FadeInSection>

          <FadeInSection delay={300}>
            <div className="bg-basalt-50 rounded-card p-6 mb-8">
              <h2 className="font-serif text-xl text-sandstone mb-4">
                Frequently asked questions
              </h2>
              <div className="space-y-4">
                {FAQ_ITEMS.map((item) => (
                  <div key={item.question}>
                    <h3 className="text-cream/80 text-sm font-medium mb-1">
                      {item.question}
                    </h3>
                    <p className="text-cream/50 text-sm leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </FadeInSection>

          <FadeInSection delay={400}>
            <div className="text-center">
              <Link href="/login?callbackUrl=/app/tools/hold-points">
                <Button size="lg">
                  Sign in to use this tool &rarr;
                </Button>
              </Link>
              <p className="text-cream/40 text-xs mt-3">
                Free to use. Google sign-in. No spam.
              </p>
            </div>
          </FadeInSection>
        </div>
      </div>
    </>
  )
}
