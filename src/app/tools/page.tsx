import type { Metadata } from 'next'
import Link from 'next/link'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { Button } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Tools',
  description: 'Our homeowner tools have moved to the Resources hub. Visit Resources for bid checklists, project binders, and more.',
}

export default function ToolsPage() {
  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <FadeInSection>
          <h1 className="font-serif text-4xl md:text-5xl text-sandstone mb-6">
            Tools Have Moved
          </h1>
          <p className="text-lg text-cream/70 mb-8 max-w-2xl mx-auto">
            Our homeowner tools now live under Resources&mdash;along with playbooks and checklists to help with your project.
          </p>
          <Link href="/resources">
            <Button size="lg">Go to Resources</Button>
          </Link>
        </FadeInSection>
      </div>
    </div>
  )
}
