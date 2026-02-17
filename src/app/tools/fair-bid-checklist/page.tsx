import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { Button } from '@/components/ui/Button'
import { breadcrumbSchema, faqSchema } from '@/lib/structured-data'
import { CHECKLIST_SECTIONS } from '@/data/fair-bid-checklist'
import { auth } from '@/auth'
import { FairBidPublicContent } from './FairBidPublicContent'

export const metadata: Metadata = {
  title: 'Compare Your Quotes — Apples-to-Apples Bid Checklist for Hawaiʻi',
  description:
    'Free interactive checklist: compare contractor bids fairly. 11 sections, 44 items covering scope, labor, materials, permits, and timeline. Built for Hawaiʻi homeowners.',
}

const FAQ_ITEMS = [
  {
    question: 'Why can\u2019t I just compare the bottom-line price on each bid?',
    answer:
      'Bottom-line price comparisons are misleading because bids often exclude different items. One bid might include demolition, permits, and dumpster fees while another assumes you\u2019ll handle them. This checklist surfaces those gaps so you\u2019re comparing the same scope.',
  },
  {
    question: 'What are the most commonly missed items in a contractor bid?',
    answer:
      'The most commonly missed items include: demolition scope and debris removal, permit fees and inspection costs, material allowances vs. actual selections, change-order pricing terms, warranty terms and exclusions, and final cleaning. In Hawai\u02BBi, hazmat abatement for older homes is another frequent gap.',
  },
  {
    question: 'How many items should I check before signing a contract?',
    answer:
      'Focus on the essential items first\u2014these cover the areas where gaps cause the most disputes. The remaining nice-to-know items provide additional protection but aren\u2019t deal-breakers for every project.',
  },
]

const totalItems = CHECKLIST_SECTIONS.reduce((sum, s) => sum + s.items.length, 0)
const essentialItems = CHECKLIST_SECTIONS.reduce(
  (sum, s) => sum + s.items.filter((i) => i.priority === 'essential').length,
  0
)
const calloutItems = CHECKLIST_SECTIONS.reduce(
  (sum, s) => sum + s.items.filter((i) => i.hawaiiCallout).length,
  0
)

export default async function CompareYourQuotesPage() {
  const session = await auth()
  if (session?.user) redirect('/app/tools/before-you-sign?tab=quotes')

  const breadcrumb = breadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Tools', href: '/tools' },
    { name: 'Compare Your Quotes', href: '/tools/fair-bid-checklist' },
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
              Compare Your Quotes
            </h1>
            <p className="text-lg text-cream/70 mb-4 leading-relaxed">
              Make sure you&apos;re comparing the same project&mdash;not just
              the bottom-line price. This checklist surfaces the gaps,
              exclusions, and assumptions that cause disputes.
            </p>
            <p className="text-cream/50 text-sm mb-8">
              {CHECKLIST_SECTIONS.length} sections &middot; {totalItems} items &middot; {essentialItems} essential &middot; {calloutItems} Hawai&#x02BB;i callouts &middot;{' '}
              <Link href="/resources/playbooks/fair-bid-checklist" className="text-sandstone/70 hover:text-sandstone underline">
                Read the full guide &rarr;
              </Link>
            </p>
          </FadeInSection>

          <FadeInSection delay={50}>
            <div className="bg-basalt-50 rounded-card p-6 mb-8">
              <h2 className="font-serif text-xl text-sandstone mb-3">
                You&apos;re ready when&hellip;
              </h2>
              <p className="text-cream/70 text-sm leading-relaxed mb-3">
                Every section below is clearly answered for each contractor
                you&apos;re comparing.
              </p>
              <p className="text-cream/60 text-sm leading-relaxed italic">
                The goal is to compare the same project&mdash;not just the
                bottom-line price.
              </p>
            </div>
          </FadeInSection>

          <FadeInSection delay={100}>
            <FairBidPublicContent />
          </FadeInSection>

          {/* Sign-in CTA */}
          <FadeInSection delay={150}>
            <div className="bg-basalt-50 rounded-card p-8 mt-8 text-center">
              <h2 className="font-serif text-2xl text-cream mb-3">
                Save your progress
              </h2>
              <p className="text-cream/60 text-sm mb-6 max-w-lg mx-auto">
                Sign in to save your checklist across devices and access all
                all Contract Comparison tools in one place.
              </p>
              <Link href="/login?callbackUrl=/app/tools/before-you-sign?tab=quotes">
                <Button size="lg">
                  Sign in to save your progress &rarr;
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
