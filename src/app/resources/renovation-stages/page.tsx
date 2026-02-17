import type { Metadata } from 'next'
import Link from 'next/link'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { RenovationStagesFlowchart } from '@/components/guides/RenovationStagesFlowchart'
import { Card } from '@/components/ui/Card'
import { breadcrumbSchema, faqSchema } from '@/lib/structured-data'
import { RENOVATION_STAGES } from '@/data/renovation-stages'

export const metadata: Metadata = {
  title: 'Plan Your Renovation — What Happens When & What to Decide',
  description:
    'A stage-by-stage guide to every phase of a home renovation in Hawaiʻi. See what happens, what you need to decide, and what to watch out for — from planning to punch list.',
}

const FAQ_ITEMS = [
  {
    question: 'How many stages are in a typical renovation?',
    answer:
      'This guide covers 8 stages: Plan & Budget, Design & Scope, Permits & Scheduling, Order Early, Demo & Prep, Rough-In, Finishes & Install, and Punch List & Closeout. Not every renovation goes through all 8 — smaller projects may skip some stages.',
  },
  {
    question: 'Why does ordering matter so much in Hawaiʻi?',
    answer:
      'Shipping to Hawaiʻi adds 4–8 weeks beyond mainland lead times and costs 15–30% more. If you run short on tile or a fixture arrives damaged, the replacement delay can stall your entire project. Ordering early with overage is critical.',
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
    { name: 'Guides', href: '/resources' },
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
          {/* Visible breadcrumb */}
          <nav className="text-xs text-cream/40 mb-6" aria-label="Breadcrumb">
            <Link href="/resources" className="hover:text-cream/60 transition-colors">
              Guides
            </Link>
            <span className="mx-2">/</span>
            <span className="text-cream/60">Plan Your Renovation</span>
          </nav>

          <FadeInSection>
            <h1 className="font-serif text-4xl md:text-5xl text-sandstone mb-6 text-center">
              Plan Your Renovation
            </h1>
            <p className="text-lg text-cream/70 mb-4 max-w-3xl mx-auto text-center leading-relaxed">
              Every renovation follows a sequence. Understanding what happens at each
              stage&mdash;and what you need to decide before it starts&mdash;helps you
              avoid surprises, change orders, and delays.
            </p>
            <p className="text-cream/50 text-sm mb-12 max-w-2xl mx-auto text-center">
              {RENOVATION_STAGES.length} stages &middot; Hawai&#x02BB;i-specific notes throughout
            </p>
          </FadeInSection>

          <FadeInSection delay={100}>
            <RenovationStagesFlowchart stages={RENOVATION_STAGES} />
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
                Ready to start tracking?
              </h2>
              <p className="text-cream/50 text-sm mb-6 text-center">
                These free tools help you put the stages into action for your project.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card
                  href="/tools/finish-decisions"
                  title="Decision Tracker"
                  description="Track every material and finish decision by room. Free to use&mdash;no sign-in required."
                />
                <Card
                  href="/tools/before-you-sign"
                  title="Contract Comparison Tool"
                  description="Compare contractor quotes, assign who handles what, and agree on the details before you start."
                />
              </div>
            </div>
          </FadeInSection>
        </div>
      </div>
    </>
  )
}
