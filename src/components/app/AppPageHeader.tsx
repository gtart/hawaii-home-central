'use client'

import { useProject } from '@/contexts/ProjectContext'
import { ManageToolsButton } from './ManageToolsButton'

export function AppPageHeader() {
  const { currentProject } = useProject()
  const name = currentProject?.name ?? 'My Project'

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-3xl md:text-4xl text-sandstone">
          {name}
        </h1>
        <ManageToolsButton />
      </div>
      <p className="text-cream/50 text-base mt-2">
        Your tools at a glance.
      </p>
    </div>
  )
}
