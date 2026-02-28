import type { Metadata } from 'next'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { ToolGrid } from '@/components/app/ToolGrid'
import { ProjectBanner } from '@/components/app/ProjectBanner'
import { NextStepsCard } from '@/components/app/NextStepsCard'
import { AppPageHeader } from '@/components/app/AppPageHeader'

export const metadata: Metadata = {
  title: 'My Project',
}

export default function AppPage() {
  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-5xl mx-auto">
        <FadeInSection className="relative z-10">
          <AppPageHeader />
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
