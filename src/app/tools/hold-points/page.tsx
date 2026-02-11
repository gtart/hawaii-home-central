import type { Metadata } from 'next'
import Link from 'next/link'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { Button } from '@/components/ui/Button'
import { breadcrumbSchema, faqSchema } from '@/lib/structured-data'
import { HOLD_POINT_STAGES } from '@/data/hold-points'

export const metadata: Metadata = {
  title: 'Hold Points Tool — Lock Specs Before Construction Moves On',
  description:
    'Free interactive tool: track the spec decisions that must be locked before each construction stage. 5 stages, 23 hold-point items, with Hawaiʻi-specific callouts for island renovations.',
}

const FAQ_ITEMS = [
  {
    question: 'What is a hold point in construction?',
    answer:
      'A hold point is a stage in construction where work should not proceed until certain decisions are resolved. Once you pass a hold point, changes become expensive, disruptive, or impossible.',
  },
  {
    question: 'Why do hold points matter for Hawaiʻi renovations?',
    answer:
      'Hawaiʻi renovations face unique challenges: shipping delays for materials (add 4–8 weeks), limited local stock for appliances and fixtures, salt-air corrosion requiring marine-grade materials, and humidity considerations for finishes. Locking decisions early is even more critical when lead times are longer.',
  },
  {
    question: 'How many hold points does a typical kitchen or bath renovation have?',
    answer:
      'This tool covers 23 hold-point items across 5 construction stages: Order Long-Lead, Rough-In, Close Walls, Waterproof / Tile, and Closeout. Each item represents a decision that must be finalized before that stage begins.',
  },
]

// Show first 8 items across stages as a preview
const PREVIEW_ITEMS = HOLD_POINT_STAGES.flatMap((stage) =>
  stage.items.slice(0, 2).map((item) => ({ ...item, stageTitle: stage.title }))
).slice(0, 8)

const PREVIEW_CALLOUTS = HOLD_POINT_STAGES.flatMap((stage) =>
  stage.items.filter((item) => item.hawaiiCallout)
).slice(0, 3)

export default function HoldPointsLandingPage() {
  const breadcrumb = breadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Tools', href: '/tools' },
    { name: 'Hold Points', href: '/tools/hold-points' },
  ])
  const faq = faqSchema(FAQ_ITEMS)

  const totalItems = HOLD_POINT_STAGES.reduce((sum, s) => sum + s.items.length, 0)
  const totalCallouts = HOLD_POINT_STAGES.reduce(
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
              Hold Points
            </h1>
            <p className="text-lg text-cream/70 mb-4 leading-relaxed">
              The costliest renovation mistakes happen when decisions are made after construction moves on. This tool shows what must be locked in before each stage&mdash;so you catch gaps before they become change orders.
            </p>
            <p className="text-cream/50 text-sm mb-8">
              {HOLD_POINT_STAGES.length} stages &middot; {totalItems} decisions &middot; {totalCallouts} Hawai&#x02BB;i callouts &middot;{' '}
              <Link href="/resources/playbooks/hold-points" className="text-sandstone/70 hover:text-sandstone underline">
                Read the full guide free &rarr;
              </Link>
            </p>
          </FadeInSection>

          {/* Data preview */}
          <FadeInSection delay={50}>
            <div className="bg-basalt-50 rounded-card p-6 mb-8">
              <h2 className="font-serif text-xl text-sandstone mb-4">
                Preview: What&rsquo;s inside
              </h2>
              <div className="space-y-3">
                {PREVIEW_ITEMS.map((item) => (
                  <div key={item.id} className="py-3 border-b border-cream/5 last:border-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-cream/10 text-cream/40">
                        {item.stageTitle}
                      </span>
                      <span className="text-sandstone/70 text-xs font-medium">{item.category}</span>
                    </div>
                    <p className="text-cream/80 text-sm leading-relaxed">{item.summary}</p>
                    <p className="text-cream/50 text-xs mt-1 leading-relaxed">{item.why}</p>
                  </div>
                ))}
              </div>
              <p className="text-cream/40 text-xs mt-4 pt-3 border-t border-cream/5">
                + {totalItems - PREVIEW_ITEMS.length} more decisions across {HOLD_POINT_STAGES.length} stages
              </p>
            </div>
          </FadeInSection>

          {/* Hawaii callout preview */}
          <FadeInSection delay={100}>
            <div className="bg-basalt-50 rounded-card p-6 mb-8">
              <h2 className="font-serif text-xl text-sandstone mb-4">
                Hawai&#x02BB;i-specific callouts
              </h2>
              <div className="space-y-3">
                {PREVIEW_CALLOUTS.map((item) => (
                  <div key={item.id} className="bg-sandstone/10 border border-sandstone/20 rounded-lg p-3">
                    <p className="text-sandstone/90 text-xs font-medium mb-1">{item.category}</p>
                    <p className="text-cream/60 text-xs leading-relaxed">{item.hawaiiCallout}</p>
                  </div>
                ))}
              </div>
              <p className="text-cream/40 text-xs mt-4">
                {totalCallouts} items include island-specific guidance
              </p>
            </div>
          </FadeInSection>

          {/* What you get when you sign in */}
          <FadeInSection delay={150}>
            <div className="bg-basalt-50 rounded-card p-6 mb-8">
              <h2 className="font-serif text-xl text-sandstone mb-4">
                What you get when you sign in
              </h2>
              <ul className="text-cream/60 space-y-2 text-sm">
                <li className="flex gap-3">
                  <span className="text-sandstone shrink-0">&rarr;</span>
                  <span>Interactive checkboxes to mark decisions as locked</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-sandstone shrink-0">&rarr;</span>
                  <span>Notes field for each item to document agreements</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-sandstone shrink-0">&rarr;</span>
                  <span>Progress summary showing how many decisions remain</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-sandstone shrink-0">&rarr;</span>
                  <span>Saved to your account&mdash;pick up on any device</span>
                </li>
              </ul>
            </div>
          </FadeInSection>

          {/* FAQ */}
          <FadeInSection delay={200}>
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

          <FadeInSection delay={250}>
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
