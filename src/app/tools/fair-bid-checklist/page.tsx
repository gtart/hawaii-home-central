import type { Metadata } from 'next'
import Link from 'next/link'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { Button } from '@/components/ui/Button'
import { breadcrumbSchema, faqSchema } from '@/lib/structured-data'

export const metadata: Metadata = {
  title: 'Fair Bid Checklist \u2014 Compare Contractor Bids Apples-to-Apples',
  description:
    'Free interactive checklist: compare contractor bids fairly. 11 sections, 43 items covering scope, labor, materials, permits, timeline, and more. Built for Hawai\u02BBi homeowners.',
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
      'Focus on the 23 essential items first\u2014these cover the areas where gaps cause the most disputes. The remaining nice-to-know items provide additional protection but aren\u2019t deal-breakers for every project.',
  },
]

export default function FairBidChecklistLandingPage() {
  const breadcrumb = breadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Tools', href: '/tools' },
    { name: 'Fair Bid Checklist', href: '/tools/fair-bid-checklist' },
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
              Fair Bid Checklist
            </h1>
            <p className="text-lg text-cream/70 mb-8 leading-relaxed">
              Compare bids apples-to-apples. This checklist surfaces the gaps, exclusions, and assumptions that cause disputes&mdash;before you sign anything.
            </p>
          </FadeInSection>

          <FadeInSection delay={100}>
            <div className="bg-basalt-50 rounded-card p-6 mb-8">
              <h2 className="font-serif text-xl text-sandstone mb-3">
                What this tool does
              </h2>
              <p className="text-cream/70 text-sm leading-relaxed mb-3">
                The Fair Bid Checklist walks you through 11 critical sections of a contractor bid&mdash;from scope documents and labor terms to warranty clauses and cleanup. Each item explains why it matters and what to look for.
              </p>
              <p className="text-cream/60 text-sm leading-relaxed">
                Items are split into essentials (must-check) and nice-to-know (additional protection). Hawai&#x02BB;i-specific callouts flag local considerations like abatement requirements in older homes, shipping surcharges, and island permitting nuances.
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
                  <span>11 critical bid sections from scope through closeout</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-sandstone shrink-0">&rarr;</span>
                  <span>43 checklist items with 23 marked as essential</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-sandstone shrink-0">&rarr;</span>
                  <span>Expandable detail explaining why each item matters</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-sandstone shrink-0">&rarr;</span>
                  <span>Hawai&#x02BB;i-specific callouts for local conditions</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-sandstone shrink-0">&rarr;</span>
                  <span>Progress bar tracking essentials and all items separately</span>
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
              <Link href="/login?callbackUrl=/app/tools/fair-bid-checklist">
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
