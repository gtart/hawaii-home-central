'use client'

import { useProject } from '@/contexts/ProjectContext'
import type { ReactNode } from 'react'

/**
 * Wraps children with a key based on the current project ID.
 * When the project changes, React unmounts and remounts all children,
 * causing useToolState hooks to refetch data for the new project.
 */
export function ProjectKeyWrapper({ children }: { children: ReactNode }) {
  const { currentProject, isLoading } = useProject()

  if (isLoading) {
    return (
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-cream/5 rounded" />
            <div className="h-4 w-72 bg-cream/5 rounded" />
            <div className="h-32 bg-cream/5 rounded-card mt-8" />
          </div>
        </div>
      </div>
    )
  }

  return <div key={currentProject?.id ?? 'none'}>{children}</div>
}
