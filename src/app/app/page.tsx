import type { Metadata } from 'next'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { ToolGrid } from '@/components/app/ToolGrid'
import { ProjectBanner } from '@/components/app/ProjectBanner'
import { NextStepsCard } from '@/components/app/NextStepsCard'
import { ManageToolsButton } from '@/components/app/ManageToolsButton'

export const metadata: Metadata = {
  title: 'My Project',
}

export default function AppPage() {
  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-5xl mx-auto">
        <FadeInSection className="relative z-10">
          <div className="mb-8">
            <div className="flex items-center justify-between gap-4">
              <h1 className="font-serif text-3xl md:text-4xl text-sandstone">
                My Project
              </h1>
              <ManageToolsButton />
            </div>
            <p className="text-cream/50 text-base mt-2">
              Your tools at a glance.
            </p>
          </div>
        </FadeInSection>

        <FadeInSection delay={100}>
          <ProjectBanner />
          <NextStepsCard />
          <ToolGrid />
        </FadeInSection>
      </div>
    </div>
  )
}
