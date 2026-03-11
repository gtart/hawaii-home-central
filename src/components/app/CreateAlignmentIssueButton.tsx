'use client'

import { useRouter } from 'next/navigation'

interface Props {
  artifactType: 'selection' | 'fix_item'
  entityId: string
  entityLabel: string
  toolKey: string
  collectionId?: string
}

/**
 * Small button that navigates to Project Alignment with a pre-linked artifact.
 * Stores link info in sessionStorage so AlignmentListPage can pick it up
 * and auto-open the create form with the artifact pre-attached.
 */
export function CreateAlignmentIssueButton({ artifactType, entityId, entityLabel, toolKey, collectionId }: Props) {
  const router = useRouter()

  function handleClick() {
    sessionStorage.setItem('hhc_alignment_create_link', JSON.stringify({
      artifact_type: artifactType,
      entity_label: entityLabel,
      entity_id: entityId,
      tool_key: toolKey,
      collection_id: collectionId,
    }))
    router.push('/app/tools/project-alignment')
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center gap-1.5 text-[11px] text-amber-400/50 hover:text-amber-400/80 transition-colors"
    >
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
      </svg>
      Create Alignment Issue
    </button>
  )
}
