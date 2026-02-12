import type { Metadata } from 'next'
import Link from 'next/link'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { Button } from '@/components/ui/Button'
import { breadcrumbSchema, faqSchema } from '@/lib/structured-data'
import { auth } from '@/auth'

export const metadata: Metadata = {
  title: 'Finish Decisions Tracker — Track Every Material and Appliance Choice',
  description:
    'Free interactive tracker for renovation finish decisions. Track appliances, countertops, flooring, fixtures, and more across rooms and construction stages. Save specs, vendors, and links.',
}

const FAQ_ITEMS = [
  {
    question: 'How does comparing options work?',
    answer:
      'Each decision (like "Countertop") can have 2–3 options you\'re considering (Quartz vs Granite vs Soapstone). Add specs, vendor, cost, and links to each option, then pick your winner with a radio button. This keeps all your research organized in one place.',
  },
  {
    question: 'What are starter packs?',
    answer:
      'When you add a room, you pick a room type (Kitchen, Bathroom, Exterior, etc.) and the tool pre-populates common decision categories for that room type. For example, a Kitchen starter pack includes Countertop, Cabinetry, Appliances, Flooring, Backsplash, and more. You can delete what you don\'t need and add your own.',
  },
  {
    question: 'How many finish decisions does a typical renovation have?',
    answer:
      'A kitchen or bathroom renovation typically involves 15–30 finish decisions. A whole-house renovation can have 50–100+. This tool helps you organize them by room, category, and status so you always know what\'s decided and what\'s still open.',
  },
  {
    question: 'When do I need to lock in finish decisions?',
    answer:
      'It depends on the construction stage. Appliances and fixtures often need to be ordered during the "Long-Lead" phase (8+ weeks before installation). Tile, countertops, and cabinetry must be locked before fabrication. Paint and hardware can wait until closeout. This tool tracks the "needed-by" stage for each decision.',
  },
]

// Preview sample items
const PREVIEW_ITEMS = [
  {
    room: 'Kitchen',
    category: 'Appliance',
    name: 'Range (36" Gas)',
    status: 'Final',
  },
  {
    room: 'Kitchen',
    category: 'Countertop',
    name: 'Quartz - Calacatta Gold',
    status: 'Awaiting Approval',
  },
  {
    room: 'Master Bath',
    category: 'Tile',
    name: '12x24 Porcelain - Matte White',
    status: 'Deciding',
  },
  {
    room: 'Master Bath',
    category: 'Fixture',
    name: 'Freestanding Tub',
    status: 'Final',
  },
  {
    room: 'Kitchen',
    category: 'Flooring',
    name: 'LVP - Oak Grey 7"',
    status: 'Complete',
  },
  {
    room: 'Whole House',
    category: 'Paint',
    name: 'Interior Walls - SW Alabaster',
    status: 'Deciding',
  },
]

export default async function FinishDecisionsLandingPage() {
  const session = await auth()
  const breadcrumb = breadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Tools', href: '/tools' },
    { name: 'Finish Decisions', href: '/tools/finish-decisions' },
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
          <FadeInSection>
            <h1 className="font-serif text-4xl md:text-5xl text-sandstone mb-6 text-center">
              Finish Decisions
            </h1>
            <p className="text-lg text-cream/70 mb-4 max-w-3xl mx-auto text-center leading-relaxed">
              Organize decisions by room. Compare multiple options for each choice
              (Quartz vs Granite, Wolf vs Thermador). Track specs, vendors, costs, and
              links. Start with pre-loaded decision categories or build your own.
            </p>
            <p className="text-cream/50 text-sm mb-12 max-w-2xl mx-auto text-center">
              Built for Hawai&#x02BB;i homeowners tackling real renovation projects.
            </p>
          </FadeInSection>

          <FadeInSection delay={100}>
            <div className="bg-basalt-50 rounded-card p-8 mb-12">
              <h2 className="font-serif text-2xl text-sandstone mb-4">
                Preview: What You&apos;ll Track
              </h2>
              <p className="text-cream/60 text-sm mb-6">
                Organize decisions by room. Each decision can have multiple options to
                compare. Track specs, vendor, cost, and links for every option.
              </p>
              <div className="space-y-3">
                {PREVIEW_ITEMS.map((item, i) => (
                  <div
                    key={i}
                    className="bg-basalt rounded-card p-3 flex items-center gap-3 text-sm"
                  >
                    {item.room && (
                      <span className="text-xs text-cream/50 bg-basalt-50 px-2 py-1 rounded">
                        {item.room}
                      </span>
                    )}
                    <span className="text-xs text-sandstone/70">{item.category}</span>
                    <span className="text-cream flex-1">{item.name}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        item.status === 'Complete'
                          ? 'bg-cream/10 text-cream/50'
                          : item.status === 'Final'
                            ? 'bg-sandstone/20 text-sandstone'
                            : 'bg-basalt-50 text-cream/70'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </FadeInSection>

          <FadeInSection delay={200}>
            <div className="bg-basalt-50 rounded-card p-8 mb-12">
              <h2 className="font-serif text-2xl text-sandstone mb-4">
                What You Get When You Sign In
              </h2>
              <ul className="space-y-3 text-cream/70">
                <li className="flex gap-2">
                  <span className="text-sandstone">→</span>
                  <span>
                    <strong className="text-cream">Room Manager</strong> — Add rooms
                    (Kitchen, Bathroom, etc.) and auto-populate decision categories with
                    starter packs
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-sandstone">→</span>
                  <span>
                    <strong className="text-cream">Compare Options</strong> — Add 2-3
                    options per decision (Quartz vs Granite) and pick your winner
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-sandstone">→</span>
                  <span>
                    <strong className="text-cream">Full Details Per Option</strong> —
                    Record specs, vendor, cost estimate, multiple links, and notes for
                    each option
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-sandstone">→</span>
                  <span>
                    <strong className="text-cream">Filters & Search</strong> — Find
                    decisions by room, status, or keyword search
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-sandstone">→</span>
                  <span>
                    <strong className="text-cream">Progress Tracking</strong> — See
                    decisions by status: Exploring, Decided, Ordered, Complete
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-sandstone">→</span>
                  <span>
                    <strong className="text-cream">Multi-Device Sync</strong> — Your
                    data saves to your account. Pick up on any device.
                  </span>
                </li>
              </ul>
            </div>
          </FadeInSection>

          <FadeInSection delay={300}>
            <div className="mb-12">
              <h2 className="font-serif text-2xl text-sandstone mb-6">
                Frequently Asked Questions
              </h2>
              <div className="space-y-6">
                {FAQ_ITEMS.map((faq, i) => (
                  <div key={i} className="bg-basalt-50 rounded-card p-6">
                    <h3 className="text-cream font-medium mb-2">{faq.question}</h3>
                    <p className="text-cream/60 text-sm leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeInSection>

          <FadeInSection delay={400}>
            <div className="text-center">
              {session?.user ? (
                <Link href="/app/tools/finish-decisions">
                  <Button variant="primary" size="lg">
                    Go to Tool &rarr;
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login?callbackUrl=/app/tools/finish-decisions">
                    <Button variant="primary" size="lg">
                      Get Started — It&apos;s Free
                    </Button>
                  </Link>
                  <p className="text-cream/40 text-sm mt-4">
                    Sign in with Google. No credit card required.
                  </p>
                </>
              )}
            </div>
          </FadeInSection>
        </div>
      </div>
    </>
  )
}
