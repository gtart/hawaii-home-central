'use client'

import { useProjectOptional } from '@/contexts/ProjectContext'
import { ProjectSwitcher } from './ProjectSwitcher'

export function ProjectBanner() {
  const projectCtx = useProjectOptional()

  if (!projectCtx || projectCtx.isLoading) return null

  const { currentProject } = projectCtx

  return (
    <div className="flex items-center gap-2 flex-wrap bg-basalt-50 rounded-card px-5 py-3.5 mb-8">
      <span className="text-sm text-cream/50">
        {currentProject ? 'You\u2019re working on:' : 'Select a home to get started'}
      </span>
      <ProjectSwitcher />
    </div>
  )
}
