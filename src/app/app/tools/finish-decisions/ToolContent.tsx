'use client'

import { useEffect } from 'react'
import { useToolState } from '@/hooks/useToolState'
import { LocalModeBanner } from '@/components/guides/LocalModeBanner'
import { DecisionTrackerPage } from './components/DecisionTrackerPage'
import {
  DEFAULT_DECISIONS_BY_ROOM_TYPE,
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
      else if (v1Status === 'awaiting_approval') v3Status = 'shortlist'
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
      else if (decision.status === 'comparing') v3Status = 'shortlist'
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
    console.log('Migrating V2 → V3...')
    return migrateV2toV3(payload as V2FinishDecisionsPayload)
  } else if (payload.version === 1) {
    console.log('Migrating V1 → V3...')
    return migrateV1toV3(payload as V1FinishDecisionsPayload)
  } else {
    // No version field = assume V1
    console.log('No version detected, assuming V1 and migrating to V3...')
    return migrateV1toV3(payload as V1FinishDecisionsPayload)
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface ToolContentProps {
  localOnly?: boolean
}

export function ToolContent({ localOnly = false }: ToolContentProps) {
  const { state, setState, isLoaded, isSyncing } = useToolState<
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
      console.log('Auto-migrating to V3...')
      const migrated = migrateToV3(state)
      setState(() => migrated)
    }
  }, [isLoaded, state, setState])

  // Import local data when user signs in for the first time
  useEffect(() => {
    if (!isLoaded || localOnly) return

    const v3 = state.version === 3 ? (state as FinishDecisionsPayloadV3) : null
    if (!v3 || v3.rooms.length > 0) return // Already has account data

    try {
      const stored = localStorage.getItem('hhc_finish_decisions_v2')
      if (!stored) return

      const local = JSON.parse(stored)
      const localV3 = local.version === 3 ? (local as FinishDecisionsPayloadV3) : migrateToV3(local)
      if (localV3.rooms.length === 0) return

      // Auto-import local rooms into account
      setState(() => localV3)
    } catch {
      // ignore
    }
  }, [isLoaded, localOnly, state, setState])

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
        ? DEFAULT_DECISIONS_BY_ROOM_TYPE[type].map((title) => ({
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
            ? DEFAULT_DECISIONS_BY_ROOM_TYPE[sel.type].map((title) => ({
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

  // Delete room
  const handleDeleteRoom = (roomId: string) => {
    const room = v3State.rooms.find((r) => r.id === roomId)
    if (room && confirm(`Delete ${room.name}? This will also delete all decisions and options.`)) {
      setState((prev) => ({
        ...prev,
        rooms: (prev as FinishDecisionsPayloadV3).rooms.filter((r) => r.id !== roomId),
      }))
    }
  }

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        {localOnly && (
          <LocalModeBanner signInUrl="/login?callbackUrl=/app/tools/finish-decisions" />
        )}
        {isLoaded && state.version === 3 ? (
          <DecisionTrackerPage
            rooms={v3State.rooms}
            onBatchAddRooms={handleBatchAddRooms}
            onUpdateRoom={handleUpdateRoom}
            onDeleteRoom={handleDeleteRoom}
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
