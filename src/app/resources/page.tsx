import type { Metadata } from 'next'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { Card } from '@/components/ui/Card'

export const metadata: Metadata = {
  title: 'Guides & Tools',
  description: 'Practical guides and interactive tools for Hawaiʻi homeowners. Renovation stages, bid comparison, decision tracking, and more—built for local conditions.',
}

export default function ResourcesPage() {
  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        <FadeInSection>
          <div className="text-center mb-16">
            <h1 className="font-serif text-4xl md:text-5xl text-sandstone mb-6">
              Guides &amp; Tools
            </h1>
            <p className="text-lg text-cream/70 max-w-2xl mx-auto">
              Practical guides and tools to help you navigate your Hawai&#x02BB;i renovation with clarity and confidence. Built from real experience, not theory.
            </p>
          </div>
        </FadeInSection>

        {/* Hawaii reality check */}
        <FadeInSection delay={50}>
          <section className="mb-12">
            <div className="bg-basalt-50 rounded-card p-6">
              <h2 className="font-serif text-xl text-sandstone mb-4">
                Hawai&#x02BB;i Renovation Reality Check
              </h2>
              <ul className="text-cream/60 space-y-2 text-sm">
                <li className="flex gap-3">
                  <span className="text-sandstone shrink-0">&bull;</span>
                  <span>Material shipping adds 4&ndash;8 weeks and 15&ndash;30% to mainland prices.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-sandstone shrink-0">&bull;</span>
                  <span>Salt air, UV, and humidity are hard on materials. Plan your finishes accordingly.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-sandstone shrink-0">&bull;</span>
                  <span>Budget extra time for permitting. Processes, fees, and timelines vary by county.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-sandstone shrink-0">&bull;</span>
                  <span>Older homes commonly have termite damage, lead paint, and undersized panels. Budget for surprises.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-sandstone shrink-0">&bull;</span>
                  <span>A 10&ndash;15% contingency is standard. In Hawai&#x02BB;i, lean toward the higher end.</span>
                </li>
              </ul>
            </div>
          </section>
        </FadeInSection>

        {/* Renovation Stages Guide — hero card */}
        <FadeInSection delay={75}>
          <section className="mb-12">
            <Card
              href="/resources/renovation-stages"
              title="Renovation Stages Guide"
              description="An interactive walkthrough of every stage in a renovation&mdash;from planning and permits to punch list. See what happens when, what you need to decide, and what&rsquo;s different in Hawai&#x02BB;i."
              badge="Free &middot; Interactive"
            />
          </section>
        </FadeInSection>

        {/* Free guides */}
        <FadeInSection delay={100}>
          <section className="mb-16">
            <h2 className="font-serif text-2xl text-cream mb-2">
              Free Guides
            </h2>
            <p className="text-cream/50 text-sm mb-6">
              Read the full content on each page&mdash;no sign-in required.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card
                href="/resources/playbooks/fair-bid-checklist"
                title="Compare Your Quotes"
                description="What to look for in every contractor bid. 11 sections, 44 items, with essentials flagged."
                badge="Free to read"
              />
              <Card
                href="/resources/playbooks/responsibility-matrix"
                title="Who Handles What"
                description="The 16 tasks that get dropped between homeowner, contractor, and subs."
                badge="Free to read"
              />
            </div>
          </section>
        </FadeInSection>

        {/* Interactive tools */}
        <FadeInSection delay={125}>
          <section className="mb-16">
            <h2 className="font-serif text-2xl text-cream mb-2">
              Interactive Tools
            </h2>
            <p className="text-cream/50 text-sm mb-6">
              Free to try. Sign in to save your progress across devices.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card
                href="/tools/finish-decisions"
                title="Decision Tracker"
                description="Track every material and finish decision by room. Compare options, record details, and mark progress from deciding to done."
                badge="Free to use"
              />
              <Card
                href="/tools/before-you-sign"
                title="Before You Sign"
                description="Compare quotes, assign who handles what, and agree on the details that cause fights later. Three tools in one."
                badge="Free to use"
              />
            </div>
          </section>
        </FadeInSection>
      </div>
    </div>
  )
}
