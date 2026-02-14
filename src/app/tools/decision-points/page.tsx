import type { Metadata } from 'next'
import Link from 'next/link'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { DecisionStagesOverview } from '@/components/resources/DecisionStagesOverview'
import { breadcrumbSchema, faqSchema } from '@/lib/structured-data'
import { DECISION_POINT_STAGES } from '@/data/decision-points'

export const metadata: Metadata = {
  title: 'Decision Stages Overview — Renovation Timeline & What to Decide When',
  description:
    'Understand the renovation timeline and what needs to be decided before each construction stage. 5 stages, 24 decisions, with Hawaiʻi-specific callouts for island renovations.',
}

const FAQ_ITEMS = [
  {
    question: 'What is a decision stage in construction?',
    answer:
      'A decision stage is a point in construction where work should not proceed until certain choices are locked in. Once you pass a stage, changes become expensive, disruptive, or impossible.',
  },
  {
    question: 'Why do decision stages matter for Hawaiʻi renovations?',
    answer:
      'Hawaiʻi renovations face unique challenges: shipping delays for materials (add 4–8 weeks), limited local stock for appliances and fixtures, salt-air corrosion requiring marine-grade materials, and humidity considerations for finishes. Locking decisions early is even more critical when lead times are longer.',
  },
  {
    question: 'How many decisions does a typical kitchen or bath renovation involve?',
    answer:
      'This overview covers 24 decisions across 5 construction stages: Order Long-Lead, Rough-In, Close Walls, Waterproof / Tile, and Closeout. Each represents a decision that must be finalized before that stage begins.',
  },
]

export default function DecisionStagesPage() {
  const breadcrumb = breadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Tools', href: '/tools' },
    { name: 'Decision Stages Overview', href: '/tools/decision-points' },
  ])
  const faq = faqSchema(FAQ_ITEMS)

  const totalItems = DECISION_POINT_STAGES.reduce((sum, s) => sum + s.items.length, 0)
  const totalCallouts = DECISION_POINT_STAGES.reduce(
    (sum, s) => sum + s.items.filter((i) => i.hawaiiCallout).length,
    0
  )

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
              Decision Stages Overview
            </h1>
            <p className="text-lg text-cream/70 mb-4 leading-relaxed">
              Understand the renovation timeline and what needs to be decided before
              each construction stage&mdash;so you catch gaps before they become change orders.
            </p>
            <p className="text-cream/50 text-sm mb-8">
              {DECISION_POINT_STAGES.length} stages &middot; {totalItems} decisions &middot; {totalCallouts} Hawai&#x02BB;i callouts &middot;{' '}
              <Link href="/resources/playbooks/decision-points" className="text-sandstone/70 hover:text-sandstone underline">
                Read the full guide free &rarr;
              </Link>
            </p>
          </FadeInSection>

          <FadeInSection delay={100}>
            <DecisionStagesOverview
              stages={DECISION_POINT_STAGES}
            />
          </FadeInSection>

          {/* FAQ */}
          <FadeInSection delay={200}>
            <div className="bg-basalt-50 rounded-card p-6 mt-10">
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
        </div>
      </div>
    </>
  )
}
