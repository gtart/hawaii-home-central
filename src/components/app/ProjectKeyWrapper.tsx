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

  if (isLoading) return null

  return <div key={currentProject?.id ?? 'none'}>{children}</div>
}
