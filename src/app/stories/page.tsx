import type { Metadata } from 'next'
import Link from 'next/link'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Stories',
  description: 'Real renovation stories from Hawaiʻi homeowners—what worked, what didn\'t, and what they wish they knew earlier.',
}

export default function StoriesPage() {
  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <FadeInSection>
          <Badge variant="accent" className="mb-4">Coming Soon</Badge>
          <h1 className="font-serif text-4xl md:text-5xl text-sandstone mb-6">
            Lessons From Real Renovations
          </h1>
          <p className="text-lg text-cream/70 mb-8 max-w-2xl mx-auto">
            Real stories from Hawaiʻi homeowners—what worked, what didn&apos;t, and what they wish they knew earlier. No sponsored content, no glossy perfection, just honest accounts.
          </p>
        </FadeInSection>

        <FadeInSection delay={100}>
          <div className="bg-basalt-50 rounded-card p-8 mb-8">
            <h2 className="font-serif text-2xl text-cream mb-4">
              Stories We&apos;re Collecting
            </h2>
            <ul className="text-left text-cream/70 space-y-3">
              <li className="flex gap-3">
                <span className="text-sandstone">→</span>
                <span>Full renovation journeys with timelines and budgets</span>
              </li>
              <li className="flex gap-3">
                <span className="text-sandstone">→</span>
                <span>Lessons learned from contractor relationships</span>
              </li>
              <li className="flex gap-3">
                <span className="text-sandstone">→</span>
                <span>Unexpected challenges and how they were solved</span>
              </li>
              <li className="flex gap-3">
                <span className="text-sandstone">→</span>
                <span>What people would do differently next time</span>
              </li>
              <li className="flex gap-3">
                <span className="text-sandstone">→</span>
                <span>Hidden costs and surprises to prepare for</span>
              </li>
            </ul>
          </div>
        </FadeInSection>

        <FadeInSection delay={200}>
          <p className="text-cream/50 mb-6">
            Get notified when we publish our first stories.
          </p>
          <Link href="/early-access">
            <Button size="lg">Get Early Access</Button>
          </Link>
        </FadeInSection>
      </div>
    </div>
  )
}
