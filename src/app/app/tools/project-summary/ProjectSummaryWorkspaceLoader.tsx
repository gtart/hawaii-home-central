'use client'

import { useState, useEffect } from 'react'
import { useProject } from '@/contexts/ProjectContext'
import { ToolContent } from './ToolContent'
import type { ProjectSummaryWorkspaceInfo } from '@/lib/project-summary-workspace'

/**
 * Client-side workspace resolver for Project Summary.
 *
 * Resolves the singleton workspace on mount (via API), then renders
 * ToolContent directly. No collection picker — one per project.
 */
export function ProjectSummaryWorkspaceLoader() {
  const { currentProject } = useProject()
  const [workspaceInfo, setWorkspaceInfo] = useState<ProjectSummaryWorkspaceInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!currentProject?.id) return

    let cancelled = false

    async function resolve() {
      setIsLoading(true)
      setError(null)

      try {
        const res = await fetch(
          `/api/tools/project-summary/resolve?projectId=${currentProject!.id}`
        )

        if (cancelled) return

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data.error || 'Failed to load Project Summary')
          setIsLoading(false)
          return
        }

        const info: ProjectSummaryWorkspaceInfo = await res.json()
        setWorkspaceInfo(info)
      } catch {
        if (!cancelled) setError('Failed to load Project Summary')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    resolve()
    return () => { cancelled = true }
  }, [currentProject?.id])

  if (!currentProject) {
    return (
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center py-12 text-cream/50">
          <p>No project selected.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-center py-24">
          <div className="w-6 h-6 border-2 border-sandstone/30 border-t-sandstone rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (error || !workspaceInfo) {
    return (
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-cream/50 mb-4">{error || 'Could not load Project Summary.'}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-sandstone hover:text-sandstone-light text-sm transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return <ToolContent collectionId={workspaceInfo.workspaceCollectionId} />
}
