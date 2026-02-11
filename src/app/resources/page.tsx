import type { Metadata } from 'next'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { Card } from '@/components/ui/Card'
import { CardStatic } from '@/components/ui/CardStatic'

export const metadata: Metadata = {
  title: 'Tools & Guides',
  description: 'Practical tools for Hawaiʻi homeowners. Fair bid checklists, renovation guides, budget trackers, and more—built for local conditions.',
}

export default function ResourcesPage() {
  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        <FadeInSection>
          <div className="text-center mb-16">
            <h1 className="font-serif text-4xl md:text-5xl text-sandstone mb-6">
              Tools &amp; Guides
            </h1>
            <p className="text-lg text-cream/70 max-w-2xl mx-auto">
              Practical tools to help you navigate your Hawai&#x02BB;i renovation with clarity and confidence. Built from real experience, not theory.
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

        {/* Start here (free) */}
        <FadeInSection delay={75}>
          <section className="mb-16">
            <h2 className="font-serif text-2xl text-cream mb-2">
              Start Here (Free)
            </h2>
            <p className="text-cream/50 text-sm mb-6">
              Read the full content on each page&mdash;no sign-in required. Sign in when you&rsquo;re ready to use the interactive tools.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card
                href="/resources/playbooks/hold-points"
                title="Hold Points"
                description="What must be locked in before each construction stage. 5 stages, 23 decisions, with Hawai&#x02BB;i callouts."
                badge="Free to read"
              />
              <Card
                href="/resources/playbooks/fair-bid-checklist"
                title="Fair Bid Checklist"
                description="What to look for in every contractor bid. 11 sections, 44 items, with essentials flagged."
                badge="Free to read"
              />
              <Card
                href="/resources/playbooks/responsibility-matrix"
                title="Responsibility Matrix"
                description="Who owns the 16 tasks that get dropped between homeowner, GC, and subs."
                badge="Free to read"
              />
            </div>
          </section>
        </FadeInSection>

        <FadeInSection delay={100}>
          <section aria-labelledby="tools-heading" className="mb-16">
            <h2 id="tools-heading" className="font-serif text-2xl text-cream mb-6">
              All Tools
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card
                href="/resources/playbooks/fair-bid-checklist"
                title="Fair Bid Checklist"
                description="Know exactly what to look for when comparing contractor bids. 11 critical sections with Hawai&#x02BB;i-specific callouts."
                badge="Live"
              />
              <Card
                href="/resources/playbooks/hold-points"
                title="Hold Points: Specs to Lock In By Stage"
                description="The decisions that must be finalized before each construction phase — and what happens when they're not."
                badge="Live"
              />
              <Card
                href="/resources/playbooks/responsibility-matrix"
                title="Responsibility Matrix"
                description="Clarify who owns commonly-missed renovation responsibilities before they become disputes."
                badge="Live"
              />
              <CardStatic
                title="Hidden Costs &amp; Contingencies"
                description="A Hawai&#x02BB;i reality check on the costs that don&apos;t show up in the initial bid but always show up on the invoice."
                badge="Hawai&#x02BB;i Focus"
              />
              <CardStatic
                title="Project Binder"
                description="Organize your contracts, photos, receipts, and communications in one shared space. No file storage — just structure."
              />
              <CardStatic
                title="Budget Tracker"
                description="Track actual vs. estimated costs across every phase of your project. Know where your money is going."
              />
              <CardStatic
                title="Project Reminders"
                description="Timely nudges for maintenance tasks, inspection deadlines, and seasonal upkeep tailored to Hawai&#x02BB;i."
              />
            </div>
          </section>
        </FadeInSection>
      </div>
    </div>
  )
}
