import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { RenovationStagesFlowchart } from '@/components/guides/RenovationStagesFlowchart'
import { Card } from '@/components/ui/Card'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { breadcrumbSchema, faqSchema } from '@/lib/structured-data'
import { RENOVATION_STAGES } from '@/data/renovation-stages'

export const metadata: Metadata = {
  title: 'Plan Your Renovation — What Happens When & What to Decide',
  description:
    'A stage-by-stage guide to every phase of a home renovation in Hawaiʻi. See what happens, what you need to decide, and what to watch out for — from planning to closeout.',
}

const FAQ_ITEMS = [
  {
    question: 'How many stages are in a typical renovation?',
    answer:
      'This guide covers 5 stages: Plan, Hire & Contract, Permits & Schedule, Decide & Order, and Build & Closeout. Real projects often overlap stages — use this as a guide, not a rigid checklist.',
  },
  {
    question: 'Why does ordering matter so much in Hawaiʻi?',
    answer:
      'Shipping to Hawaiʻi commonly adds 4–8 weeks beyond mainland lead times and can cost 15–30% more. If you run short on tile or a fixture arrives damaged, the replacement delay can stall your entire project. Ordering early with overage is critical.',
  },
  {
    question: 'When should I lock in my material selections?',
    answer:
      'Long-lead items (cabinets, appliances, windows, specialty tile) should be ordered before demolition begins. Plumbing fixtures need to be confirmed before rough-in. Paint and hardware can wait until the finishes stage.',
  },
]

export default function RenovationStagesPage() {
  const breadcrumb = breadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Renovation Guides', href: '/hawaii-home-renovation' },
    { name: 'Plan Your Renovation', href: '/resources/renovation-stages' },
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
        <div className="max-w-4xl mx-auto">
          <Breadcrumbs items={[{ label: 'Renovation Guides', href: '/hawaii-home-renovation' }, { label: 'Plan Your Renovation' }]} />

          <FadeInSection>
            <h1 className="font-serif text-4xl md:text-5xl text-sandstone mb-6 text-center">
              Plan Your Renovation
            </h1>
            <p className="text-lg text-cream/70 mb-4 max-w-3xl mx-auto text-center leading-relaxed">
              Every renovation follows a sequence. Understanding what happens at each
              stage&mdash;and what you need to decide before it starts&mdash;helps you
              avoid surprises, change orders, and delays.
            </p>
            <p className="text-cream/50 text-sm mb-2 max-w-2xl mx-auto text-center">
              {RENOVATION_STAGES.length} stages &middot; Hawai&#x02BB;i-specific notes throughout
            </p>
            <p className="text-cream/40 text-xs mb-12 max-w-2xl mx-auto text-center">
              Use this as a guide&mdash;real projects overlap stages.
            </p>
          </FadeInSection>

          <FadeInSection delay={100}>
            <Suspense fallback={null}>
              <RenovationStagesFlowchart stages={RENOVATION_STAGES} />
            </Suspense>
          </FadeInSection>

          {/* FAQ */}
          <FadeInSection delay={200}>
            <div className="bg-basalt-50 rounded-card p-6 mt-12">
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

          {/* Tool CTAs */}
          <FadeInSection delay={300}>
            <div className="mt-12">
              <h2 className="font-serif text-2xl text-cream mb-2 text-center">
                These stages also have interactive tools
              </h2>
              <p className="text-cream/50 text-sm mb-6 text-center">
                Sign in to track selections, compare bids, and manage your renovation in one place.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                <Card
                  href="/login?callbackUrl=/app/tools/finish-decisions"
                  title="Selections List"
                  description="Track every selection and status in one place."
                />
                <Card
                  href="/login?callbackUrl=/app/tools/before-you-sign"
                  title="Contract Checklist"
                  description="Walk through each bid with the same checklist."
                />
                <Card
                  href="/login?callbackUrl=/app/tools/punchlist"
                  title="Fix List"
                  description="Track fixes and share with your contractor."
                />
              </div>
              <p className="text-center">
                <Link href="/tools" className="text-sandstone hover:text-sandstone-light text-sm transition-colors">
                  Learn what you get in Tools &rarr;
                </Link>
              </p>
            </div>
          </FadeInSection>
        </div>
      </div>
    </>
  )
}
