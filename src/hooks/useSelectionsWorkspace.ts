'use client'

import { useCollectionState, type ActivityEventHint } from '@/hooks/useCollectionState'
import type { FinishDecisionsPayloadV4 } from '@/data/finish-decisions'

export type { ActivityEventHint }

type WorkspaceAccessLevel = 'OWNER' | 'EDITOR' | 'VIEWER'

interface UseSelectionsWorkspaceOptions {
  /** The resolved workspace anchor ID (from server-side getOrCreateSelectionsWorkspace) */
  workspaceId: string
}

export interface UseSelectionsWorkspaceReturn {
  state: FinishDecisionsPayloadV4
  setState: (updater: (prev: FinishDecisionsPayloadV4) => FinishDecisionsPayloadV4, events?: ActivityEventHint[]) => void
  isLoaded: boolean
  isSyncing: boolean
  access: WorkspaceAccessLevel | null
  readOnly: boolean
  noAccess: boolean
  conflictBanner: boolean
  viewOnlyAttempt: boolean
  title: string
  projectId: string | null
  /**
   * The underlying collection ID used as the workspace anchor.
   * Exposed only for boundary adapters (comments, share tokens) that
   * still need a collectionId internally. New Selections UI code
   * should not use this.
   */
  _anchorCollectionId: string
}

/**
 * Workspace-first hook for Selections state management.
 *
 * Wraps useCollectionState with Selections-specific typing and naming.
 * Callers pass a workspaceId (resolved server-side) and get back
 * workspace-scoped state without needing to know about collections.
 */
export function useSelectionsWorkspace({
  workspaceId,
}: UseSelectionsWorkspaceOptions): UseSelectionsWorkspaceReturn {
  const result = useCollectionState<FinishDecisionsPayloadV4 | any>({
    collectionId: workspaceId,
    toolKey: 'finish_decisions',
    localStorageKey: 'hhc_finish_decisions_v2',
    defaultValue: { version: 4, selections: [] },
  })

  return {
    state: result.state,
    setState: result.setState as UseSelectionsWorkspaceReturn['setState'],
    isLoaded: result.isLoaded,
    isSyncing: result.isSyncing,
    access: result.access,
    readOnly: result.readOnly,
    noAccess: result.noAccess,
    conflictBanner: result.conflictBanner,
    viewOnlyAttempt: result.viewOnlyAttempt,
    title: result.title,
    projectId: result.projectId,
    _anchorCollectionId: workspaceId,
  }
}
