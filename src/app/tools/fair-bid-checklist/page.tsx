import type { Metadata } from 'next'
import Link from 'next/link'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { Button } from '@/components/ui/Button'
import { breadcrumbSchema, faqSchema } from '@/lib/structured-data'
import { CHECKLIST_SECTIONS } from '@/data/fair-bid-checklist'

export const metadata: Metadata = {
  title: 'Fair Bid Checklist \u2014 Compare Contractor Bids Apples-to-Apples',
  description:
    'Free interactive checklist: compare contractor bids fairly. 11 sections, 44 items covering scope, labor, materials, permits, timeline, and more. Built for Hawai\u02BBi homeowners.',
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

// Show first essential item from each of the first 4 sections
const PREVIEW_ITEMS = CHECKLIST_SECTIONS.slice(0, 4).map((section) => ({
  sectionTitle: section.title,
  item: section.items.find((i) => i.priority === 'essential') || section.items[0],
}))

const PREVIEW_CALLOUTS = CHECKLIST_SECTIONS.flatMap((s) =>
  s.items.filter((i) => i.hawaiiCallout)
).slice(0, 3)

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
            <p className="text-lg text-cream/70 mb-4 leading-relaxed">
              Compare bids apples-to-apples. This checklist surfaces the gaps, exclusions, and assumptions that cause disputes&mdash;before you sign anything.
            </p>
            <p className="text-cream/50 text-sm mb-8">
              {CHECKLIST_SECTIONS.length} sections &middot; {totalItems} items &middot; {essentialItems} essential &middot; {calloutItems} Hawai&#x02BB;i callouts &middot;{' '}
              <Link href="/resources/playbooks/fair-bid-checklist" className="text-sandstone/70 hover:text-sandstone underline">
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
                {PREVIEW_ITEMS.map(({ sectionTitle, item }) => (
                  <div key={item.id} className="py-3 border-b border-cream/5 last:border-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-cream/10 text-cream/40">
                        {sectionTitle}
                      </span>
                      <span
                        className={`text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          item.priority === 'essential'
                            ? 'bg-sandstone/20 text-sandstone'
                            : 'bg-cream/10 text-cream/40'
                        }`}
                      >
                        {item.priority === 'essential' ? 'Essential' : 'Nice to know'}
                      </span>
                    </div>
                    <p className="text-cream/80 text-sm leading-relaxed">{item.label}</p>
                    <p className="text-cream/50 text-xs mt-1 leading-relaxed">{item.detail}</p>
                  </div>
                ))}
              </div>
              <p className="text-cream/40 text-xs mt-4 pt-3 border-t border-cream/5">
                + {totalItems - PREVIEW_ITEMS.length} more items across {CHECKLIST_SECTIONS.length} sections
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
                    <p className="text-sandstone/90 text-xs font-medium mb-1">{item.label}</p>
                    <p className="text-cream/60 text-xs leading-relaxed">{item.hawaiiCallout}</p>
                  </div>
                ))}
              </div>
              <p className="text-cream/40 text-xs mt-4">
                {calloutItems} items include island-specific guidance
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
                  <span>Interactive checkboxes to mark items as reviewed</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-sandstone shrink-0">&rarr;</span>
                  <span>Progress bar tracking essentials and all items separately</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-sandstone shrink-0">&rarr;</span>
                  <span>Compare multiple bids side-by-side</span>
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
