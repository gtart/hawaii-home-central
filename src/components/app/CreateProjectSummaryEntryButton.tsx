'use client'

import { useRouter } from 'next/navigation'

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
 * This component is the Project Summary equivalent of CreateAlignmentIssueButton.
 * It does NOT perform any writes — it only navigates with prefilled context.
 */
export function CreateProjectSummaryEntryButton({
  artifactType,
  entityId,
  entityLabel,
  toolKey,
  collectionId,
}: Props) {
  const router = useRouter()

  function handleClick() {
    sessionStorage.setItem('hhc_project_summary_create_link', JSON.stringify({
      artifact_type: artifactType,
      entity_label: entityLabel,
      entity_id: entityId,
      tool_key: toolKey,
      collection_id: collectionId,
    }))
    router.push('/app/tools/project-summary')
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center gap-1.5 text-[11px] text-cream/40 hover:text-cream/60 transition-colors"
    >
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
      </svg>
      Add to Project Summary
    </button>
  )
}
