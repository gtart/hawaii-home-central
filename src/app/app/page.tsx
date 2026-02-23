import type { Metadata } from 'next'
import { Badge } from '@/components/ui/Badge'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { ToolGrid } from '@/components/app/ToolGrid'
import { ProjectBanner } from '@/components/app/ProjectBanner'

export const metadata: Metadata = {
  title: 'My Tools',
}

export default function AppPage() {
  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        <FadeInSection className="relative z-10">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="font-serif text-4xl md:text-5xl text-sandstone">
                My Tools
              </h1>
              <Badge variant="accent">Early Preview</Badge>
            </div>
            <p className="text-cream/70 text-lg leading-relaxed max-w-2xl">
              Tools for each stage of your renovation.
            </p>
          </div>
        </FadeInSection>

        <FadeInSection delay={100}>
          <ProjectBanner />
          <ToolGrid />
        </FadeInSection>
      </div>
    </div>
  )
}
