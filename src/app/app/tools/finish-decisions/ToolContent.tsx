'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useToolState } from '@/hooks/useToolState'
import { useSelectionsWorkspace, type ActivityEventHint } from '@/hooks/useSelectionsWorkspace'
import { useProject } from '@/contexts/ProjectContext'
import { LocalModeBanner } from '@/components/guides/LocalModeBanner'
import { ToolPageHeader } from '@/components/app/ToolPageHeader'
import { ActivityPanel } from '@/components/app/ActivityPanel'
import { useUnseenActivityCount } from '@/hooks/useUnseenActivityCount'
import { UnsortedBanner } from '@/components/app/UnsortedBanner'
import { useCommentCounts } from '@/hooks/useComments'
import { useSelectionLastVisited } from '@/hooks/useSelectionLastVisited'
import { DecisionTrackerPage } from './components/DecisionTrackerPage'
import { MultiCollectionBanner } from './components/MultiCollectionBanner'
import type { FinishDecisionKit } from '@/data/finish-decision-kits'
import type { SelectionsWorkspaceInfo } from '@/lib/selections-workspace'
import {
  type RoomV3,
  type DecisionV3,
  type StatusV3,
  type RoomTypeV3,
  type FinishDecisionsPayloadV3,
  type FinishDecisionsPayloadV4,
  type SelectionV4,
  type V1FinishDecisionsPayload,
  type V1DecisionItem,
  type V2FinishDecisionsPayload,
  type OptionV3,
  resolveSelectionAccess,
} from '@/data/finish-decisions'

// ============================================================================
// MIGRATION FUNCTIONS
// ============================================================================

function migrateV1toV3(v1: V1FinishDecisionsPayload): FinishDecisionsPayloadV3 {
  const roomsMap = new Map<string, V1DecisionItem[]>()
  v1.items.forEach((item) => {
    const roomName = item.room || 'Other'
    if (!roomsMap.has(roomName)) roomsMap.set(roomName, [])
    roomsMap.get(roomName)!.push(item)
  })

  const rooms: RoomV3[] = []
  roomsMap.forEach((items, roomName) => {
    const categoriesMap = new Map<string, V1DecisionItem[]>()
    items.forEach((item) => {
      if (!categoriesMap.has(item.category)) categoriesMap.set(item.category, [])
      categoriesMap.get(item.category)!.push(item)
    })

    const decisions: DecisionV3[] = []
    categoriesMap.forEach((categoryItems, category) => {
      const options: OptionV3[] = categoryItems.map((item) => {
        const noteParts = [item.specs, item.notes, item.where ? `Where: ${item.where}` : '']
          .filter(Boolean).join('\n\n')
        return {
          id: crypto.randomUUID(),
          name: item.name,
          notes: noteParts.trim(),
          urls: item.links.map((link) => ({ id: link.id, url: link.url })),
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: item.updatedAt || new Date().toISOString(),
        }
      })
      const v1Status = categoryItems[0].status
      let v3Status: StatusV3 = 'deciding'
      if (v1Status === 'final') v3Status = 'selected'
      else if (v1Status === 'complete') v3Status = 'done'
      decisions.push({
        id: crypto.randomUUID(), title: category, status: v3Status, notes: '', options,
        createdAt: categoryItems[0].createdAt || new Date().toISOString(),
        updatedAt: categoryItems[0].updatedAt || new Date().toISOString(),
      })
    })
    rooms.push({
      id: crypto.randomUUID(), type: 'other' as RoomTypeV3, name: roomName, decisions,
      createdAt: items[0].createdAt || new Date().toISOString(),
      updatedAt: items[0].updatedAt || new Date().toISOString(),
    })
  })
  return { version: 3, rooms }
}

function migrateV2toV3(v2: V2FinishDecisionsPayload): FinishDecisionsPayloadV3 {
  const rooms: RoomV3[] = v2.rooms.map((room) => {
    let v3Type: RoomTypeV3 = 'other'
    if (room.type === 'kitchen') v3Type = 'kitchen'
    else if (room.type === 'bathroom') v3Type = 'bathroom'
    const roomDecisions = v2.decisions.filter((d) => d.roomId === room.id)
    const decisions: DecisionV3[] = roomDecisions.map((decision) => {
      const decisionOptions = v2.options.filter((o) => o.decisionId === decision.id)
      const options: OptionV3[] = decisionOptions.map((option) => {
        const noteParts = [option.specs, option.notes, option.where ? `Where: ${option.where}` : '', option.estimatedCost ? `Cost: ${option.estimatedCost}` : '']
          .filter(Boolean).join('\n\n')
        return {
          id: option.id, name: option.name, notes: noteParts.trim(),
          urls: option.links.map((link) => ({ id: link.id, url: link.url })),
          isSelected: decision.selectedOptionId === option.id,
          createdAt: option.createdAt, updatedAt: option.updatedAt,
        }
      })
      let v3Status: StatusV3 = 'deciding'
      if (decision.status === 'decided') v3Status = 'selected'
      else if (decision.status === 'ordered') v3Status = 'ordered'
      else if (decision.status === 'complete') v3Status = 'done'
      return { id: decision.id, title: decision.category, status: v3Status, notes: decision.notes || '', options, createdAt: decision.createdAt, updatedAt: decision.updatedAt }
    })
    return { id: room.id, type: v3Type, name: room.name, decisions, createdAt: room.createdAt, updatedAt: new Date().toISOString() }
  })
  return { version: 3, rooms }
}

function migrateV3toV4(v3: FinishDecisionsPayloadV3): FinishDecisionsPayloadV4 {
  const selections: SelectionV4[] = []
  const allAppliedKitIds: string[] = []
  for (const room of v3.rooms) {
    if (room.appliedKitIds) {
      for (const id of room.appliedKitIds) {
        if (!allAppliedKitIds.includes(id)) allAppliedKitIds.push(id)
      }
    }
    const roomTag = room.systemKey === 'global_uncategorized' ? 'Unsorted' : room.name
    for (const decision of room.decisions) {
      if (decision.systemKey === 'uncategorized' && decision.options.length === 0) continue
      const tags: string[] = roomTag ? [roomTag] : []
      selections.push({
        id: decision.id, title: decision.systemKey === 'uncategorized' ? 'Unsorted' : decision.title,
        status: decision.status, notes: decision.notes, options: decision.options, tags,
        dueDate: decision.dueDate, priority: decision.priority,
        dismissedSuggestionKeys: decision.dismissedSuggestionKeys,
        comments: decision.comments, picksByUser: decision.picksByUser,
        originKitId: decision.originKitId, finalSelection: decision.finalSelection,
        statusLog: decision.statusLog, files: decision.files, location: decision.location,
        createdAt: decision.createdAt, updatedAt: decision.updatedAt,
      })
    }
  }
  return { version: 4, selections, ownedKitIds: v3.ownedKitIds, appliedKitIds: allAppliedKitIds.length > 0 ? allAppliedKitIds : undefined }
}

function migrateToV4(payload: any): FinishDecisionsPayloadV4 {
  if (payload.version === 4) return payload as FinishDecisionsPayloadV4
  let v3: FinishDecisionsPayloadV3
  if (payload.version === 3) v3 = payload as FinishDecisionsPayloadV3
  else if (payload.version === 2) v3 = migrateV2toV3(payload as V2FinishDecisionsPayload)
  else v3 = migrateV1toV3(payload as V1FinishDecisionsPayload)
  return migrateV3toV4(v3)
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface ToolContentProps {
  localOnly?: boolean
  collectionId?: string
  kits?: FinishDecisionKit[]
  emojiMap?: Record<string, string>
  /** Workspace info from the resolver. When set, this is workspace mode. */
  workspaceInfo?: SelectionsWorkspaceInfo
}

export function ToolContent({
  localOnly = false,
  collectionId,
  kits = [],
  emojiMap = {},
  workspaceInfo,
}: ToolContentProps) {
  const isWorkspaceMode = !!workspaceInfo
  const { projects, currentProject } = useProject()
  const router = useRouter()
  const { data: session } = useSession()

  // Workspace mode: use workspace-first hook
  const workspaceResult = useSelectionsWorkspace({
    workspaceId: isWorkspaceMode ? workspaceInfo.workspaceCollectionId : '__disabled__',
  })

  // Legacy local-only mode: use tool-based state (for users not signed in)
  const toolResult = useToolState<FinishDecisionsPayloadV4 | any>({
    toolKey: 'finish_decisions',
    localStorageKey: 'hhc_finish_decisions_v2',
    defaultValue: { version: 4, selections: [] },
    localOnly,
  })

  // In workspace mode, always use workspace result. Local-only uses toolResult.
  const result = isWorkspaceMode ? workspaceResult : toolResult
  const { state, setState, isLoaded, isSyncing, noAccess } = result

  // The workspace anchor ID for adapter boundaries (comments, activity, sharing)
  const workspaceCollectionId = isWorkspaceMode ? workspaceResult._anchorCollectionId : collectionId

  const { counts: commentCounts, latestAt: commentLatestAt } = useCommentCounts(workspaceCollectionId)
  const selectionVisited = useSelectionLastVisited(workspaceCollectionId)
  const [activityOpen, setActivityOpen] = useState(false)
  const { count: unseenActivity, markSeen: markActivitySeen } = useUnseenActivityCount(
    workspaceCollectionId ? { toolKey: 'finish_decisions', collectionId: workspaceCollectionId } : undefined
  )

  // Redirect if loaded collection belongs to a different project
  useEffect(() => {
    if (isWorkspaceMode && isLoaded && workspaceResult.projectId && currentProject?.id && workspaceResult.projectId !== currentProject.id) {
      router.replace('/app/tools/finish-decisions')
    }
  }, [isWorkspaceMode, isLoaded, workspaceResult.projectId, currentProject?.id, router])

  function mapAccess(a: string | null): 'OWNER' | 'EDIT' | 'VIEW' | null {
    if (a === 'OWNER') return 'OWNER'
    if (a === 'EDITOR' || a === 'EDIT') return 'EDIT'
    if (a === 'VIEWER' || a === 'VIEW') return 'VIEW'
    return a as 'OWNER' | 'EDIT' | 'VIEW' | null
  }
  const access = mapAccess(result.access)
  const readOnly = access === 'VIEW'

  // Auto-migrate on load (V1/V2/V3 → V4)
  useEffect(() => {
    if (isLoaded && state.version !== 4) {
      const migrated = migrateToV4(state)
      setState(() => migrated)
    }
  }, [isLoaded, state, setState])

  // One-time import: migrate pre-account localStorage data into the user's FIRST project only.
  useEffect(() => {
    if (!isLoaded || localOnly) return
    if (projects.filter((p) => p.status === 'ACTIVE').length > 1) return
    const v4 = state.version === 4 ? (state as FinishDecisionsPayloadV4) : null
    if (!v4 || v4.selections.length > 0) return
    try {
      const LEGACY_KEY = 'hhc_finish_decisions_v2'
      const stored = localStorage.getItem(LEGACY_KEY)
      if (!stored) return
      const local = JSON.parse(stored)
      const localV4 = migrateToV4(local)
      if (localV4.selections.length === 0) return
      setState(() => localV4)
      localStorage.removeItem(LEGACY_KEY)
    } catch { /* ignore */ }
  }, [isLoaded, localOnly, state, setState, projects])

  // Ensure we're working with V4 data
  const v4State =
    state.version === 4
      ? (state as FinishDecisionsPayloadV4)
      : { version: 4 as const, selections: [] as SelectionV4[] }

  // Filter selections by visibility — restricted selections hidden from unauthorized users
  const userEmail = session?.user?.email || ''
  const workspaceAccessStr = access === 'OWNER' ? 'OWNER' : access === 'EDIT' ? 'EDITOR' : 'VIEWER'
  const visibleSelections = useMemo(() => {
    if (!userEmail || access === 'OWNER') return v4State.selections // owners see everything
    return v4State.selections.filter((s) => {
      const selAccess = resolveSelectionAccess(s, userEmail, workspaceAccessStr)
      return selAccess !== null
    })
  }, [v4State.selections, userEmail, access, workspaceAccessStr])

  const handleAcquireKit = (kitId: string) => {
    setState((prev) => {
      const p = prev as FinishDecisionsPayloadV4
      const existing = p.ownedKitIds || []
      if (existing.includes(kitId)) return prev
      return { ...p, ownedKitIds: [...existing, kitId] }
    })
  }

  const handleAddSelection = (title: string) => {
    const ts = new Date().toISOString()
    const selection: SelectionV4 = {
      id: crypto.randomUUID(), title, status: 'deciding' as StatusV3,
      notes: '', options: [], tags: [], createdAt: ts, updatedAt: ts,
    }
    const events: ActivityEventHint[] = [{
      action: 'created', entityType: 'decision',
      summaryText: `Added selection: "${title}"`, entityLabel: title,
    }]
    setState((prev) => {
      const p = prev as FinishDecisionsPayloadV4
      return { ...p, selections: [...p.selections, selection] }
    }, events)
  }

  const handleUpdateSelections = (selections: SelectionV4[]) => {
    setState((prev) => ({ ...prev, selections }))
  }

  const handleUpdateAppliedKitIds = (appliedKitIds: string[]) => {
    setState((prev) => ({ ...prev, appliedKitIds }))
  }

  // Collect unique tags for export scoping
  const tagScopes = Array.from(new Set(v4State.selections.flatMap((s) => s.tags))).sort().map((tag) => ({
    id: tag, name: tag, emoji: '🏷️',
  }))

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        {localOnly && (
          <LocalModeBanner signInUrl="/login?callbackUrl=/app/tools/finish-decisions" />
        )}
        {!localOnly && (
          <ToolPageHeader
            toolKey="finish_decisions"
            title="Choose Selections"
            description="Track the choices you need to make—and what you picked."
            accessLevel={access}
            hasContent={v4State.selections.length > 0}
            collectionId={workspaceCollectionId}
            eyebrowLabel="Choose Selections"
            toolLabel="Choose Selections"
            scopes={tagScopes}
            scopeLabel="Labels"
            buildExportUrl={({ projectId: pid, selectedScopeIds, scopeMode, includeNotes, includeComments, includePhotos }) => {
              const reportBase = `/app/tools/finish-decisions/report?projectId=${pid}`
              let url = `${reportBase}&includeNotes=${includeNotes}&includeComments=${includeComments}&includePhotos=${includePhotos}`
              if (scopeMode === 'selected' && selectedScopeIds.length > 0) {
                url += `&tags=${encodeURIComponent(selectedScopeIds.join(','))}`
              }
              return url
            }}
            actions={workspaceCollectionId ? (
              <button
                type="button"
                onClick={() => { setActivityOpen(true); markActivitySeen() }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-cream/50 hover:text-cream/70 bg-cream/5 hover:bg-cream/10 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Activity
                {unseenActivity > 0 && (
                  <span className="bg-sandstone/20 text-sandstone text-[10px] font-medium px-1.5 py-0.5 rounded-full tabular-nums">
                    {unseenActivity > 98 ? '99+' : unseenActivity}
                  </span>
                )}
              </button>
            ) : undefined}
          />
        )}
        {activityOpen && workspaceCollectionId && (
          <ActivityPanel
            onClose={() => setActivityOpen(false)}
            toolKey="finish_decisions"
            collectionId={workspaceCollectionId}
          />
        )}
        {isWorkspaceMode && workspaceInfo.hasMultipleCollections && (
          <MultiCollectionBanner
            collectionCount={workspaceInfo.collectionCount}
            projectId={workspaceResult.projectId || currentProject?.id || ''}
            primaryCollectionId={workspaceInfo.workspaceCollectionId}
          />
        )}
        <UnsortedBanner toolKey="finish_decisions" />
        {noAccess ? (
          <div className="bg-basalt-50 rounded-card p-8 text-center">
            <p className="text-cream/50 mb-2">You don&apos;t have access to Selections for this home.</p>
            <a href="/app" className="text-sandstone hover:text-sandstone-light text-sm">Back to Tools</a>
          </div>
        ) : isLoaded && state.version === 4 ? (
          <DecisionTrackerPage
            selections={visibleSelections}
            onUpdateSelections={handleUpdateSelections}
            onAcquireKit={handleAcquireKit}
            onAddSelection={handleAddSelection}
            readOnly={readOnly}
            kits={kits}
            emojiMap={emojiMap}
            ownedKitIds={v4State.ownedKitIds || []}
            appliedKitIds={v4State.appliedKitIds || []}
            onUpdateAppliedKitIds={handleUpdateAppliedKitIds}
            collectionId={workspaceCollectionId}
            projectId={workspaceResult.projectId || currentProject?.id}
            commentCounts={commentCounts}
            commentLatestAt={commentLatestAt}
            selectionVisited={selectionVisited}
          />
        ) : !isLoaded ? (
          <div className="text-center py-12 text-cream/50">
            <p>Loading...</p>
          </div>
        ) : (
          <div className="text-center py-12 text-cream/50">
            <p>Migrating to new format...</p>
          </div>
        )}

        {isSyncing && (
          <div className="fixed bottom-4 right-4 bg-basalt-50 rounded-card px-3 py-2 text-xs text-cream/30">
            Saving...
          </div>
        )}
      </div>
    </div>
  )
}
