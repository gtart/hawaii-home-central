'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { ShareButton } from '@/components/resources/ShareButton'
import {
  STATUS_CONFIG_V3,
  type RoomV3,
  type StatusV3,
  type RoomTypeV3,
} from '@/data/finish-decisions'
import { AddRoomModal } from './AddRoomModal'
import { RoomSection } from './RoomSection'
import { MilestoneView } from './MilestoneView'

export function DecisionTrackerPage({
  rooms,
  onAddRoom,
  onUpdateRoom,
  onDeleteRoom,
}: {
  rooms: RoomV3[]
  onAddRoom: (type: RoomTypeV3, name: string, useDefaults: boolean) => void
  onUpdateRoom: (roomId: string, updates: Partial<RoomV3>) => void
  onDeleteRoom: (roomId: string) => void
}) {
  const [viewMode, setViewMode] = useState<'by-room' | 'by-milestone'>('by-room')
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(
    () => new Set(rooms.length <= 3 ? rooms.map((r) => r.id) : [])
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilters, setStatusFilters] = useState<StatusV3[]>([])
  const [showAddModal, setShowAddModal] = useState(false)

  // Toggle a single room's expansion
  const toggleRoom = (roomId: string) => {
    setExpandedRooms((prev) => {
      const next = new Set(prev)
      if (next.has(roomId)) {
        next.delete(roomId)
      } else {
        next.add(roomId)
      }
      return next
    })
  }

  const expandAll = () => {
    setExpandedRooms(new Set(filteredRooms.map((r) => r.id)))
  }

  const collapseAll = () => {
    setExpandedRooms(new Set())
  }

  // Toggle a status filter chip
  const toggleStatusFilter = (status: StatusV3) => {
    setStatusFilters((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    )
  }

  // Filter rooms and decisions by search query and status filters
  const filteredRooms = useMemo(() => {
    let result = rooms

    // Apply status filter
    if (statusFilters.length > 0) {
      result = result
        .map((room) => ({
          ...room,
          decisions: room.decisions.filter((d) => statusFilters.includes(d.status)),
        }))
        .filter((room) => room.decisions.length > 0)
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result
        .map((room) => ({
          ...room,
          decisions: room.decisions.filter((decision) => {
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
          }),
        }))
        .filter((room) => room.decisions.length > 0)
    }

    return result
  }, [rooms, searchQuery, statusFilters])

  // Total counts for summary
  const totalDecisions = rooms.reduce((sum, r) => sum + r.decisions.length, 0)
  const filteredDecisions = filteredRooms.reduce((sum, r) => sum + r.decisions.length, 0)
  const isFiltering = searchQuery.trim() !== '' || statusFilters.length > 0

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-2">
        <h1 className="font-serif text-4xl md:text-5xl text-sandstone">Decision Tracker</h1>
        <div className="shrink-0 mt-2">
          <ShareButton title="Decision Tracker &mdash; Hawaii Home Central" />
        </div>
      </div>
      <p className="text-cream/70 text-lg mb-6 leading-relaxed">
        Track every selection and decision by room. Compare options, record specs, and mark
        progress.
      </p>

      {/* Search */}
      <div className="mb-4">
        <Input
          placeholder="Search all rooms and decisions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Status Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(Object.entries(STATUS_CONFIG_V3) as [StatusV3, { label: string; variant: 'default' | 'accent' }][]).map(
          ([status, config]) => {
            const isActive = statusFilters.includes(status)
            const count = rooms.reduce(
              (sum, r) => sum + r.decisions.filter((d) => d.status === status).length,
              0
            )
            if (count === 0) return null

            return (
              <button
                key={status}
                onClick={() => toggleStatusFilter(status)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-sandstone/30 text-sandstone ring-1 ring-sandstone/50'
                    : 'bg-cream/10 text-cream/60 hover:text-cream/80'
                }`}
              >
                {config.label}
                <span className="text-[10px] opacity-70">{count}</span>
              </button>
            )
          }
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Button onClick={() => setShowAddModal(true)}>Add Room or Area</Button>

        {/* View Mode Toggle */}
        {rooms.length > 0 && (
          <div className="inline-flex rounded-button overflow-hidden border border-cream/20">
            <button
              onClick={() => setViewMode('by-room')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'by-room'
                  ? 'bg-sandstone/20 text-sandstone'
                  : 'text-cream/50 hover:text-cream/70'
              }`}
            >
              By Room
            </button>
            <button
              onClick={() => setViewMode('by-milestone')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'by-milestone'
                  ? 'bg-sandstone/20 text-sandstone'
                  : 'text-cream/50 hover:text-cream/70'
              }`}
            >
              By Milestone
            </button>
          </div>
        )}

        {viewMode === 'by-room' && rooms.length > 0 && (
          <>
            <Button size="sm" variant="secondary" onClick={expandAll}>
              Expand All
            </Button>
            <Button size="sm" variant="secondary" onClick={collapseAll}>
              Collapse All
            </Button>
          </>
        )}

        <div className="flex-1" />

        {isFiltering && (
          <span className="text-xs text-cream/50">
            {filteredDecisions} of {totalDecisions} decisions
          </span>
        )}
      </div>

      {/* Content */}
      {rooms.length === 0 ? (
        <div className="bg-basalt-50 rounded-card p-12 text-center">
          <p className="text-cream/50 mb-4">No rooms yet. Add your first room to get started.</p>
          <Button onClick={() => setShowAddModal(true)}>Add Room or Area</Button>
        </div>
      ) : viewMode === 'by-milestone' ? (
        <MilestoneView rooms={filteredRooms.length > 0 ? filteredRooms : rooms} />
      ) : filteredRooms.length === 0 ? (
        <div className="bg-basalt-50 rounded-card p-8 text-center">
          <p className="text-cream/50">
            No decisions match your {searchQuery ? 'search' : 'filters'}.
          </p>
          <button
            onClick={() => {
              setSearchQuery('')
              setStatusFilters([])
            }}
            className="text-sandstone text-sm mt-2 hover:text-sandstone-light"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRooms.map((room) => (
            <RoomSection
              key={room.id}
              room={room}
              isExpanded={expandedRooms.has(room.id)}
              onToggleExpand={() => toggleRoom(room.id)}
              onUpdateRoom={(updates) => onUpdateRoom(room.id, updates)}
              onDeleteRoom={() => onDeleteRoom(room.id)}
            />
          ))}
        </div>
      )}

      {/* Add Room Modal */}
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
