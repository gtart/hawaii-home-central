import type { Metadata } from 'next'
import Link from 'next/link'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Guides',
  description: 'Hawaiʻi-specific playbooks for common renovation and maintenance projects, tailored for local conditions, regulations, and best practices.',
}

export default function GuidesPage() {
  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <FadeInSection>
          <Badge variant="accent" className="mb-4">Coming Soon</Badge>
          <h1 className="font-serif text-4xl md:text-5xl text-sandstone mb-6">
            Hawaiʻi Playbooks
          </h1>
          <p className="text-lg text-cream/70 mb-8 max-w-2xl mx-auto">
            Step-by-step guides for common projects, tailored for local conditions, regulations, and best practices. From bathroom renovations to termite prevention, we&apos;re building the guides we wished existed.
          </p>
        </FadeInSection>

        <FadeInSection delay={100}>
          <div className="bg-basalt-50 rounded-card p-8 mb-8">
            <h2 className="font-serif text-2xl text-cream mb-4">
              What to Expect
            </h2>
            <ul className="text-left text-cream/70 space-y-3">
              <li className="flex gap-3">
                <span className="text-sandstone">→</span>
                <span>Project planning checklists specific to Hawaiʻi</span>
              </li>
              <li className="flex gap-3">
                <span className="text-sandstone">→</span>
                <span>Permitting requirements and timelines by county</span>
              </li>
              <li className="flex gap-3">
                <span className="text-sandstone">→</span>
                <span>Material recommendations for humidity and salt air</span>
              </li>
              <li className="flex gap-3">
                <span className="text-sandstone">→</span>
                <span>Realistic budgets and timeline expectations</span>
              </li>
              <li className="flex gap-3">
                <span className="text-sandstone">→</span>
                <span>Red flags to watch for and questions to ask</span>
              </li>
            </ul>
          </div>
        </FadeInSection>

        <FadeInSection delay={200}>
          <p className="text-cream/50 mb-6">
            Be the first to know when guides launch.
          </p>
          <Link href="/early-access">
            <Button size="lg">Get Early Access</Button>
          </Link>
        </FadeInSection>
      </div>
    </div>
  )
}
