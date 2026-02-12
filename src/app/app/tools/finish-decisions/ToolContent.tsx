'use client'

import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { ShareButton } from '@/components/resources/ShareButton'
import { useToolState } from '@/hooks/useToolState'
import {
  ROOM_TYPE_OPTIONS_V3,
  STATUS_CONFIG_V3,
  DEFAULT_DECISIONS_BY_ROOM_TYPE,
  type RoomV3,
  type DecisionV3,
  type OptionV3,
  type StatusV3,
  type RoomTypeV3,
  type FinishDecisionsPayloadV3,
  type V1FinishDecisionsPayload,
  type V1DecisionItem,
  type V2FinishDecisionsPayload,
  type V2Room,
  type V2Decision,
  type V2DecisionOption,
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
        notes: decision.notes || '', // V2 didn't have decision-level specs
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
// ADD ROOM MODAL
// ============================================================================

function AddRoomModal({
  onClose,
  onAdd,
  existingRooms,
}: {
  onClose: () => void
  onAdd: (type: RoomTypeV3, name: string, useDefaults: boolean) => void
  existingRooms: RoomV3[]
}) {
  const [roomType, setRoomType] = useState<RoomTypeV3>('kitchen')
  const [roomName, setRoomName] = useState('')
  const [useDefaults, setUseDefaults] = useState(true)
  const [error, setError] = useState('')

  // Auto-fill name based on type with auto-increment for duplicates
  useEffect(() => {
    const label = ROOM_TYPE_OPTIONS_V3.find((opt) => opt.value === roomType)?.label || ''

    // Find existing rooms with similar names
    const existingNames = existingRooms.map((r) => r.name.toLowerCase())

    // Check if base name exists
    if (!existingNames.includes(label.toLowerCase())) {
      setRoomName(label)
    } else {
      // Find next available number
      let counter = 2
      let newName = `${label} #${counter}`
      while (existingNames.includes(newName.toLowerCase())) {
        counter++
        newName = `${label} #${counter}`
      }
      setRoomName(newName)
    }
  }, [roomType, existingRooms])

  const handleAdd = () => {
    if (!roomName.trim()) {
      setError('Room name is required')
      return
    }

    onAdd(roomType, roomName.trim(), useDefaults)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-basalt/80 flex items-center justify-center z-50 p-4">
      <div className="bg-basalt-50 rounded-card p-6 max-w-md w-full space-y-4">
        <h3 className="text-xl font-serif text-sandstone">Add Room or Area</h3>

        <Select
          label="Room or Area Type"
          value={roomType}
          onChange={(e) => setRoomType(e.target.value as RoomTypeV3)}
          options={ROOM_TYPE_OPTIONS_V3.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
        />

        <Input
          label="Name"
          placeholder="e.g., Main Kitchen, Master Bath"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          error={error}
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="use-defaults"
            checked={useDefaults}
            onChange={(e) => setUseDefaults(e.target.checked)}
            className="accent-sandstone"
          />
          <label htmlFor="use-defaults" className="text-sm text-cream/80">
            Start with default decisions
          </label>
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={handleAdd}>Create Room</Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// ROOMS LIST VIEW
// ============================================================================

function RoomsListView({
  rooms,
  onAddRoom,
  onSelectRoom,
  onDeleteRoom,
}: {
  rooms: RoomV3[]
  onAddRoom: (type: RoomTypeV3, name: string, useDefaults: boolean) => void
  onSelectRoom: (roomId: string) => void
  onDeleteRoom: (roomId: string) => void
}) {
  const [showAddModal, setShowAddModal] = useState(false)

  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-2">
        <h1 className="font-serif text-4xl md:text-5xl text-sandstone">Finish Decisions</h1>
        <div className="shrink-0 mt-2">
          <ShareButton title="Finish Decisions &mdash; Hawaii Home Central" />
        </div>
      </div>
      <p className="text-cream/70 text-lg mb-8 leading-relaxed">
        Organize decisions by room or area. Track options, compare choices, mark what you've
        selected.
      </p>

      <div className="mb-6">
        <Button onClick={() => setShowAddModal(true)}>Add Room or Area</Button>
      </div>

      {rooms.length === 0 ? (
        <div className="bg-basalt-50 rounded-card p-12 text-center">
          <p className="text-cream/50 mb-4">No rooms yet. Add your first room to get started.</p>
          <Button onClick={() => setShowAddModal(true)}>Add Room or Area</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rooms.map((room) => {
            const stats = {
              deciding: room.decisions.filter(
                (d) => d.status === 'deciding' || d.status === 'shortlist'
              ).length,
              selected: room.decisions.filter((d) => d.status === 'selected').length,
              ordered: room.decisions.filter((d) => d.status === 'ordered').length,
              done: room.decisions.filter((d) => d.status === 'done').length,
            }

            return (
              <div
                key={room.id}
                className="bg-basalt-50 rounded-card p-4 hover:bg-basalt-50/80 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => onSelectRoom(room.id)}
                  >
                    <h3 className="text-cream font-medium text-lg mb-1">{room.name}</h3>
                    <Badge variant="default" className="text-xs">
                      {ROOM_TYPE_OPTIONS_V3.find((t) => t.value === room.type)?.label}
                    </Badge>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (
                        confirm(
                          `Delete ${room.name}? This will also delete all decisions and options in this room.`
                        )
                      ) {
                        onDeleteRoom(room.id)
                      }
                    }}
                    className="text-cream/40 hover:text-red-400 text-xs ml-2"
                  >
                    Delete
                  </button>
                </div>

                <div
                  className="text-sm text-cream/60 cursor-pointer"
                  onClick={() => onSelectRoom(room.id)}
                >
                  {stats.deciding > 0 && (
                    <span>
                      {stats.deciding} deciding
                      {stats.selected > 0 || stats.ordered > 0 || stats.done > 0 ? ' · ' : ''}
                    </span>
                  )}
                  {stats.selected > 0 && (
                    <span>
                      {stats.selected} selected
                      {stats.ordered > 0 || stats.done > 0 ? ' · ' : ''}
                    </span>
                  )}
                  {stats.ordered > 0 && (
                    <span>
                      {stats.ordered} ordered{stats.done > 0 ? ' · ' : ''}
                    </span>
                  )}
                  {stats.done > 0 && <span>{stats.done} done</span>}
                  {room.decisions.length === 0 && (
                    <span className="text-cream/40">No decisions yet</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showAddModal && (
        <AddRoomModal
          onClose={() => setShowAddModal(false)}
          onAdd={onAddRoom}
          existingRooms={rooms}
        />
      )}
    </>
  )
}

// ============================================================================
// SEARCH RESULTS VIEW
// ============================================================================

function SearchResultsView({
  rooms,
  searchQuery,
  onClearSearch,
  onSelectDecision,
}: {
  rooms: RoomV3[]
  searchQuery: string
  onClearSearch: () => void
  onSelectDecision: (roomId: string, decisionId: string) => void
}) {
  // Filter all rooms and decisions
  const results = useMemo(() => {
    const query = searchQuery.toLowerCase()

    return rooms
      .map((room) => {
        const matchingDecisions = room.decisions.filter((decision) => {
          const searchable = [
            decision.title,
            decision.notes,
            ...decision.options.flatMap((opt) => [
              opt.name,
              opt.notes,
              ...opt.urls.map((u) => u.url),
            ]),
          ]
            .join(' ')
            .toLowerCase()

          return searchable.includes(query)
        })

        return { room, decisions: matchingDecisions }
      })
      .filter((r) => r.decisions.length > 0)
  }, [rooms, searchQuery])

  const totalResults = results.reduce((sum, r) => sum + r.decisions.length, 0)

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-2">
        <h1 className="font-serif text-4xl md:text-5xl text-sandstone">Search Results</h1>
        <div className="shrink-0 mt-2">
          <ShareButton title="Finish Decisions &mdash; Hawaii Home Central" />
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <p className="text-cream/70 text-lg">
          {totalResults} result{totalResults !== 1 ? 's' : ''} across {results.length} room
          {results.length !== 1 ? 's' : ''}
        </p>
        <Button variant="secondary" onClick={onClearSearch}>
          Clear Search
        </Button>
      </div>

      {results.length === 0 ? (
        <div className="bg-basalt-50 rounded-card p-12 text-center">
          <p className="text-cream/50">No results found for &quot;{searchQuery}&quot;</p>
        </div>
      ) : (
        <div className="space-y-6">
          {results.map(({ room, decisions }) => (
            <div key={room.id} className="bg-basalt-50 rounded-card p-4">
              <h3 className="text-lg text-sandstone mb-3 font-medium">{room.name}</h3>
              <div className="space-y-2">
                {decisions.map((decision) => {
                  const selectedOption = decision.options.find((opt) => opt.isSelected)

                  return (
                    <div
                      key={decision.id}
                      onClick={() => onSelectDecision(room.id, decision.id)}
                      className="bg-basalt rounded-card p-3 cursor-pointer hover:bg-basalt/80 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-cream font-medium">{decision.title}</span>
                        <Badge variant={STATUS_CONFIG_V3[decision.status].variant}>
                          {STATUS_CONFIG_V3[decision.status].label}
                        </Badge>
                      </div>
                      {decision.notes && (
                        <div className="text-sm text-cream/60 mt-1 line-clamp-2">
                          {decision.notes}
                        </div>
                      )}
                      {selectedOption && (
                        <div className="text-sm text-sandstone/70 mt-1">
                          → {selectedOption.name}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// ROOM DETAIL VIEW
// ============================================================================

function RoomDetailView({
  room,
  onBack,
  onUpdateRoom,
  onDeleteRoom,
  expandedDecisionId,
  setExpandedDecisionId,
}: {
  room: RoomV3
  onBack: () => void
  onUpdateRoom: (updates: Partial<RoomV3>) => void
  onDeleteRoom: () => void
  expandedDecisionId: string | null
  setExpandedDecisionId: (id: string | null) => void
}) {
  const [newDecisionTitle, setNewDecisionTitle] = useState('')
  const [sortColumn, setSortColumn] = useState<'title' | 'status' | 'notes' | 'options'>('title')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Handle column header click for sorting
  const handleSort = (column: 'title' | 'status' | 'notes' | 'options') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  // Sort decisions based on current sort column and direction
  const sortedDecisions = useMemo(() => {
    const sorted = [...room.decisions].sort((a, b) => {
      let comparison = 0

      switch (sortColumn) {
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        case 'notes':
          comparison = (a.notes || '').localeCompare(b.notes || '')
          break
        case 'options':
          comparison = a.options.length - b.options.length
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return sorted
  }, [room.decisions, sortColumn, sortDirection])

  const handleAddDecision = () => {
    if (!newDecisionTitle.trim()) return

    const newDecision: DecisionV3 = {
      id: crypto.randomUUID(),
      title: newDecisionTitle.trim(),
      status: 'deciding',
      notes: '',
      options: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    onUpdateRoom({
      decisions: [...room.decisions, newDecision],
      updatedAt: new Date().toISOString(),
    })

    setNewDecisionTitle('')
    setExpandedDecisionId(newDecision.id)
  }

  const updateDecision = (decisionId: string, updates: Partial<DecisionV3>) => {
    onUpdateRoom({
      decisions: room.decisions.map((d) =>
        d.id === decisionId
          ? { ...d, ...updates, updatedAt: new Date().toISOString() }
          : d
      ),
      updatedAt: new Date().toISOString(),
    })
  }

  const deleteDecision = (decisionId: string) => {
    onUpdateRoom({
      decisions: room.decisions.filter((d) => d.id !== decisionId),
      updatedAt: new Date().toISOString(),
    })
    setExpandedDecisionId(null)
  }

  const addOption = (decisionId: string) => {
    updateDecision(decisionId, {
      options: [
        ...room.decisions.find((d) => d.id === decisionId)!.options,
        {
          id: crypto.randomUUID(),
          name: '',
          notes: '',
          urls: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    })
  }

  const updateOption = (
    decisionId: string,
    optionId: string,
    updates: Partial<OptionV3>
  ) => {
    const decision = room.decisions.find((d) => d.id === decisionId)!
    updateDecision(decisionId, {
      options: decision.options.map((opt) =>
        opt.id === optionId
          ? { ...opt, ...updates, updatedAt: new Date().toISOString() }
          : opt
      ),
    })
  }

  const deleteOption = (decisionId: string, optionId: string) => {
    const decision = room.decisions.find((d) => d.id === decisionId)!
    updateDecision(decisionId, {
      options: decision.options.filter((opt) => opt.id !== optionId),
    })
  }

  const stats = {
    deciding: room.decisions.filter(
      (d) => d.status === 'deciding' || d.status === 'shortlist'
    ).length,
    selected: room.decisions.filter((d) => d.status === 'selected').length,
    ordered: room.decisions.filter((d) => d.status === 'ordered').length,
    done: room.decisions.filter((d) => d.status === 'done').length,
  }

  return (
    <>
      <div className="mb-6">
        <button
          onClick={onBack}
          className="text-sandstone hover:text-sandstone-light text-sm mb-4"
        >
          ← Rooms
        </button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl md:text-5xl text-sandstone mb-2">
              {room.name}
            </h1>
            <div className="flex items-center gap-3 text-sm text-cream/60">
              <Badge variant="default">
                {ROOM_TYPE_OPTIONS_V3.find((t) => t.value === room.type)?.label}
              </Badge>
              <span>
                {room.decisions.length} decision{room.decisions.length !== 1 ? 's' : ''}
              </span>
              {stats.selected > 0 && <span>· {stats.selected} selected</span>}
              {stats.ordered > 0 && <span>· {stats.ordered} ordered</span>}
            </div>
          </div>
          <ShareButton title={`${room.name} — Finish Decisions`} />
        </div>
      </div>

      {/* Decisions Table */}
      <div className="bg-basalt-50 rounded-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-cream/10">
              <th
                onClick={() => handleSort('title')}
                className="text-left px-4 py-3 text-sm font-medium text-cream/70 cursor-pointer hover:text-cream transition-colors"
              >
                <div className="flex items-center gap-1">
                  Decision
                  {sortColumn === 'title' && (
                    <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('status')}
                className="text-left px-4 py-3 text-sm font-medium text-cream/70 cursor-pointer hover:text-cream transition-colors"
              >
                <div className="flex items-center gap-1">
                  Status
                  {sortColumn === 'status' && (
                    <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('notes')}
                className="text-left px-4 py-3 text-sm font-medium text-cream/70 cursor-pointer hover:text-cream transition-colors"
              >
                <div className="flex items-center gap-1">
                  Notes
                  {sortColumn === 'notes' && (
                    <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('options')}
                className="text-center px-4 py-3 text-sm font-medium text-cream/70 cursor-pointer hover:text-cream transition-colors"
              >
                <div className="flex items-center justify-center gap-1">
                  Options
                  {sortColumn === 'options' && (
                    <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="text-right px-4 py-3 text-sm font-medium text-cream/70"></th>
            </tr>
          </thead>
          <tbody>
            {/* Quick Add Decision Row - Top */}
            <tr className="border-b border-cream/10 bg-basalt/30">
              <td colSpan={5} className="px-4 py-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add decision (e.g., Countertop)"
                    value={newDecisionTitle}
                    onChange={(e) => setNewDecisionTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddDecision()
                    }}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleAddDecision}>
                    Add
                  </Button>
                </div>
              </td>
            </tr>

            {/* Decision Rows */}
            {room.decisions.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-cream/50">
                  No decisions yet. Add your first decision above!
                </td>
              </tr>
            ) : (
              sortedDecisions.map((decision) => (
                <DecisionRow
                  key={decision.id}
                  decision={decision}
                  isExpanded={expandedDecisionId === decision.id}
                  onToggle={() =>
                    setExpandedDecisionId(expandedDecisionId === decision.id ? null : decision.id)
                  }
                  onUpdateDecision={(updates) => updateDecision(decision.id, updates)}
                  onDeleteDecision={() => {
                    if (confirm(`Delete "${decision.title}"? This will also delete all options.`)) {
                      deleteDecision(decision.id)
                    }
                  }}
                  onAddOption={() => addOption(decision.id)}
                  onUpdateOption={(optionId, updates) =>
                    updateOption(decision.id, optionId, updates)
                  }
                  onDeleteOption={(optionId) => {
                    if (confirm('Delete this option?')) {
                      deleteOption(decision.id, optionId)
                    }
                  }}
                />
              ))
            )}

            {/* Quick Add Decision Row - Bottom */}
            {room.decisions.length > 0 && (
              <tr className="border-t border-cream/10 bg-basalt/30">
                <td colSpan={5} className="px-4 py-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add decision (e.g., Countertop)"
                      value={newDecisionTitle}
                      onChange={(e) => setNewDecisionTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddDecision()
                      }}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={handleAddDecision}>
                      Add
                    </Button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}

// ============================================================================
// DECISION ROW
// ============================================================================

function DecisionRow({
  decision,
  isExpanded,
  onToggle,
  onUpdateDecision,
  onDeleteDecision,
  onAddOption,
  onUpdateOption,
  onDeleteOption,
}: {
  decision: DecisionV3
  isExpanded: boolean
  onToggle: () => void
  onUpdateDecision: (updates: Partial<DecisionV3>) => void
  onDeleteDecision: () => void
  onAddOption: () => void
  onUpdateOption: (optionId: string, updates: Partial<OptionV3>) => void
  onDeleteOption: (optionId: string) => void
}) {
  const selectedOption = decision.options.find((opt) => opt.isSelected)

  return (
    <>
      {/* Main Table Row */}
      <tr
        className="border-b border-cream/10 hover:bg-basalt-50/50 transition-colors cursor-pointer"
        onClick={onToggle}
      >
        <td className="px-4 py-3">
          <div className="text-cream font-medium">{decision.title}</div>
          {selectedOption && (
            <div className="text-xs text-sandstone/70 mt-0.5">→ {selectedOption.name}</div>
          )}
        </td>
        <td className="px-4 py-3">
          <Badge variant={STATUS_CONFIG_V3[decision.status].variant}>
            {STATUS_CONFIG_V3[decision.status].label}
          </Badge>
        </td>
        <td className="px-4 py-3">
          {decision.notes && (
            <div className="text-sm text-cream/60 line-clamp-2 max-w-md">{decision.notes}</div>
          )}
        </td>
        <td className="px-4 py-3 text-center">
          <span className="text-xs text-cream/40">
            {decision.options.length} option{decision.options.length !== 1 ? 's' : ''}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDeleteDecision()
            }}
            className="text-cream/40 hover:text-red-400 text-xs"
          >
            Delete
          </button>
        </td>
      </tr>

      {/* Expanded Row - Decision Details */}
      {isExpanded && (
        <tr>
          <td colSpan={5} className="px-4 py-4 bg-basalt">
            <div className="space-y-4">
          {/* Decision fields */}
          <div className="pb-4 border-b border-cream/10">
            <h3 className="text-sm font-medium text-cream/70 mb-3">Decision Details</h3>

            <div className="space-y-3">
              <Input
                label="Title"
                value={decision.title}
                onChange={(e) => onUpdateDecision({ title: e.target.value })}
              />

              <Select
                label="Status"
                value={decision.status}
                onChange={(e) => onUpdateDecision({ status: e.target.value as StatusV3 })}
                options={Object.entries(STATUS_CONFIG_V3).map(([key, config]) => ({
                  value: key,
                  label: config.label,
                }))}
              />

              <div>
                <label className="block text-sm text-cream/70 mb-1.5">Notes</label>
                <textarea
                  value={decision.notes}
                  onChange={(e) => onUpdateDecision({ notes: e.target.value })}
                  className="w-full bg-basalt-50 text-cream rounded-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sandstone min-h-[100px]"
                  placeholder="General notes about this decision..."
                />
              </div>
            </div>
          </div>

          {/* Options */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-cream/70">Options to Compare</h3>
              <Button size="sm" variant="secondary" onClick={onAddOption}>
                Add Option
              </Button>
            </div>

            {decision.options.length === 0 ? (
              <p className="text-cream/50 text-sm">
                No options yet. Add an option to start comparing choices.
              </p>
            ) : (
              decision.options.map((option) => (
                <OptionEditor
                  key={option.id}
                  option={option}
                  onUpdate={(updates) => onUpdateOption(option.id, updates)}
                  onDelete={() => onDeleteOption(option.id)}
                />
              ))
            )}
          </div>

              {/* Delete decision */}
              <div className="pt-4 border-t border-cream/10">
                <Button variant="ghost" onClick={onDeleteDecision}>
                  Delete Decision
                </Button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ============================================================================
// OPTION EDITOR
// ============================================================================

function OptionEditor({
  option,
  onUpdate,
  onDelete,
}: {
  option: OptionV3
  onUpdate: (updates: Partial<OptionV3>) => void
  onDelete: () => void
}) {
  const [newUrl, setNewUrl] = useState('')

  const handleAddUrl = () => {
    if (!newUrl.trim()) return

    onUpdate({
      urls: [
        ...option.urls,
        {
          id: crypto.randomUUID(),
          url: newUrl.trim(),
        },
      ],
    })

    setNewUrl('')
  }

  const handleRemoveUrl = (urlId: string) => {
    onUpdate({
      urls: option.urls.filter((u) => u.id !== urlId),
    })
  }

  const isValidUrl = (url: string) => {
    return /^https?:\/\/.+/i.test(url)
  }

  return (
    <div className="bg-basalt-50 rounded-card p-4 mb-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={option.isSelected || false}
            onChange={(e) => onUpdate({ isSelected: e.target.checked })}
            className="accent-sandstone"
          />
          <span className="text-cream font-medium">
            {option.name || 'Unnamed Option'}
          </span>
        </div>
        <button onClick={onDelete} className="text-cream/40 hover:text-red-400 text-xs">
          Delete
        </button>
      </div>

      <div className="space-y-3">
        <Input
          label="Option Name"
          placeholder="e.g., Quartz Calacatta Gold"
          value={option.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
        />

        {/* URLs Section */}
        <div>
          <label className="block text-sm text-cream/70 mb-2">URLs</label>
          {option.urls.length > 0 && (
            <div className="space-y-2 mb-3">
              {option.urls.map((url) => (
                <div key={url.id} className="flex items-center gap-2 bg-basalt p-2 rounded">
                  <a
                    href={url.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sandstone hover:text-sandstone-light text-sm flex-1 truncate"
                  >
                    {url.url}
                  </a>
                  <button
                    onClick={() => handleRemoveUrl(url.id)}
                    className="text-cream/40 hover:text-cream/70 text-xs shrink-0"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              placeholder="URL"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="flex-1"
            />
            <Button size="sm" variant="secondary" onClick={handleAddUrl}>
              Add
            </Button>
          </div>
          {newUrl && !isValidUrl(newUrl) && (
            <p className="text-yellow-500 text-xs mt-1">
              URL should start with http:// or https://
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm text-cream/70 mb-1.5">Notes</label>
          <textarea
            value={option.notes}
            onChange={(e) => onUpdate({ notes: e.target.value })}
            className="w-full bg-basalt text-cream rounded-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sandstone min-h-[100px]"
            placeholder="Specs, notes, details about this option..."
          />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ToolContent() {
  const { state, setState, isLoaded, isSyncing } = useToolState<
    FinishDecisionsPayloadV3 | any
  >({
    toolKey: 'finish_decisions',
    localStorageKey: 'hhc_finish_decisions_v2', // Keep same key for migration
    defaultValue: { version: 3, rooms: [] },
  })

  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedDecisionId, setExpandedDecisionId] = useState<string | null>(null)

  // Auto-migrate on load
  useEffect(() => {
    if (isLoaded && state.version !== 3) {
      console.log('Auto-migrating to V3...')
      const migrated = migrateToV3(state)
      setState(() => migrated)
    }
  }, [isLoaded, state, setState])

  // Ensure we're working with V3 data
  const v3State =
    state.version === 3
      ? (state as FinishDecisionsPayloadV3)
      : { version: 3 as const, rooms: [] }

  const currentRoom = currentRoomId ? v3State.rooms.find((r) => r.id === currentRoomId) : null

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

    // Navigate into the new room
    setCurrentRoomId(room.id)
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
    setState((prev) => ({
      ...prev,
      rooms: (prev as FinishDecisionsPayloadV3).rooms.filter((r) => r.id !== roomId),
    }))
    setCurrentRoomId(null)
    setSearchQuery('')
  }

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Global Search Bar */}
        {isLoaded && state.version === 3 && (
          <div className="mb-6">
            <Input
              placeholder="Search all decisions and rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}

        {isLoaded && state.version === 3 ? (
          searchQuery ? (
            <SearchResultsView
              rooms={v3State.rooms}
              searchQuery={searchQuery}
              onClearSearch={() => setSearchQuery('')}
              onSelectDecision={(roomId, decisionId) => {
                setCurrentRoomId(roomId)
                setExpandedDecisionId(decisionId)
                setSearchQuery('')
              }}
            />
          ) : currentRoom ? (
            <RoomDetailView
              room={currentRoom}
              onBack={() => {
                setCurrentRoomId(null)
                setSearchQuery('')
              }}
              onUpdateRoom={(updates) => handleUpdateRoom(currentRoom.id, updates)}
              onDeleteRoom={() => {
                if (
                  confirm(
                    `Delete ${currentRoom.name}? This will also delete all decisions and options.`
                  )
                ) {
                  handleDeleteRoom(currentRoom.id)
                }
              }}
              expandedDecisionId={expandedDecisionId}
              setExpandedDecisionId={setExpandedDecisionId}
            />
          ) : (
            <RoomsListView
              rooms={v3State.rooms}
              onAddRoom={handleAddRoom}
              onSelectRoom={setCurrentRoomId}
              onDeleteRoom={(roomId) => {
                const room = v3State.rooms.find((r) => r.id === roomId)
                if (
                  room &&
                  confirm(
                    `Delete ${room.name}? This will also delete all decisions and options in this room.`
                  )
                ) {
                  handleDeleteRoom(roomId)
                }
              }}
            />
          )
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
