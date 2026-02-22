import type { Metadata } from 'next'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { Card } from '@/components/ui/Card'

export const metadata: Metadata = {
  title: 'Guides',
  description: 'Practical guides for Hawaiʻi homeowners. Renovation planning, bid comparison, task ownership, and decision tracking—built for local conditions.',
}

export default function ResourcesPage() {
  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        <FadeInSection>
          <div className="text-center mb-16">
            <h1 className="font-serif text-4xl md:text-5xl text-sandstone mb-6">
              Guides
            </h1>
            <p className="text-lg text-cream/70 max-w-2xl mx-auto">
              Practical guides to help you navigate your Hawai&#x02BB;i renovation with clarity and confidence. Built from real experience, not theory.
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
                  <span>Material shipping commonly adds 4&ndash;8 weeks and can cost 15&ndash;30% more than mainland prices.</span>
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
                  <span>A 10&ndash;15% contingency is common. In Hawai&#x02BB;i, plan for the higher end.</span>
                </li>
              </ul>
              <p className="text-[11px] text-cream/30 mt-3">
                Timelines and costs vary by island, vendor, and project scope. Use this as planning guidance.
              </p>
            </div>
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
                href="/resources/renovation-stages"
                title="Plan Your Renovation"
                description="A stage-by-stage walkthrough of every renovation phase&mdash;from planning and contracts to closeout. See what happens when, what to decide, and what&rsquo;s different in Hawai&#x02BB;i."
                badge="Free"
                className="md:col-span-2"
              />
              <Card
                href="/resources/playbooks/fair-bid-checklist"
                title="Apples-to-Apples Bid Checklist"
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

        {/* Renovation Basics Library */}
        <FadeInSection delay={112}>
          <section className="mb-16">
            <h2 className="font-serif text-2xl text-cream mb-2">
              Renovation Basics Library
            </h2>
            <p className="text-cream/50 text-sm mb-6">
              Articles covering the fundamentals of renovating in Hawai&#x02BB;i.
            </p>
            <Card
              href="/hawaii-home-renovation"
              title="Renovation Basics Library"
              description="Browse topics from budgeting and permits to materials and timelines&mdash;written for Hawai&#x02BB;i homeowners."
              badge="Free to read"
            />
          </section>
        </FadeInSection>
      </div>
    </div>
  )
}
