'use client'

import { useEffect, useState, useMemo } from 'react'
import { useToolState } from '@/hooks/useToolState'
import { useProject } from '@/contexts/ProjectContext'
import { LocalModeBanner } from '@/components/guides/LocalModeBanner'
import { ToolPageHeader } from '@/components/app/ToolPageHeader'
import { DecisionTrackerPage } from './components/DecisionTrackerPage'
import { ShareExportModal } from '@/components/app/ShareExportModal'
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
  kits?: FinishDecisionKit[]
  defaultDecisions?: Record<RoomTypeV3, string[]>
  emojiMap?: Record<string, string>
}

export function ToolContent({
  localOnly = false,
  kits = [],
  defaultDecisions,
  emojiMap = {},
}: ToolContentProps) {
  const resolvedDefaults = defaultDecisions || DEFAULT_DECISIONS_BY_ROOM_TYPE
  const { projects, currentProject } = useProject()
  const [showShareExport, setShowShareExport] = useState(false)
  const { state, setState, isLoaded, isSyncing, access, readOnly, noAccess } = useToolState<
    FinishDecisionsPayloadV3 | any
  >({
    toolKey: 'finish_decisions',
    localStorageKey: 'hhc_finish_decisions_v2', // Keep same key for migration
    defaultValue: { version: 3, rooms: [] },
    localOnly,
  })

  // Auto-migrate on load
  useEffect(() => {
    if (isLoaded && state.version !== 3) {
      const migrated = migrateToV3(state)
      setState(() => migrated)
    }
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

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        {localOnly && (
          <LocalModeBanner signInUrl="/login?callbackUrl=/app/tools/finish-decisions" />
        )}
        {!localOnly && (
          <ToolPageHeader
            toolKey="finish_decisions"
            title="Decision Tracker"
            description="Avoid delays and rework—by keeping decisions, links, and status updates together for each area."
            accessLevel={access}
            hasContent={v3State.rooms.length > 0}
            actions={v3State.rooms.length > 0 ? (
              <button
                type="button"
                onClick={() => setShowShareExport(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-sandstone/15 text-sandstone hover:bg-sandstone/25 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="16 6 12 2 8 6" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="12" y1="2" x2="12" y2="15" strokeLinecap="round" />
                </svg>
                Share &amp; Export
              </button>
            ) : undefined}
          />
        )}
        {noAccess ? (
          <div className="bg-basalt-50 rounded-card p-8 text-center">
            <p className="text-cream/50 mb-2">You don&apos;t have access to this tool for the current project.</p>
            <a href="/app" className="text-sandstone hover:text-sandstone-light text-sm">Back to Home Project Tools</a>
          </div>
        ) : isLoaded && state.version === 3 ? (
          <DecisionTrackerPage
            rooms={v3State.rooms}
            onBatchAddRooms={handleBatchAddRooms}
            onUpdateRoom={handleUpdateRoom}
            onDeleteRoom={handleDeleteRoom}
            onAcquireKit={handleAcquireKit}
            readOnly={readOnly}
            kits={kits}
            defaultDecisions={resolvedDefaults}
            emojiMap={emojiMap}
            ownedKitIds={v3State.ownedKitIds || []}
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

      {showShareExport && currentProject && (
        <ShareExportModal
          toolKey="finish_decisions"
          toolLabel="Decision Tracker"
          projectId={currentProject.id}
          isOwner={access === 'OWNER'}
          onClose={() => setShowShareExport(false)}
          scopes={v3State.rooms
            .filter((r) => r.systemKey !== 'global_uncategorized')
            .map((r) => ({
              id: r.id,
              name: r.name,
              emoji: ROOM_EMOJI_MAP[r.type] || '🏠',
            }))}
          scopeLabel="Areas"
          buildExportUrl={({ projectId: pid, includeNotes: notes, includeComments: comments, includePhotos: photos, scopeMode, selectedScopeIds }) => {
            let url = `/app/tools/finish-decisions/report?projectId=${pid}&includeNotes=${notes}&includeComments=${comments}&includePhotos=${photos}`
            if (scopeMode === 'selected' && selectedScopeIds.length > 0) {
              url += `&roomIds=${encodeURIComponent(selectedScopeIds.join(','))}`
            }
            return url
          }}
        />
      )}
    </div>
  )
}
