import type { Metadata } from 'next'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { FadeInSection } from '@/components/effects/FadeInSection'

export const metadata: Metadata = {
  title: 'My Tools',
}

export default function AppPage() {
  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        <FadeInSection>
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="font-serif text-4xl md:text-5xl text-sandstone">
                My Tools
              </h1>
              <Badge variant="accent">Early Preview</Badge>
            </div>
            <p className="text-cream/70 text-lg leading-relaxed max-w-2xl">
              Your progress is saved to your account. Pick up on any device.
            </p>
            <p className="text-cream/50 text-sm mt-2">
              Tools are being actively built&mdash;your feedback shapes what comes next.
            </p>
          </div>
        </FadeInSection>

        <FadeInSection delay={100}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card
              href="/app/tools/hold-points"
              title="Hold Points"
              description="Lock in material and finish decisions before each construction stage. Track what&apos;s decided and what&apos;s still open."
              badge="Live"
            />
            <Card
              href="/app/tools/fair-bid-checklist"
              title="Fair Bid Checklist"
              description="Compare contractor bids systematically. Check off each line item across 11 critical sections."
              badge="Live"
            />
            <Card
              href="/app/tools/responsibility-matrix"
              title="Responsibility Matrix"
              description="Assign who owns commonly-missed renovation tasks. Prevent disputes by clarifying handoffs upfront."
              badge="Live"
            />
          </div>
        </FadeInSection>
      </div>
    </div>
  )
}
