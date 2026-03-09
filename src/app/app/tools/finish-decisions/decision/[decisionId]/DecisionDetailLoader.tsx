'use client'

import { useState, useEffect } from 'react'
import { useProject } from '@/contexts/ProjectContext'
import { DecisionDetailContent } from './DecisionDetailContent'
import type { FinishDecisionKit } from '@/data/finish-decision-kits'

interface DecisionDetailLoaderProps {
  kits?: FinishDecisionKit[]
  emojiMap?: Record<string, string>
}

/**
 * Resolves the workspace anchor ID before rendering DecisionDetailContent.
 * This ensures comments, activity, and sharing work correctly without
 * requiring collectionId in the URL.
 */
export function DecisionDetailLoader({
  kits = [],
  emojiMap = {},
}: DecisionDetailLoaderProps) {
  const { currentProject } = useProject()
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [isResolving, setIsResolving] = useState(true)

  useEffect(() => {
    if (!currentProject?.id) return

    let cancelled = false

    async function resolve() {
      try {
        const res = await fetch(
          `/api/selections-workspace/resolve?projectId=${currentProject!.id}`
        )
        if (cancelled) return
        if (res.ok) {
          const info = await res.json()
          setWorkspaceId(info.workspaceCollectionId)
        }
      } catch {
        // Silent — will fall back to useToolState behavior
      } finally {
        if (!cancelled) setIsResolving(false)
      }
    }

    resolve()
    return () => { cancelled = true }
  }, [currentProject?.id])

  if (isResolving) {
    return (
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center py-12 text-cream/50">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <DecisionDetailContent
      kits={kits}
      emojiMap={emojiMap}
      collectionId={workspaceId ?? undefined}
    />
  )
}
