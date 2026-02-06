import type { Metadata } from 'next'
import Link from 'next/link'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { Card } from '@/components/ui/Card'
import { CardStatic } from '@/components/ui/CardStatic'
import { Badge } from '@/components/ui/Badge'

export const metadata: Metadata = {
  title: 'Resources',
  description: 'Practical playbooks and tools for Hawai\u02BBi homeowners. Fair bid checklists, renovation guides, budget trackers, and more\u2014built for local conditions.',
}

export default function ResourcesPage() {
  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        <FadeInSection>
          <div className="text-center mb-16">
            <h1 className="font-serif text-4xl md:text-5xl text-sandstone mb-6">
              Resources
            </h1>
            <p className="text-lg text-cream/70 max-w-2xl mx-auto">
              Practical playbooks and tools to help you navigate your Hawai&#x02BB;i renovation with clarity and confidence. Built from real experience, not theory.
            </p>
          </div>
        </FadeInSection>

        <FadeInSection delay={100}>
          <section aria-labelledby="playbooks-heading" className="mb-16">
            <h2 id="playbooks-heading" className="font-serif text-2xl text-cream mb-6">
              Playbooks
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card
                href="/resources/playbooks/fair-bid-checklist"
                title="Fair Bid Checklist"
                description="Know exactly what to look for when comparing contractor bids. 11 critical sections with Hawai&#x02BB;i-specific callouts."
                badge="Live"
              />
              <CardStatic
                title="Specs That Must Be Complete Before Ordering"
                description="The material and finish decisions that need to be locked in before your contractor can order\u2014and why delays happen."
              />
              <CardStatic
                title="Hidden Costs & Contingencies"
                description="A Hawai&#x02BB;i reality check on the costs that don&apos;t show up in the initial bid but always show up on the invoice."
                badge="Hawai&#x02BB;i Focus"
              />
              <CardStatic
                title="Responsibility Matrix"
                description="Who handles what? A clear breakdown of homeowner vs. contractor responsibilities to prevent misunderstandings."
              />
            </div>
          </section>
        </FadeInSection>

        <FadeInSection delay={200}>
          <section aria-labelledby="tools-heading">
            <h2 id="tools-heading" className="font-serif text-2xl text-cream mb-6">
              Tools
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CardStatic
                title="Project Binder"
                description="Organize your contracts, photos, receipts, and communications in one shared space. No file storage\u2014just structure."
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
