import type { Metadata } from 'next'
import Link from 'next/link'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Tools',
  description: 'Practical homeowner tools: bid checklists, project binders, upkeep reminders, and more.',
}

export default function ToolsPage() {
  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <FadeInSection>
          <Badge className="mb-4">Coming Later</Badge>
          <h1 className="font-serif text-4xl md:text-5xl text-sandstone mb-6">
            Homeowner Tools
          </h1>
          <p className="text-lg text-cream/70 mb-8 max-w-2xl mx-auto">
            Practical tools to help you stay organized throughout your renovation journey and beyond. We&apos;re building the toolkit we wished we had.
          </p>
        </FadeInSection>

        <FadeInSection delay={100}>
          <div className="bg-basalt-50 rounded-card p-8 mb-8">
            <h2 className="font-serif text-2xl text-cream mb-4">
              Tools We&apos;re Building
            </h2>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div>
                <h3 className="text-sandstone font-medium mb-2">Bid Checklist</h3>
                <p className="text-cream/60 text-sm">
                  Know what to look for when comparing contractor bids. Don&apos;t miss hidden costs or red flags.
                </p>
              </div>
              <div>
                <h3 className="text-sandstone font-medium mb-2">Project Binder</h3>
                <p className="text-cream/60 text-sm">
                  Keep all your project documents, contracts, and communications organized in one place.
                </p>
              </div>
              <div>
                <h3 className="text-sandstone font-medium mb-2">Upkeep Reminders</h3>
                <p className="text-cream/60 text-sm">
                  Seasonal maintenance schedules customized for Hawaiʻi&apos;s climate and your specific home.
                </p>
              </div>
              <div>
                <h3 className="text-sandstone font-medium mb-2">Budget Tracker</h3>
                <p className="text-cream/60 text-sm">
                  Track actual vs. estimated costs. Know where your money is going in real-time.
                </p>
              </div>
            </div>
          </div>
        </FadeInSection>

        <FadeInSection delay={200}>
          <p className="text-cream/50 mb-6">
            Get notified when tools become available.
          </p>
          <Link href="/early-access">
            <Button size="lg">Get Early Access</Button>
          </Link>
        </FadeInSection>
      </div>
    </div>
  )
}
