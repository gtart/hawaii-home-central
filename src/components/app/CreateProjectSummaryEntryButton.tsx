'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProject } from '@/contexts/ProjectContext'

interface Props {
  /** Which type of entity is being linked from */
  artifactType: 'selection' | 'fix_item'
  /** The ID of the entity being linked */
  entityId: string
  /** Display label for the entity */
  entityLabel: string
  /** Tool key of the source tool (e.g. 'finish_decisions', 'punchlist') */
  toolKey: string
  /** Collection ID in the source tool */
  collectionId?: string
}

/**
 * Button that navigates to Project Summary with pre-linked artifact context.
 * Stores link info in sessionStorage so the Project Summary page can pick it up
 * and pre-populate a new change or decision with the artifact already attached.
 *
 * If the project has exactly one PS collection, navigates directly to it.
 * Otherwise, navigates to the collection picker.
 *
 * This component does NOT perform any writes — it only navigates with prefilled context.
 */
export function CreateProjectSummaryEntryButton({
  artifactType,
  entityId,
  entityLabel,
  toolKey,
  collectionId,
}: Props) {
  const router = useRouter()
  const { currentProject } = useProject()
  const [isLoading, setIsLoading] = useState(false)

  async function handleClick() {
    sessionStorage.setItem('hhc_project_summary_create_link', JSON.stringify({
      artifact_type: artifactType,
      entity_label: entityLabel,
      entity_id: entityId,
      tool_key: toolKey,
      collection_id: collectionId,
    }))

    // Try to auto-resolve to a single PS collection
    if (currentProject?.id) {
      setIsLoading(true)
      try {
        const res = await fetch(
          `/api/collections?projectId=${currentProject.id}&toolKey=project_summary`
        )
        if (res.ok) {
          const data = await res.json()
          const collections = data?.collections
          if (Array.isArray(collections) && collections.length === 1) {
            router.push(`/app/tools/project-summary/${collections[0].id}`)
            return
          }
        }
      } catch {
        // Fall through to picker
      } finally {
        setIsLoading(false)
      }
    }

    router.push('/app/tools/project-summary')
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className="flex items-center gap-1.5 text-[11px] text-cream/40 hover:text-cream/60 transition-colors disabled:opacity-50"
    >
      {isLoading ? (
        <div className="w-3 h-3 border border-cream/20 border-t-cream/50 rounded-full animate-spin" />
      ) : (
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      )}
      Add to Project Summary
    </button>
  )
}
