'use client'

import { useState, useEffect } from 'react'
import { useProject } from '@/contexts/ProjectContext'
import { ToolContent } from './ToolContent'
import type { FinishDecisionKit } from '@/data/finish-decision-kits'
import type { SelectionsWorkspaceInfo } from '@/lib/selections-workspace'

interface SelectionsWorkspaceLoaderProps {
  kits?: FinishDecisionKit[]
  emojiMap?: Record<string, string>
}

/**
 * Client-side workspace resolver + loader for Selections.
 *
 * Resolves the workspace anchor on mount (via API), then renders
 * ToolContent in workspace mode. Replaces the old CollectionPickerWrapper
 * as the primary Selections entry point.
 *
 * Kits and emojiMap are fetched server-side by the parent page component
 * and passed as props.
 */
export function SelectionsWorkspaceLoader({
  kits = [],
  emojiMap = {},
}: SelectionsWorkspaceLoaderProps) {
  const { currentProject } = useProject()
  const [workspaceInfo, setWorkspaceInfo] = useState<SelectionsWorkspaceInfo | null>(null)
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
          `/api/selections-workspace/resolve?projectId=${currentProject!.id}`
        )

        if (cancelled) return

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data.error || 'Failed to load workspace')
          setIsLoading(false)
          return
        }

        const info: SelectionsWorkspaceInfo = await res.json()
        setWorkspaceInfo(info)
      } catch {
        if (!cancelled) setError('Failed to load workspace')
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
        <div className="max-w-4xl mx-auto text-center py-12 text-cream/50">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !workspaceInfo) {
    return (
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-cream/50 mb-4">{error || 'Could not load Selections.'}</p>
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

  return (
    <ToolContent
      collectionId={workspaceInfo.workspaceCollectionId}
      kits={kits}
      emojiMap={emojiMap}
      workspaceInfo={workspaceInfo}
    />
  )
}
