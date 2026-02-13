import type { Metadata } from 'next'
import Link from 'next/link'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { Button } from '@/components/ui/Button'
import { breadcrumbSchema, faqSchema } from '@/lib/structured-data'
import { auth } from '@/auth'

export const metadata: Metadata = {
  title: 'Decision Tracker — Track Every Material and Finish Choice',
  description:
    'Free interactive tracker for renovation finish decisions. Track appliances, countertops, flooring, fixtures, and more across rooms and construction stages. Save specs, vendors, and links.',
}

const FAQ_ITEMS = [
  {
    question: 'How does room-first organization work?',
    answer:
      'Start by adding a room or area (Kitchen, Bathroom, Living Room, etc.). When you create a room, you can choose to pre-load it with typical decision categories for that room type. For example, a Kitchen gets Countertop, Cabinetry, Appliances, Flooring, and more. Then drill into each room to see its decisions.',
  },
  {
    question: 'How do I compare options?',
    answer:
      'Each decision (like "Countertop") can have 2–3 options you\'re considering (Quartz vs Granite vs Soapstone). Add specs, notes, and links to each option. Mark one as selected with a checkbox when you\'ve decided. This keeps all your research organized and easy to compare.',
  },
  {
    question: 'How many finish decisions does a typical renovation have?',
    answer:
      'A kitchen or bathroom renovation typically involves 8–15 finish decisions. A whole-house renovation can have 30–50+. This tool helps you organize them by room and status so you always know what\'s decided and what\'s still open.',
  },
]

// Preview sample items
const PREVIEW_ITEMS = [
  {
    room: 'Kitchen',
    category: 'Appliance',
    name: 'Range (36" Gas)',
    status: 'Selected',
  },
  {
    room: 'Kitchen',
    category: 'Countertop',
    name: 'Quartz - Calacatta Gold',
    status: 'Shortlist',
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
    status: 'Ordered',
  },
  {
    room: 'Kitchen',
    category: 'Flooring',
    name: 'LVP - Oak Grey 7"',
    status: 'Done',
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
    { name: 'Decision Tracker', href: '/tools/finish-decisions' },
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
              Decision Tracker
            </h1>
            <p className="text-lg text-cream/70 mb-4 max-w-3xl mx-auto text-center leading-relaxed">
              Add rooms or areas. Each room gets default decisions. Compare options for each
              choice (Quartz vs Granite). Track specs, notes, and links. Simple, room-first organization.
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
                Room-first organization. Each decision can have multiple options to compare.
                Track specs, notes, and links for every option.
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
                        item.status === 'Done'
                          ? 'bg-cream/10 text-cream/50'
                          : item.status === 'Selected' || item.status === 'Ordered'
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
                    <strong className="text-cream">Room-First Organization</strong> — Add
                    rooms (Kitchen, Bathroom, Living Room, etc.) with default decisions
                    pre-loaded
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-sandstone">→</span>
                  <span>
                    <strong className="text-cream">Compare Options</strong> — Add 2-3
                    options per decision (Quartz vs Granite) and mark your winner
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-sandstone">→</span>
                  <span>
                    <strong className="text-cream">Track Details</strong> — Record specs,
                    notes, and multiple links for each option
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-sandstone">→</span>
                  <span>
                    <strong className="text-cream">Search &amp; Filter</strong> — Search
                    across all rooms. Filter by status with one-click chips.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-sandstone">→</span>
                  <span>
                    <strong className="text-cream">Built-In Guidance</strong> — Each
                    decision shows timing milestones, coordination watchouts, and practical advice.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-sandstone">→</span>
                  <span>
                    <strong className="text-cream">By Milestone View</strong> — See all
                    decisions grouped by construction milestone for scheduling clarity.
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
