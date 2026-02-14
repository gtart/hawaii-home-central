import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { Button } from '@/components/ui/Button'
import { breadcrumbSchema, faqSchema } from '@/lib/structured-data'
import { auth } from '@/auth'
import {
  DEFAULT_DECISIONS_BY_ROOM_TYPE,
  ROOM_TYPE_OPTIONS_V3,
} from '@/data/finish-decisions'

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

// Show a curated set of room types for the starter view
const STARTER_ROOMS = ['kitchen', 'bathroom', 'living_room', 'bedroom', 'doors', 'windows'] as const

export default async function FinishDecisionsLandingPage() {
  const session = await auth()
  if (session?.user) redirect('/app/tools/finish-decisions')

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

          {/* Room type browser — real data, not a teaser */}
          <FadeInSection delay={100}>
            <div className="bg-basalt-50 rounded-card p-8 mb-12">
              <h2 className="font-serif text-2xl text-sandstone mb-2">
                What You&apos;ll Track By Room
              </h2>
              <p className="text-cream/60 text-sm mb-6">
                Each room type comes pre-loaded with typical decisions. Here&apos;s what a real project looks like.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {STARTER_ROOMS.map((roomType) => {
                  const label = ROOM_TYPE_OPTIONS_V3.find((r) => r.value === roomType)?.label ?? roomType
                  const decisions = DEFAULT_DECISIONS_BY_ROOM_TYPE[roomType] ?? []
                  return (
                    <div key={roomType} className="bg-basalt rounded-card p-4">
                      <h3 className="text-cream font-medium text-sm mb-2">{label}</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {decisions.map((d) => (
                          <span
                            key={d}
                            className="text-xs text-cream/60 bg-basalt-50 px-2 py-1 rounded"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="text-cream/40 text-xs mt-4">
                + {ROOM_TYPE_OPTIONS_V3.length - STARTER_ROOMS.length} more room types available. Add custom decisions to any room.
              </p>
            </div>
          </FadeInSection>

          <FadeInSection delay={200}>
            <div className="bg-basalt-50 rounded-card p-8 mb-12">
              <h2 className="font-serif text-2xl text-sandstone mb-4">
                Features
              </h2>
              <ul className="space-y-3 text-cream/70">
                <li className="flex gap-2">
                  <span className="text-sandstone">&rarr;</span>
                  <span>
                    <strong className="text-cream">Room-First Organization</strong> &mdash; Add
                    rooms (Kitchen, Bathroom, Living Room, etc.) with default decisions
                    pre-loaded
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-sandstone">&rarr;</span>
                  <span>
                    <strong className="text-cream">Compare Options</strong> &mdash; Add 2-3
                    options per decision (Quartz vs Granite) and mark your winner
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-sandstone">&rarr;</span>
                  <span>
                    <strong className="text-cream">Track Details</strong> &mdash; Record specs,
                    notes, and multiple links for each option
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-sandstone">&rarr;</span>
                  <span>
                    <strong className="text-cream">Search &amp; Filter</strong> &mdash; Search
                    across all rooms. Filter by status with one-click chips.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-sandstone">&rarr;</span>
                  <span>
                    <strong className="text-cream">Built-In Guidance</strong> &mdash; Each
                    decision shows timing milestones, coordination watchouts, and practical advice.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-sandstone">&rarr;</span>
                  <span>
                    <strong className="text-cream">By Milestone View</strong> &mdash; See all
                    decisions grouped by construction milestone for scheduling clarity.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-sandstone">&rarr;</span>
                  <span>
                    <strong className="text-cream">Multi-Device Sync</strong> &mdash; Your
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
              <Link href="/login?callbackUrl=/app/tools/finish-decisions">
                <Button variant="primary" size="lg">
                  Personalize This for Your Home &mdash; Free Account
                </Button>
              </Link>
              <p className="text-cream/40 text-sm mt-4">
                Sign in with Google. No credit card required.
              </p>
            </div>
          </FadeInSection>
        </div>
      </div>
    </>
  )
}
