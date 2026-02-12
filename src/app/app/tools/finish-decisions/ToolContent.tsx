'use client'

import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { ShareButton } from '@/components/resources/ShareButton'
import { useToolState } from '@/hooks/useToolState'
import {
  ROOM_TYPES,
  STATUS_CONFIG,
  NEEDED_BY_OPTIONS,
  DEFAULT_STARTER_PACKS,
  type Room,
  type Decision,
  type DecisionOption,
  type DecisionStatus,
  type NeededByStage,
  type RoomTypeId,
  type FinishDecisionsPayload,
  type V1FinishDecisionsPayload,
  type V1DecisionItem,
} from '@/data/finish-decisions'

// ============================================================================
// MIGRATION LOGIC
// ============================================================================

function migrateV1toV2(v1: V1FinishDecisionsPayload): FinishDecisionsPayload {
  const rooms: Room[] = []
  const decisions: Decision[] = []
  const options: DecisionOption[] = []

  // Group v1 items by room name
  const roomMap = new Map<string, Room>()

  v1.items.forEach((item) => {
    const roomName = item.room || 'Other'

    // Create room if not exists
    if (!roomMap.has(roomName)) {
      const room: Room = {
        id: crypto.randomUUID(),
        name: roomName,
        type: 'other', // Default to 'other' since v1 didn't have types
        createdAt: item.createdAt || new Date().toISOString(),
      }
      roomMap.set(roomName, room)
      rooms.push(room)
    }

    const room = roomMap.get(roomName)!

    // Create decision
    const decision: Decision = {
      id: crypto.randomUUID(),
      roomId: room.id,
      category: item.category,
      neededBy: item.neededBy,
      status: mapV1StatusToV2(item.status),
      selectedOptionId: null, // Will set after creating option
      notes: item.notes,
      isFromStarterPack: false,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString(),
    }

    // Create option from v1 item data
    const option: DecisionOption = {
      id: crypto.randomUUID(),
      decisionId: decision.id,
      name: item.name,
      specs: item.specs,
      where: item.where,
      estimatedCost: '',
      links: item.links.map((link) => ({
        id: link.id,
        url: link.url,
        label: link.label,
      })),
      notes: '',
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString(),
    }

    // Mark this option as selected
    decision.selectedOptionId = option.id

    decisions.push(decision)
    options.push(option)
  })

  return {
    version: 2,
    rooms,
    decisions,
    options,
  }
}

function mapV1StatusToV2(v1Status: string): DecisionStatus {
  const mapping: Record<string, DecisionStatus> = {
    deciding: 'exploring',
    awaiting_approval: 'comparing',
    final: 'decided',
    complete: 'complete',
  }
  return mapping[v1Status] || 'exploring'
}

// ============================================================================
// ROOM MANAGER
// ============================================================================

function RoomManager({
  rooms,
  onAddRoom,
  onDeleteRoom,
}: {
  rooms: Room[]
  onAddRoom: (name: string, type: RoomTypeId, packId: string) => void
  onDeleteRoom: (roomId: string) => void
}) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [roomType, setRoomType] = useState<RoomTypeId>('kitchen')
  const [selectedPack, setSelectedPack] = useState('')
  const [error, setError] = useState('')

  // Get packs for selected room type
  const availablePacks = useMemo(() => {
    return DEFAULT_STARTER_PACKS.filter((pack) => pack.roomType === roomType)
  }, [roomType])

  // Set default pack when room type changes
  useEffect(() => {
    if (availablePacks.length > 0) {
      setSelectedPack(availablePacks[0].id)
    }
  }, [availablePacks])

  const handleAdd = () => {
    if (!roomName.trim()) {
      setError('Room name is required')
      return
    }

    onAddRoom(roomName.trim(), roomType, selectedPack)
    setRoomName('')
    setRoomType('kitchen')
    setError('')
    setShowAddModal(false)
  }

  return (
    <div className="bg-basalt-50 rounded-card p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-cream/70">Rooms</h2>
        <Button size="sm" variant="secondary" onClick={() => setShowAddModal(true)}>
          Add Room
        </Button>
      </div>

      {rooms.length === 0 ? (
        <p className="text-cream/50 text-sm">No rooms yet. Add a room to get started.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-basalt rounded-card p-3 flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <div className="text-cream font-medium truncate">{room.name}</div>
                <div className="text-xs text-cream/50">
                  {ROOM_TYPES.find((t) => t.id === room.type)?.label}
                </div>
              </div>
              <button
                onClick={() => onDeleteRoom(room.id)}
                className="text-cream/40 hover:text-red-400 text-xs ml-2 shrink-0"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-basalt/80 flex items-center justify-center z-50 p-4">
          <div className="bg-basalt-50 rounded-card p-6 max-w-md w-full space-y-4">
            <h3 className="text-xl font-serif text-sandstone">Add Room</h3>

            <Input
              label="Room Name"
              placeholder="e.g., Main Kitchen, Guest Bath 2"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              error={error}
            />

            <Select
              label="Room Type"
              value={roomType}
              onChange={(e) => setRoomType(e.target.value as RoomTypeId)}
              options={ROOM_TYPES.map((t) => ({ value: t.id, label: t.label }))}
            />

            {availablePacks.length > 0 && (
              <Select
                label="Starter Pack"
                value={selectedPack}
                onChange={(e) => setSelectedPack(e.target.value)}
                options={availablePacks.map((pack) => ({
                  value: pack.id,
                  label: pack.name + (pack.isPremium ? ` ($${pack.price})` : ''),
                }))}
              />
            )}

            <div className="flex gap-2 pt-2">
              <Button onClick={handleAdd}>Add Room</Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowAddModal(false)
                  setError('')
                }}
              >
                Cancel
              </Button>
            </div>
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
  isSelected,
  onUpdate,
  onDelete,
  onSelect,
}: {
  option: DecisionOption
  isSelected: boolean
  onUpdate: (updates: Partial<DecisionOption>) => void
  onDelete: () => void
  onSelect: () => void
}) {
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [newLinkLabel, setNewLinkLabel] = useState('')

  const handleAddLink = () => {
    if (!newLinkUrl.trim()) return

    const newLink = {
      id: crypto.randomUUID(),
      url: newLinkUrl.trim(),
      label: newLinkLabel.trim(),
    }

    onUpdate({ links: [...option.links, newLink] })
    setNewLinkUrl('')
    setNewLinkLabel('')
  }

  const handleRemoveLink = (linkId: string) => {
    onUpdate({ links: option.links.filter((l) => l.id !== linkId) })
  }

  const isValidUrl = (url: string) => {
    return /^https?:\/\/.+/i.test(url)
  }

  return (
    <div className="bg-basalt-50 rounded-card p-4 mb-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <input
            type="radio"
            checked={isSelected}
            onChange={onSelect}
            className="accent-sandstone"
          />
          <span className="text-cream font-medium">{option.name || 'Unnamed Option'}</span>
        </div>
        <button
          onClick={onDelete}
          className="text-cream/40 hover:text-red-400 text-xs"
        >
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

        {/* Links Section - URL first, bigger */}
        <div>
          <label className="block text-sm text-cream/70 mb-2">Links</label>
          {option.links.length > 0 && (
            <div className="space-y-2 mb-3">
              {option.links.map((link) => (
                <div key={link.id} className="flex items-center gap-2 bg-basalt p-2 rounded">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sandstone hover:text-sandstone-light text-sm flex-1 truncate"
                  >
                    {link.label || link.url}
                  </a>
                  <button
                    onClick={() => handleRemoveLink(link.id)}
                    className="text-cream/40 hover:text-cream/70 text-xs"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <div className="flex-[7]">
              <Input
                placeholder="URL (required)"
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
              />
            </div>
            <div className="flex-[3]">
              <Input
                placeholder="Label (optional)"
                value={newLinkLabel}
                onChange={(e) => setNewLinkLabel(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Button size="sm" variant="secondary" onClick={handleAddLink}>
              Add Link
            </Button>
            {newLinkUrl && !isValidUrl(newLinkUrl) && (
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Where (vendor/store)"
            placeholder="e.g., Stone Depot Hawaii"
            value={option.where}
            onChange={(e) => onUpdate({ where: e.target.value })}
          />
          <Input
            label="Estimated Cost"
            placeholder="e.g., $85/sf installed"
            value={option.estimatedCost}
            onChange={(e) => onUpdate({ estimatedCost: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm text-cream/70 mb-1.5">Option Notes</label>
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
// DECISION CARD
// ============================================================================

function DecisionCard({
  decision,
  room,
  options,
  isExpanded,
  onToggle,
  onUpdateDecision,
  onUpdateOption,
  onDeleteDecision,
  onDeleteOption,
  onAddOption,
  onSelectOption,
}: {
  decision: Decision
  room: Room
  options: DecisionOption[]
  isExpanded: boolean
  onToggle: () => void
  onUpdateDecision: (updates: Partial<Decision>) => void
  onUpdateOption: (optionId: string, updates: Partial<DecisionOption>) => void
  onDeleteDecision: () => void
  onDeleteOption: (optionId: string) => void
  onAddOption: () => void
  onSelectOption: (optionId: string) => void
}) {
  const selectedOption = options.find((opt) => opt.id === decision.selectedOptionId)

  return (
    <div className="border-b border-cream/10 last:border-0">
      <div
        onClick={onToggle}
        className="py-3 px-4 cursor-pointer hover:bg-basalt-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs text-cream/50 bg-basalt/50 px-2 py-1 rounded">
            {room.name}
          </span>
          <span className="text-cream font-medium flex-1">{decision.category}</span>
          <Badge variant={STATUS_CONFIG[decision.status].variant}>
            {STATUS_CONFIG[decision.status].label}
          </Badge>
          <span className="text-xs text-cream/40">
            {options.length} option{options.length !== 1 ? 's' : ''}
          </span>
        </div>
        {selectedOption && (
          <div className="text-sm text-sandstone/70 mt-1 ml-2">
            → {selectedOption.name}
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="bg-basalt-50 p-6 mb-4 mx-4 rounded-card space-y-4">
          {/* Decision-level fields */}
          <div className="pb-4 border-b border-cream/10">
            <h3 className="text-sm font-medium text-cream/70 mb-3">Decision Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Category"
                value={decision.category}
                onChange={(e) => onUpdateDecision({ category: e.target.value })}
              />
              <Select
                label="Status"
                value={decision.status}
                onChange={(e) =>
                  onUpdateDecision({ status: e.target.value as DecisionStatus })
                }
                options={Object.entries(STATUS_CONFIG).map(([key, config]) => ({
                  value: key,
                  label: config.label,
                }))}
              />
            </div>
            <div className="mt-3">
              <Select
                label="Needed By Stage"
                value={decision.neededBy || ''}
                onChange={(e) =>
                  onUpdateDecision({
                    neededBy: (e.target.value as NeededByStage) || null,
                  })
                }
                options={[
                  { value: '', label: '-- Not set --' },
                  ...NEEDED_BY_OPTIONS.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                  })),
                ]}
              />
            </div>
            <div className="mt-3">
              <label className="block text-sm text-cream/70 mb-1.5">Decision Notes</label>
              <textarea
                value={decision.notes}
                onChange={(e) => onUpdateDecision({ notes: e.target.value })}
                className="w-full bg-basalt text-cream rounded-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sandstone min-h-[60px]"
                placeholder="General notes about this decision..."
              />
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

            {options.length === 0 ? (
              <p className="text-cream/50 text-sm">No options yet. Add an option to get started.</p>
            ) : (
              options.map((option) => (
                <OptionEditor
                  key={option.id}
                  option={option}
                  isSelected={decision.selectedOptionId === option.id}
                  onUpdate={(updates) => onUpdateOption(option.id, updates)}
                  onDelete={() => onDeleteOption(option.id)}
                  onSelect={() => onSelectOption(option.id)}
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
// QUICK ADD DECISION
// ============================================================================

function QuickAddDecision({
  rooms,
  onAdd,
}: {
  rooms: Room[]
  onAdd: (roomId: string, category: string) => void
}) {
  const [roomId, setRoomId] = useState('')
  const [category, setCategory] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (rooms.length > 0 && !roomId) {
      setRoomId(rooms[0].id)
    }
  }, [rooms, roomId])

  const handleAdd = () => {
    if (!roomId) {
      setError('Room is required')
      return
    }
    if (!category.trim()) {
      setError('Category is required')
      return
    }

    onAdd(roomId, category.trim())
    setCategory('')
    setError('')
  }

  if (rooms.length === 0) {
    return (
      <div className="bg-basalt-50 rounded-card p-4 mb-6">
        <p className="text-cream/50 text-sm">Add a room first to start tracking decisions.</p>
      </div>
    )
  }

  return (
    <div className="bg-basalt-50 rounded-card p-4 mb-6">
      <h2 className="text-sm font-medium text-cream/70 mb-3">Quick Add Decision</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Select
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          options={rooms.map((r) => ({ value: r.id, label: r.name }))}
        />
        <Input
          placeholder="Category (e.g., Countertop)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <Button onClick={handleAdd}>Add Decision</Button>
      </div>
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
    </div>
  )
}

// ============================================================================
// FILTERS
// ============================================================================

function Filters({
  rooms,
  searchQuery,
  onSearchChange,
  filterRoom,
  onRoomChange,
  filterStatus,
  onStatusChange,
}: {
  rooms: Room[]
  searchQuery: string
  onSearchChange: (value: string) => void
  filterRoom: string
  onRoomChange: (value: string) => void
  filterStatus: DecisionStatus | 'all'
  onStatusChange: (value: DecisionStatus | 'all') => void
}) {
  return (
    <div className="bg-basalt-50 rounded-card p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Input
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <Select
          value={filterRoom}
          onChange={(e) => onRoomChange(e.target.value)}
          options={[
            { value: 'all', label: 'All Rooms' },
            ...rooms.map((r) => ({ value: r.id, label: r.name })),
          ]}
        />
        <Select
          value={filterStatus}
          onChange={(e) => onStatusChange(e.target.value as DecisionStatus | 'all')}
          options={[
            { value: 'all', label: 'All Statuses' },
            ...Object.entries(STATUS_CONFIG).map(([key, config]) => ({
              value: key,
              label: config.label,
            })),
          ]}
        />
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ToolContent() {
  const { state, setState, isLoaded, isSyncing } = useToolState<
    FinishDecisionsPayload | V1FinishDecisionsPayload
  >({
    toolKey: 'finish_decisions',
    localStorageKey: 'hhc_finish_decisions_v2',
    defaultValue: { version: 2, rooms: [], decisions: [], options: [] },
  })

  const [expandedDecisionId, setExpandedDecisionId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRoom, setFilterRoom] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<DecisionStatus | 'all'>('all')

  // Auto-migrate v1 to v2
  useEffect(() => {
    if (isLoaded && state.version === 1) {
      console.log('Migrating v1 to v2...')
      const migrated = migrateV1toV2(state as V1FinishDecisionsPayload)
      setState(() => migrated)
    }
  }, [isLoaded, state, setState])

  // Ensure we're working with v2 data
  const v2State = (state.version === 2 ? state : { version: 2, rooms: [], decisions: [], options: [] }) as FinishDecisionsPayload

  // Add room with starter pack
  const handleAddRoom = (name: string, type: RoomTypeId, packId: string) => {
    const room: Room = {
      id: crypto.randomUUID(),
      name,
      type,
      createdAt: new Date().toISOString(),
    }

    const pack = DEFAULT_STARTER_PACKS.find((p) => p.id === packId)
    const newDecisions: Decision[] = pack
      ? pack.categories.map((cat) => ({
          id: crypto.randomUUID(),
          roomId: room.id,
          category: cat.name,
          neededBy: cat.neededBy,
          status: 'exploring' as DecisionStatus,
          selectedOptionId: null,
          notes: '',
          isFromStarterPack: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }))
      : []

    setState((prev) => {
      const p = prev as FinishDecisionsPayload
      return {
        ...p,
        rooms: [...p.rooms, room],
        decisions: [...p.decisions, ...newDecisions],
      }
    })
  }

  // Delete room (and all its decisions/options)
  const handleDeleteRoom = (roomId: string) => {
    setState((prev) => {
      const p = prev as FinishDecisionsPayload
      const decisionIds = p.decisions.filter((d) => d.roomId === roomId).map((d) => d.id)
      return {
        ...p,
        rooms: p.rooms.filter((r) => r.id !== roomId),
        decisions: p.decisions.filter((d) => d.roomId !== roomId),
        options: p.options.filter((o) => !decisionIds.includes(o.decisionId)),
      }
    })
  }

  // Add decision
  const handleAddDecision = (roomId: string, category: string) => {
    const decision: Decision = {
      id: crypto.randomUUID(),
      roomId,
      category,
      neededBy: null,
      status: 'exploring',
      selectedOptionId: null,
      notes: '',
      isFromStarterPack: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setState((prev) => {
      const p = prev as FinishDecisionsPayload
      return {
        ...p,
        decisions: [...p.decisions, decision],
      }
    })
    setExpandedDecisionId(decision.id)
  }

  // Update decision
  const updateDecision = (decisionId: string, updates: Partial<Decision>) => {
    setState((prev) => {
      const p = prev as FinishDecisionsPayload
      return {
        ...p,
        decisions: p.decisions.map((d) =>
          d.id === decisionId
            ? { ...d, ...updates, updatedAt: new Date().toISOString() }
            : d
        ),
      }
    })
  }

  // Delete decision (and its options)
  const deleteDecision = (decisionId: string) => {
    setState((prev) => {
      const p = prev as FinishDecisionsPayload
      return {
        ...p,
        decisions: p.decisions.filter((d) => d.id !== decisionId),
        options: p.options.filter((o) => o.decisionId !== decisionId),
      }
    })
    setExpandedDecisionId(null)
  }

  // Add option
  const addOption = (decisionId: string) => {
    const option: DecisionOption = {
      id: crypto.randomUUID(),
      decisionId,
      name: '',
      specs: '',
      where: '',
      estimatedCost: '',
      links: [],
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setState((prev) => {
      const p = prev as FinishDecisionsPayload
      return {
        ...p,
        options: [...p.options, option],
      }
    })
  }

  // Update option
  const updateOption = (optionId: string, updates: Partial<DecisionOption>) => {
    setState((prev) => {
      const p = prev as FinishDecisionsPayload
      return {
        ...p,
        options: p.options.map((o) =>
          o.id === optionId
            ? { ...o, ...updates, updatedAt: new Date().toISOString() }
            : o
        ),
      }
    })
  }

  // Delete option
  const deleteOption = (optionId: string) => {
    setState((prev) => {
      const p = prev as FinishDecisionsPayload
      // If this option was selected, unselect it
      const affectedDecision = p.decisions.find((d) => d.selectedOptionId === optionId)
      return {
        ...p,
        options: p.options.filter((o) => o.id !== optionId),
        decisions: affectedDecision
          ? p.decisions.map((d) =>
              d.id === affectedDecision.id ? { ...d, selectedOptionId: null } : d
            )
          : p.decisions,
      }
    })
  }

  // Select option
  const selectOption = (decisionId: string, optionId: string) => {
    updateDecision(decisionId, { selectedOptionId: optionId })
  }

  // Filtered decisions
  const filteredDecisions = useMemo(() => {
    return v2State.decisions.filter((decision) => {
      // Room filter
      if (filterRoom !== 'all' && decision.roomId !== filterRoom) return false

      // Status filter
      if (filterStatus !== 'all' && decision.status !== filterStatus) return false

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const decisionOptions = v2State.options.filter((o) => o.decisionId === decision.id)
        const searchable = [
          decision.category,
          decision.notes,
          ...decisionOptions.flatMap((o) => [o.name, o.specs, o.where, o.notes]),
        ]
          .join(' ')
          .toLowerCase()
        if (!searchable.includes(query)) return false
      }

      return true
    })
  }, [v2State.decisions, v2State.options, filterRoom, filterStatus, searchQuery])

  // Summary stats
  const stats = useMemo(() => {
    const exploring = filteredDecisions.filter(
      (d) => d.status === 'exploring' || d.status === 'comparing'
    ).length
    const decided = filteredDecisions.filter((d) => d.status === 'decided').length
    const ordered = filteredDecisions.filter((d) => d.status === 'ordered').length
    const complete = filteredDecisions.filter((d) => d.status === 'complete').length
    return { exploring, decided, ordered, complete }
  }, [filteredDecisions])

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="font-serif text-4xl md:text-5xl text-sandstone">
            Finish Decisions
          </h1>
          <div className="shrink-0 mt-2 flex items-center gap-3">
            {isSyncing && <span className="text-xs text-cream/30">Saving...</span>}
            <ShareButton title="Finish Decisions &mdash; Hawaii Home Central" />
          </div>
        </div>
        <p className="text-cream/70 text-lg mb-8 leading-relaxed">
          Organize decisions by room. Compare multiple options for each choice. Track specs,
          vendors, costs, and links.
        </p>

        {isLoaded && state.version === 2 && (
          <>
            <RoomManager
              rooms={v2State.rooms}
              onAddRoom={handleAddRoom}
              onDeleteRoom={handleDeleteRoom}
            />

            <QuickAddDecision rooms={v2State.rooms} onAdd={handleAddDecision} />

            <Filters
              rooms={v2State.rooms}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filterRoom={filterRoom}
              onRoomChange={setFilterRoom}
              filterStatus={filterStatus}
              onStatusChange={setFilterStatus}
            />

            {/* Stats */}
            <div className="flex items-center gap-6 mb-6 text-sm">
              <span className="text-cream/70">
                Exploring: <span className="text-sandstone font-medium">{stats.exploring}</span>
              </span>
              <span className="text-cream/70">
                Decided: <span className="text-sandstone font-medium">{stats.decided}</span>
              </span>
              <span className="text-cream/70">
                Ordered: <span className="text-sandstone font-medium">{stats.ordered}</span>
              </span>
              <span className="text-cream/70">
                Complete: <span className="text-cream/50 font-medium">{stats.complete}</span>
              </span>
              <span className="text-cream/50 ml-auto">
                Total: {filteredDecisions.length}
              </span>
            </div>

            {/* Decisions List */}
            {filteredDecisions.length === 0 ? (
              <div className="text-center py-12 text-cream/50">
                {v2State.decisions.length === 0 ? (
                  <p>No decisions yet. Add a room and decision to get started!</p>
                ) : (
                  <p>No decisions match your filters.</p>
                )}
              </div>
            ) : (
              <div className="bg-basalt-50 rounded-card">
                {filteredDecisions.map((decision) => {
                  const room = v2State.rooms.find((r) => r.id === decision.roomId)
                  const options = v2State.options.filter((o) => o.decisionId === decision.id)
                  if (!room) return null

                  return (
                    <DecisionCard
                      key={decision.id}
                      decision={decision}
                      room={room}
                      options={options}
                      isExpanded={expandedDecisionId === decision.id}
                      onToggle={() =>
                        setExpandedDecisionId(
                          expandedDecisionId === decision.id ? null : decision.id
                        )
                      }
                      onUpdateDecision={(updates) => updateDecision(decision.id, updates)}
                      onUpdateOption={updateOption}
                      onDeleteDecision={() => deleteDecision(decision.id)}
                      onDeleteOption={deleteOption}
                      onAddOption={() => addOption(decision.id)}
                      onSelectOption={(optionId) => selectOption(decision.id, optionId)}
                    />
                  )
                })}
              </div>
            )}
          </>
        )}

        {!isLoaded && (
          <div className="text-center py-12 text-cream/50">
            <p>Loading...</p>
          </div>
        )}

        {isLoaded && state.version === 1 && (
          <div className="text-center py-12 text-cream/50">
            <p>Migrating to new format...</p>
          </div>
        )}
      </div>
    </div>
  )
}
