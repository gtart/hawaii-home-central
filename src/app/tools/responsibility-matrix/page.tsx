import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { Button } from '@/components/ui/Button'
import { breadcrumbSchema, faqSchema } from '@/lib/structured-data'
import { RESPONSIBILITY_ITEMS, STAGES } from '@/data/responsibility-matrix'
import { auth } from '@/auth'
import { ResponsibilityPublicContent } from './ResponsibilityPublicContent'

export const metadata: Metadata = {
  title: 'Who Handles What — Renovation Task Ownership for Hawaiʻi',
  description:
    'Free interactive tool: assign ownership for 16 commonly-missed renovation responsibilities. Prevent handoff gaps between homeowner, contractor, and subs.',
}

const FAQ_ITEMS = [
  {
    question: 'Why do renovation responsibilities get dropped between parties?',
    answer:
      'Most renovation disputes stem from assumptions, not bad intent. The homeowner assumes the GC handles permits; the GC assumes the homeowner ordered the fixtures. Assigning ownership upfront makes these assumptions explicit before work begins.',
  },
  {
    question: 'How is this different from a scope of work?',
    answer:
      'A scope of work describes what will be done. This tool describes who does it. They\u2019re complementary\u2014the scope defines the tasks, and this assigns them. It focuses on the 16 tasks most commonly left unassigned.',
  },
  {
    question: 'Is this a legal document?',
    answer:
      'No. This is a clarity baseline\u2014a way to confirm handoffs before work begins. Once you\u2019ve agreed on who handles what, you can reference it in your contract or scope of work.',
  },
]

const highVarianceItems = RESPONSIBILITY_ITEMS.filter((i) => i.variance === 'high')

export default async function WhoHandlesWhatPage() {
  const session = await auth()
  if (session?.user) redirect('/app/tools/before-you-sign?tab=handoffs')

  const breadcrumb = breadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Tools', href: '/tools' },
    { name: 'Who Handles What', href: '/tools/responsibility-matrix' },
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
              Who Handles What
            </h1>
            <p className="text-lg text-cream/70 mb-4 leading-relaxed">
              Assign who owns the easy-to-miss tasks&mdash;so nothing gets
              assumed. Not a contract, just a clarity baseline to confirm
              handoffs before work begins.
            </p>
            <p className="text-cream/50 text-sm mb-8">
              {RESPONSIBILITY_ITEMS.length} tasks &middot; {STAGES.length} stages &middot; {highVarianceItems.length} high-variance &middot;{' '}
              <Link href="/resources/playbooks/responsibility-matrix" className="text-sandstone/70 hover:text-sandstone underline">
                Read the full guide &rarr;
              </Link>
            </p>
          </FadeInSection>

          <FadeInSection delay={50}>
            <div className="bg-basalt-50 rounded-card p-6 mb-8">
              <h2 className="font-serif text-xl text-sandstone mb-3">
                How to use this
              </h2>
              <p className="text-cream/70 text-sm leading-relaxed mb-3">
                Review each item and assign the responsible party for your
                project. The &ldquo;Often&rdquo; label shows who typically
                handles it, but every project is different.
              </p>
              <p className="text-cream/60 text-sm leading-relaxed italic">
                Your selections work on this page but aren&apos;t saved. Sign in for the full tool with persistence.
              </p>
            </div>
          </FadeInSection>

          <FadeInSection delay={100}>
            <ResponsibilityPublicContent />
          </FadeInSection>

          {/* Sign-in CTA */}
          <FadeInSection delay={150}>
            <div className="bg-basalt-50 rounded-card p-8 mt-8 text-center">
              <h2 className="font-serif text-2xl text-cream mb-3">
                Use the full tool
              </h2>
              <p className="text-cream/60 text-sm mb-6 max-w-lg mx-auto">
                Sign in to save your assignments across devices and access all Contract Comparison tools in one place.
              </p>
              <Link href="/login?callbackUrl=/app/tools/before-you-sign?tab=handoffs">
                <Button size="lg">
                  Sign in to get started &rarr;
                </Button>
              </Link>
              <p className="text-cream/40 text-xs mt-3">
                Free to use. Google sign-in. No spam.
              </p>
            </div>
          </FadeInSection>

          {/* FAQ */}
          <FadeInSection delay={200}>
            <div className="bg-basalt-50 rounded-card p-6 mt-8">
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
