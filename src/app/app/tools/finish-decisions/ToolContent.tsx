'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useToolState } from '@/hooks/useToolState'
import { useCollectionState } from '@/hooks/useCollectionState'
import { useProject } from '@/contexts/ProjectContext'
import { LocalModeBanner } from '@/components/guides/LocalModeBanner'
import { ToolPageHeader } from '@/components/app/ToolPageHeader'
import { InstanceSwitcher } from '@/components/app/InstanceSwitcher'
import { DecisionTrackerPage } from './components/DecisionTrackerPage'
import type { FinishDecisionKit } from '@/data/finish-decision-kits'
import {
  DEFAULT_DECISIONS_BY_ROOM_TYPE,
  ROOM_EMOJI_MAP,
  type RoomV3,
  type DecisionV3,
  type StatusV3,
  type RoomTypeV3,
  type FinishDecisionsPayloadV3,
  type V1FinishDecisionsPayload,
  type V1DecisionItem,
  type V2FinishDecisionsPayload,
  type V2Room,
  type V2Decision,
  type V2DecisionOption,
  type OptionV3,
  type RoomSelection,
} from '@/data/finish-decisions'

// ============================================================================
// MIGRATION FUNCTIONS
// ============================================================================

function migrateV1toV3(v1: V1FinishDecisionsPayload): FinishDecisionsPayloadV3 {
  // Group items by room name
  const roomsMap = new Map<string, V1DecisionItem[]>()

  v1.items.forEach((item) => {
    const roomName = item.room || 'Other'
    if (!roomsMap.has(roomName)) {
      roomsMap.set(roomName, [])
    }
    roomsMap.get(roomName)!.push(item)
  })

  const rooms: RoomV3[] = []

  roomsMap.forEach((items, roomName) => {
    // Group items by category within this room
    const categoriesMap = new Map<string, V1DecisionItem[]>()

    items.forEach((item) => {
      if (!categoriesMap.has(item.category)) {
        categoriesMap.set(item.category, [])
      }
      categoriesMap.get(item.category)!.push(item)
    })

    const decisions: DecisionV3[] = []

    categoriesMap.forEach((categoryItems, category) => {
      const options: OptionV3[] = categoryItems.map((item) => {
        // Combine specs, notes, and where into single notes field
        const noteParts = [item.specs, item.notes, item.where ? `Where: ${item.where}` : '']
          .filter(Boolean)
          .join('\n\n')

        return {
          id: crypto.randomUUID(),
          name: item.name,
          notes: noteParts.trim(),
          urls: item.links.map((link) => ({
            id: link.id,
            url: link.url,
          })),
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: item.updatedAt || new Date().toISOString(),
        }
      })

      // Map V1 status to V3
      const v1Status = categoryItems[0].status
      let v3Status: StatusV3 = 'deciding'
      if (v1Status === 'deciding') v3Status = 'deciding'
      else if (v1Status === 'awaiting_approval') v3Status = 'deciding'
      else if (v1Status === 'final') v3Status = 'selected'
      else if (v1Status === 'complete') v3Status = 'done'

      decisions.push({
        id: crypto.randomUUID(),
        title: category,
        status: v3Status,
        notes: '', // V1 didn't have decision-level notes
        options,
        createdAt: categoryItems[0].createdAt || new Date().toISOString(),
        updatedAt: categoryItems[0].updatedAt || new Date().toISOString(),
      })
    })

    rooms.push({
      id: crypto.randomUUID(),
      type: 'other', // V1 didn't have room types
      name: roomName,
      decisions,
      createdAt: items[0].createdAt || new Date().toISOString(),
      updatedAt: items[0].updatedAt || new Date().toISOString(),
    })
  })

  return {
    version: 3,
    rooms,
  }
}

function migrateV2toV3(v2: V2FinishDecisionsPayload): FinishDecisionsPayloadV3 {
  const rooms: RoomV3[] = v2.rooms.map((room) => {
    // Map V2 room type to V3
    let v3Type: RoomTypeV3 = 'other'
    if (room.type === 'kitchen') v3Type = 'kitchen'
    else if (room.type === 'bathroom') v3Type = 'bathroom'
    else if (room.type === 'exterior') v3Type = 'other'
    else if (room.type === 'whole_house') v3Type = 'other'
    else if (room.type === 'other') v3Type = 'other'

    // Find all decisions for this room
    const roomDecisions = v2.decisions.filter((d) => d.roomId === room.id)

    const decisions: DecisionV3[] = roomDecisions.map((decision) => {
      // Find all options for this decision
      const decisionOptions = v2.options.filter((o) => o.decisionId === decision.id)

      const options: OptionV3[] = decisionOptions.map((option) => {
        // Combine specs, notes, where, and cost into single notes field
        const noteParts = [
          option.specs,
          option.notes,
          option.where ? `Where: ${option.where}` : '',
          option.estimatedCost ? `Cost: ${option.estimatedCost}` : '',
        ]
          .filter(Boolean)
          .join('\n\n')

        return {
          id: option.id,
          name: option.name,
          notes: noteParts.trim(),
          urls: option.links.map((link) => ({
            id: link.id,
            url: link.url,
          })),
          isSelected: decision.selectedOptionId === option.id,
          createdAt: option.createdAt,
          updatedAt: option.updatedAt,
        }
      })

      // Map V2 status to V3
      let v3Status: StatusV3 = 'deciding'
      if (decision.status === 'exploring') v3Status = 'deciding'
      else if (decision.status === 'comparing') v3Status = 'deciding'
      else if (decision.status === 'decided') v3Status = 'selected'
      else if (decision.status === 'ordered') v3Status = 'ordered'
      else if (decision.status === 'complete') v3Status = 'done'

      return {
        id: decision.id,
        title: decision.category,
        status: v3Status,
        notes: decision.notes || '',
        options,
        createdAt: decision.createdAt,
        updatedAt: decision.updatedAt,
      }
    })

    return {
      id: room.id,
      type: v3Type,
      name: room.name,
      decisions,
      createdAt: room.createdAt,
      updatedAt: new Date().toISOString(),
    }
  })

  return {
    version: 3,
    rooms,
  }
}

function migrateToV3(payload: any): FinishDecisionsPayloadV3 {
  if (payload.version === 3) {
    return payload as FinishDecisionsPayloadV3
  } else if (payload.version === 2) {
    return migrateV2toV3(payload as V2FinishDecisionsPayload)
  } else if (payload.version === 1) {
    return migrateV1toV3(payload as V1FinishDecisionsPayload)
  } else {
    return migrateV1toV3(payload as V1FinishDecisionsPayload)
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface ToolContentProps {
  localOnly?: boolean
  collectionId?: string
  kits?: FinishDecisionKit[]
  defaultDecisions?: Record<RoomTypeV3, string[]>
  emojiMap?: Record<string, string>
}

export function ToolContent({
  localOnly = false,
  collectionId,
  kits = [],
  defaultDecisions,
  emojiMap = {},
}: ToolContentProps) {
  const resolvedDefaults = defaultDecisions || DEFAULT_DECISIONS_BY_ROOM_TYPE
  const { projects, currentProject } = useProject()
  const router = useRouter()

  // Collection mode: use collection-based state
  const collResult = useCollectionState<FinishDecisionsPayloadV3 | any>({
    collectionId: collectionId ?? null,
    toolKey: 'finish_decisions',
    localStorageKey: 'hhc_finish_decisions_v2',
    defaultValue: { version: 3, rooms: [] },
  })

  // Legacy mode: use tool-based state
  const toolResult = useToolState<FinishDecisionsPayloadV3 | any>({
    toolKey: 'finish_decisions',
    localStorageKey: 'hhc_finish_decisions_v2',
    defaultValue: { version: 3, rooms: [] },
    localOnly,
  })

  const useCollMode = !!collectionId
  const result = useCollMode ? collResult : toolResult
  const { state, setState, isLoaded, isSyncing, noAccess } = result
  const collectionTitle = useCollMode ? collResult.title : undefined

  // Redirect to picker if the loaded collection belongs to a different project
  useEffect(() => {
    if (collectionId && isLoaded && collResult.projectId && currentProject?.id && collResult.projectId !== currentProject.id) {
      router.replace('/app/tools/finish-decisions')
    }
  }, [collectionId, isLoaded, collResult.projectId, currentProject?.id, router])
  function mapAccess(a: string | null): 'OWNER' | 'EDIT' | 'VIEW' | null {
    if (a === 'OWNER') return 'OWNER'
    if (a === 'EDITOR' || a === 'EDIT') return 'EDIT'
    if (a === 'VIEWER' || a === 'VIEW') return 'VIEW'
    return a as 'OWNER' | 'EDIT' | 'VIEW' | null
  }
  const access = mapAccess(result.access)
  const readOnly = access === 'VIEW'

  // Auto-migrate on load
  useEffect(() => {
    if (isLoaded && state.version !== 3) {
      const migrated = migrateToV3(state)
      setState(() => migrated)
    }
  }, [isLoaded, state, setState])

  // Flatten multi-room collections into single room (board = area model)
  useEffect(() => {
    if (!isLoaded || state.version !== 3) return
    const v3 = state as FinishDecisionsPayloadV3
    if (v3.rooms.length <= 1) return // already flat or empty
    const allDecisions = v3.rooms.flatMap((r) => r.decisions)
    const primary = v3.rooms[0]
    setState(() => ({
      ...v3,
      rooms: [{
        ...primary,
        decisions: allDecisions,
        appliedKitIds: v3.rooms.flatMap((r) => r.appliedKitIds ?? []),
      }],
    }))
  }, [isLoaded, state, setState])

  // One-time import: migrate pre-account localStorage data into the user's FIRST project only.
  // Never runs when the user has multiple projects — empty projects should stay empty.
  useEffect(() => {
    if (!isLoaded || localOnly) return
    // Only import for users with a single project (initial signup migration)
    if (projects.filter((p) => p.status === 'ACTIVE').length > 1) return

    const v3 = state.version === 3 ? (state as FinishDecisionsPayloadV3) : null
    if (!v3 || v3.rooms.length > 0) return // Already has account data

    try {
      const LEGACY_KEY = 'hhc_finish_decisions_v2'
      const stored = localStorage.getItem(LEGACY_KEY)
      if (!stored) return

      const local = JSON.parse(stored)
      const localV3 = local.version === 3 ? (local as FinishDecisionsPayloadV3) : migrateToV3(local)
      if (localV3.rooms.length === 0) return

      setState(() => localV3)
      localStorage.removeItem(LEGACY_KEY)
    } catch {
      // ignore
    }
  }, [isLoaded, localOnly, state, setState, projects])

  // Ensure we're working with V3 data
  const v3State =
    state.version === 3
      ? (state as FinishDecisionsPayloadV3)
      : { version: 3 as const, rooms: [] }

  // Add room
  const handleAddRoom = (type: RoomTypeV3, name: string, useDefaults: boolean) => {
    const room: RoomV3 = {
      id: crypto.randomUUID(),
      type,
      name,
      decisions: useDefaults
        ? (resolvedDefaults[type] || []).map((title) => ({
            id: crypto.randomUUID(),
            title,
            status: 'deciding' as StatusV3,
            notes: '',
            options: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }))
        : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setState((prev) => ({
      ...prev,
      rooms: [...(prev as FinishDecisionsPayloadV3).rooms, room],
    }))
  }

  // Batch add rooms (from onboarding)
  const handleBatchAddRooms = (selections: RoomSelection[]) => {
    const now = new Date().toISOString()
    const existingNames = v3State.rooms.map((r) => r.name.toLowerCase())

    const newRooms: RoomV3[] = selections.map((sel) => {
      let name = sel.name
      if (existingNames.includes(name.toLowerCase())) {
        let counter = 2
        while (existingNames.includes(`${sel.name} #${counter}`.toLowerCase())) {
          counter++
        }
        name = `${sel.name} #${counter}`
      }
      existingNames.push(name.toLowerCase())

      return {
        id: crypto.randomUUID(),
        type: sel.type,
        name,
        decisions:
          sel.template === 'standard'
            ? (resolvedDefaults[sel.type] || []).map((title) => ({
                id: crypto.randomUUID(),
                title,
                status: 'deciding' as StatusV3,
                notes: '',
                options: [],
                createdAt: now,
                updatedAt: now,
              }))
            : [],
        createdAt: now,
        updatedAt: now,
      }
    })

    setState((prev) => ({
      ...prev,
      rooms: [...(prev as FinishDecisionsPayloadV3).rooms, ...newRooms],
    }))
  }

  // Update room
  const handleUpdateRoom = (roomId: string, updates: Partial<RoomV3>) => {
    setState((prev) => ({
      ...prev,
      rooms: (prev as FinishDecisionsPayloadV3).rooms.map((r) =>
        r.id === roomId ? { ...r, ...updates } : r
      ),
    }))
  }

  // Delete room (confirmation handled by RoomSection's TextConfirmDialog)
  const handleDeleteRoom = (roomId: string) => {
    setState((prev) => ({
      ...prev,
      rooms: (prev as FinishDecisionsPayloadV3).rooms.filter((r) => r.id !== roomId),
    }))
  }

  // Acquire (own) a pack — adds to ownedKitIds immediately
  const handleAcquireKit = (kitId: string) => {
    setState((prev) => {
      const p = prev as FinishDecisionsPayloadV3
      const existing = p.ownedKitIds || []
      if (existing.includes(kitId)) return prev
      return { ...p, ownedKitIds: [...existing, kitId] }
    })
  }

  // Add a single selection to the board (auto-creates the room if needed)
  const handleAddSelection = (title: string) => {
    const ts = new Date().toISOString()
    const decision: DecisionV3 = {
      id: crypto.randomUUID(),
      title,
      status: 'deciding' as StatusV3,
      notes: '',
      options: [],
      createdAt: ts,
      updatedAt: ts,
    }
    setState((prev) => {
      const p = prev as FinishDecisionsPayloadV3
      if (p.rooms.length === 0) {
        // Auto-create a single room for this board
        const room: RoomV3 = {
          id: crypto.randomUUID(),
          type: 'other' as RoomTypeV3,
          name: collectionTitle || 'Selections',
          decisions: [decision],
          createdAt: ts,
          updatedAt: ts,
        }
        return { ...p, rooms: [room] }
      }
      // Add to the first (only) room
      return {
        ...p,
        rooms: p.rooms.map((r, i) =>
          i === 0 ? { ...r, decisions: [...r.decisions, decision], updatedAt: ts } : r
        ),
      }
    })
  }

  const handleRename = useCallback(async (newTitle: string) => {
    if (!collectionId) return
    try {
      await fetch(`/api/collections/${collectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      })
      router.refresh()
    } catch { /* ignore */ }
  }, [collectionId, router])

  const handleArchive = useCallback(async () => {
    if (!collectionId || !confirm('Archive this list? You can restore it later.')) return
    try {
      await fetch(`/api/collections/${collectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archivedAt: new Date().toISOString() }),
      })
      router.push('/app/tools/finish-decisions')
    } catch { /* ignore */ }
  }, [collectionId, router])

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        {localOnly && (
          <LocalModeBanner signInUrl="/login?callbackUrl=/app/tools/finish-decisions" />
        )}
        {!localOnly && (
          <ToolPageHeader
            toolKey="finish_decisions"
            title="Selection List"
            description="Track the choices you need to make—and what you picked."
            accessLevel={access}
            hasContent={v3State.rooms.length > 0}
            collectionId={collectionId}
            collectionName={collectionTitle}
            eyebrowLabel="Selection List"
            backHref={collectionId ? '/app/tools/finish-decisions' : undefined}
            backLabel={collectionId ? 'All Selection Lists' : undefined}
            headerSlot={collectionId ? <InstanceSwitcher toolKey="finish_decisions" currentCollectionId={collectionId} itemNoun="Selection List" /> : undefined}
            toolLabel="Selection List"
            scopes={v3State.rooms
              .filter((r) => r.systemKey !== 'global_uncategorized')
              .map((r) => ({
                id: r.id,
                name: r.name,
                emoji: ROOM_EMOJI_MAP[r.type] || '🏠',
              }))}
            scopeLabel="Areas"
            buildExportUrl={({ projectId: pid, selectedScopeIds, scopeMode, includeNotes, includeComments, includePhotos }) => {
              const reportBase = collectionId
                ? `/app/tools/finish-decisions/${collectionId}/report`
                : `/app/tools/finish-decisions/report?projectId=${pid}`
              const sep = reportBase.includes('?') ? '&' : '?'
              let url = `${reportBase}${sep}includeNotes=${includeNotes}&includeComments=${includeComments}&includePhotos=${includePhotos}`
              if (scopeMode === 'selected' && selectedScopeIds.length > 0) {
                url += `&roomIds=${encodeURIComponent(selectedScopeIds.join(','))}`
              }
              return url
            }}
            onRename={collectionId ? handleRename : undefined}
            onArchive={collectionId ? handleArchive : undefined}
          />
        )}
        {noAccess ? (
          <div className="bg-basalt-50 rounded-card p-8 text-center">
            <p className="text-cream/50 mb-2">You don&apos;t have access to this tool for the current home.</p>
            <a href="/app" className="text-sandstone hover:text-sandstone-light text-sm">Back to Tools</a>
          </div>
        ) : isLoaded && state.version === 3 ? (
          <DecisionTrackerPage
            rooms={v3State.rooms}
            onBatchAddRooms={handleBatchAddRooms}
            onUpdateRoom={handleUpdateRoom}
            onDeleteRoom={handleDeleteRoom}
            onAcquireKit={handleAcquireKit}
            onAddSelection={handleAddSelection}
            readOnly={readOnly}
            kits={kits}
            defaultDecisions={resolvedDefaults}
            emojiMap={emojiMap}
            ownedKitIds={v3State.ownedKitIds || []}
            collectionId={collectionId}
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
