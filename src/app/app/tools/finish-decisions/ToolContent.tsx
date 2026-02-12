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
      const options: OptionV3[] = categoryItems.map((item) => ({
        id: crypto.randomUUID(),
        name: item.name,
        specs: item.specs || '',
        notes: item.where
          ? `${item.notes}\n\nWhere: ${item.where}`.trim()
          : item.notes || '',
        urls: item.links.map((link) => ({
          id: link.id,
          label: link.label || '',
          url: link.url,
        })),
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
      }))

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
        specs: '',
        notes: '',
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
        // Combine notes, where, cost
        let combinedNotes = option.notes || ''
        if (option.where) {
          combinedNotes = combinedNotes
            ? `${combinedNotes}\n\nWhere: ${option.where}`
            : `Where: ${option.where}`
        }
        if (option.estimatedCost) {
          combinedNotes = combinedNotes
            ? `${combinedNotes}\nCost: ${option.estimatedCost}`
            : `Cost: ${option.estimatedCost}`
        }

        return {
          id: option.id,
          name: option.name,
          specs: option.specs || '',
          notes: combinedNotes.trim(),
          urls: option.links.map((link) => ({
            id: link.id,
            label: link.label || '',
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
        specs: '', // V2 didn't have decision-level specs
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
// ADD ROOM MODAL
// ============================================================================

function AddRoomModal({
  onClose,
  onAdd,
}: {
  onClose: () => void
  onAdd: (type: RoomTypeV3, name: string, useDefaults: boolean) => void
}) {
  const [roomType, setRoomType] = useState<RoomTypeV3>('kitchen')
  const [roomName, setRoomName] = useState('')
  const [useDefaults, setUseDefaults] = useState(true)
  const [error, setError] = useState('')

  // Auto-fill name based on type
  useEffect(() => {
    if (!roomName) {
      const label = ROOM_TYPE_OPTIONS_V3.find((opt) => opt.value === roomType)?.label
      setRoomName(label || '')
    }
  }, [roomType, roomName])

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
        <AddRoomModal onClose={() => setShowAddModal(false)} onAdd={onAddRoom} />
      )}
    </>
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
  searchQuery,
  onSearchChange,
}: {
  room: RoomV3
  onBack: () => void
  onUpdateRoom: (updates: Partial<RoomV3>) => void
  onDeleteRoom: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
}) {
  const [expandedDecisionId, setExpandedDecisionId] = useState<string | null>(null)
  const [newDecisionTitle, setNewDecisionTitle] = useState('')

  // Filter decisions by search
  const filteredDecisions = useMemo(() => {
    if (!searchQuery) return room.decisions

    const query = searchQuery.toLowerCase()
    return room.decisions.filter((decision) => {
      const searchable = [
        decision.title,
        decision.specs,
        decision.notes,
        ...decision.options.flatMap((opt) => [
          opt.name,
          opt.specs,
          opt.notes,
          ...opt.urls.map((u) => u.url),
        ]),
      ]
        .join(' ')
        .toLowerCase()

      return searchable.includes(query)
    })
  }, [room.decisions, searchQuery])

  const handleAddDecision = () => {
    if (!newDecisionTitle.trim()) return

    const newDecision: DecisionV3 = {
      id: crypto.randomUUID(),
      title: newDecisionTitle.trim(),
      status: 'deciding',
      specs: '',
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
          specs: '',
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

      <div className="bg-basalt-50 rounded-card p-4 mb-6">
        <Input
          placeholder="Search this room..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="bg-basalt-50 rounded-card p-4 mb-6">
        <h2 className="text-sm font-medium text-cream/70 mb-3">Quick Add Decision</h2>
        <div className="flex gap-2">
          <Input
            placeholder="New decision title (e.g., Countertop)"
            value={newDecisionTitle}
            onChange={(e) => setNewDecisionTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddDecision()
            }}
          />
          <Button onClick={handleAddDecision}>Add</Button>
        </div>
      </div>

      {filteredDecisions.length === 0 ? (
        <div className="text-center py-12 text-cream/50">
          {room.decisions.length === 0 ? (
            <p>No decisions yet. Add your first decision above!</p>
          ) : (
            <p>No decisions match your search.</p>
          )}
        </div>
      ) : (
        <div className="bg-basalt-50 rounded-card">
          {filteredDecisions.map((decision) => (
            <DecisionCard
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
          ))}
        </div>
      )}
    </>
  )
}

// ============================================================================
// DECISION CARD
// ============================================================================

function DecisionCard({
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
    <div className="border-b border-cream/10 last:border-0">
      <div
        onClick={onToggle}
        className="py-3 px-4 cursor-pointer hover:bg-basalt-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-cream font-medium flex-1">{decision.title}</span>
          <Badge variant={STATUS_CONFIG_V3[decision.status].variant}>
            {STATUS_CONFIG_V3[decision.status].label}
          </Badge>
          <span className="text-xs text-cream/40">
            {decision.options.length} option{decision.options.length !== 1 ? 's' : ''}
          </span>
        </div>
        {selectedOption && (
          <div className="text-sm text-sandstone/70 mt-1">→ {selectedOption.name}</div>
        )}
      </div>

      {isExpanded && (
        <div className="bg-basalt p-6 mb-4 mx-4 rounded-card space-y-4">
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
                <label className="block text-sm text-cream/70 mb-1.5">Specs</label>
                <textarea
                  value={decision.specs}
                  onChange={(e) => onUpdateDecision({ specs: e.target.value })}
                  className="w-full bg-basalt-50 text-cream rounded-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sandstone min-h-[80px]"
                  placeholder="Decision-level specifications..."
                />
              </div>

              <div>
                <label className="block text-sm text-cream/70 mb-1.5">Notes</label>
                <textarea
                  value={decision.notes}
                  onChange={(e) => onUpdateDecision({ notes: e.target.value })}
                  className="w-full bg-basalt-50 text-cream rounded-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sandstone min-h-[60px]"
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
      )}
    </div>
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
  const [newLabel, setNewLabel] = useState('')

  const handleAddUrl = () => {
    if (!newUrl.trim()) return

    onUpdate({
      urls: [
        ...option.urls,
        {
          id: crypto.randomUUID(),
          url: newUrl.trim(),
          label: newLabel.trim(),
        },
      ],
    })

    setNewUrl('')
    setNewLabel('')
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

        {/* URLs Section - URL first, bigger */}
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
                    {url.label || url.url}
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
            <div className="flex-[7]">
              <Input placeholder="URL (required)" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} />
            </div>
            <div className="flex-[3]">
              <Input
                placeholder="Label (optional)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Button size="sm" variant="secondary" onClick={handleAddUrl}>
              Add URL
            </Button>
            {newUrl && !isValidUrl(newUrl) && (
              <p className="text-yellow-500 text-xs">
                URL should start with http:// or https://
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm text-cream/70 mb-1.5">Specs</label>
          <textarea
            value={option.specs}
            onChange={(e) => onUpdate({ specs: e.target.value })}
            className="w-full bg-basalt text-cream rounded-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sandstone min-h-[80px]"
            placeholder="Detailed specifications..."
          />
        </div>

        <div>
          <label className="block text-sm text-cream/70 mb-1.5">Notes</label>
          <textarea
            value={option.notes}
            onChange={(e) => onUpdate({ notes: e.target.value })}
            className="w-full bg-basalt text-cream rounded-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sandstone min-h-[60px]"
            placeholder="Notes specific to this option..."
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
            specs: '',
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
        {isLoaded && state.version === 3 ? (
          currentRoom ? (
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
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
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
