import type { Metadata } from 'next'
import Link from 'next/link'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { Button } from '@/components/ui/Button'
import { breadcrumbSchema, faqSchema } from '@/lib/structured-data'
import { RESPONSIBILITY_ITEMS, STAGES } from '@/data/responsibility-matrix'

export const metadata: Metadata = {
  title: 'Responsibility Matrix \u2014 Assign Who Owns Each Renovation Task',
  description:
    'Free interactive tool: assign ownership for 16 commonly-missed renovation responsibilities. Prevent handoff gaps between homeowner, contractor, and subs.',
}

const FAQ_ITEMS = [
  {
    question: 'What is a responsibility matrix for home renovation?',
    answer:
      'A responsibility matrix is a simple tool that assigns ownership for each task in a renovation project. It clarifies who handles what\u2014homeowner, general contractor, subcontractor, or vendor\u2014so nothing falls through the cracks between parties.',
  },
  {
    question: 'Why do renovation responsibilities get dropped between parties?',
    answer:
      'Most renovation disputes stem from assumptions, not bad intent. The homeowner assumes the GC handles permits; the GC assumes the homeowner ordered the fixtures. A responsibility matrix makes these assumptions explicit before work begins.',
  },
  {
    question: 'How is this different from a scope of work?',
    answer:
      'A scope of work describes what will be done. A responsibility matrix describes who does it. They\u2019re complementary\u2014the scope defines the tasks, and the matrix assigns them. This tool focuses on the 16 tasks most commonly left unassigned.',
  },
]

const highVarianceItems = RESPONSIBILITY_ITEMS.filter((i) => i.variance === 'high')

// Preview: first 6 items
const PREVIEW_ITEMS = RESPONSIBILITY_ITEMS.slice(0, 6)

export default function ResponsibilityMatrixLandingPage() {
  const breadcrumb = breadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Tools', href: '/tools' },
    { name: 'Responsibility Matrix', href: '/tools/responsibility-matrix' },
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
              Responsibility Matrix
            </h1>
            <p className="text-lg text-cream/70 mb-4 leading-relaxed">
              Assign who owns the easy-to-miss tasks&mdash;so nothing gets assumed. Not a contract, just a clarity baseline to confirm handoffs before work begins.
            </p>
            <p className="text-cream/50 text-sm mb-8">
              {RESPONSIBILITY_ITEMS.length} tasks &middot; {STAGES.length} stages &middot; {highVarianceItems.length} high-variance &middot;{' '}
              <Link href="/resources/playbooks/responsibility-matrix" className="text-sandstone/70 hover:text-sandstone underline">
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
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-cream/80 text-sm font-medium">{item.category}</span>
                      {item.variance === 'high' && (
                        <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-sandstone/20 text-sandstone">
                          High variance
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-cream/50 mb-1">
                      <span>Often:</span>
                      <span className="text-cream/70 font-medium">{item.oftenOwner}</span>
                      <span className="text-cream/20">&middot;</span>
                      <span>{item.stage}</span>
                    </div>
                    <p className="text-cream/60 text-sm leading-relaxed italic">
                      &ldquo;{item.clarifyQuestion}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-cream/40 text-xs mt-4 pt-3 border-t border-cream/5">
                + {RESPONSIBILITY_ITEMS.length - PREVIEW_ITEMS.length} more tasks across {STAGES.length} stages
              </p>
            </div>
          </FadeInSection>

          {/* High-variance callout */}
          <FadeInSection delay={100}>
            <div className="bg-basalt-50 rounded-card p-6 mb-8">
              <h2 className="font-serif text-xl text-sandstone mb-3">
                High-variance items
              </h2>
              <p className="text-cream/50 text-xs mb-4">
                These {highVarianceItems.length} tasks vary the most between projects&mdash;especially in Hawai&#x02BB;i where contractor availability is limited and informal handoff assumptions are more common.
              </p>
              <div className="space-y-2">
                {highVarianceItems.slice(0, 4).map((item) => (
                  <div key={item.id} className="bg-sandstone/10 border border-sandstone/20 rounded-lg p-3">
                    <p className="text-sandstone/90 text-xs font-medium mb-1">{item.category}</p>
                    <p className="text-cream/60 text-xs leading-relaxed">{item.commonMismatch}</p>
                  </div>
                ))}
              </div>
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
                  <span>Assign owners from a dropdown for each task</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-sandstone shrink-0">&rarr;</span>
                  <span>Notes field to document specific agreements</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-sandstone shrink-0">&rarr;</span>
                  <span>&ldquo;Fill with typical&rdquo; to start from common defaults</span>
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
              <Link href="/login?callbackUrl=/app/tools/responsibility-matrix">
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
