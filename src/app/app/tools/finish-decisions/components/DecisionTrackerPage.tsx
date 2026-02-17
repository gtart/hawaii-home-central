'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { ShareButton } from '@/components/resources/ShareButton'
import {
  STATUS_CONFIG_V3,
  type RoomV3,
  type StatusV3,
  type RoomSelection,
} from '@/data/finish-decisions'
import Link from 'next/link'
import { RoomSection } from './RoomSection'
import { OnboardingView } from './OnboardingView'

export function DecisionTrackerPage({
  rooms,
  onBatchAddRooms,
  onUpdateRoom,
  onDeleteRoom,
}: {
  rooms: RoomV3[]
  onBatchAddRooms: (selections: RoomSelection[]) => void
  onUpdateRoom: (roomId: string, updates: Partial<RoomV3>) => void
  onDeleteRoom: (roomId: string) => void
}) {
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(
    () => new Set(rooms.length <= 3 ? rooms.map((r) => r.id) : [])
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilters, setStatusFilters] = useState<StatusV3[]>([])
  const [roomFilter, setRoomFilter] = useState<string | null>(null)
  const [onboardingCollapsed, setOnboardingCollapsed] = useState(true)

  const hasRooms = rooms.length > 0

  // Auto-expand all rooms when transitioning from 0 rooms (onboarding → tracker)
  const prevRoomCountRef = useRef(rooms.length)
  useEffect(() => {
    if (prevRoomCountRef.current === 0 && rooms.length > 0) {
      setExpandedRooms(new Set(rooms.map((r) => r.id)))
    }
    prevRoomCountRef.current = rooms.length
  }, [rooms])

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

  // Filter rooms and decisions by search query, room filter, and status filters
  const filteredRooms = useMemo(() => {
    let result = rooms

    // Apply room filter
    if (roomFilter) {
      result = result.filter((room) => room.id === roomFilter)
    }

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
  }, [rooms, searchQuery, statusFilters, roomFilter])

  // Total counts for summary
  const totalDecisions = rooms.reduce((sum, r) => sum + r.decisions.length, 0)
  const filteredDecisions = filteredRooms.reduce((sum, r) => sum + r.decisions.length, 0)
  const isFiltering = searchQuery.trim() !== '' || statusFilters.length > 0 || roomFilter !== null

  return (
    <>
      {/* Breadcrumb */}
      <Link
        href="/app"
        className="text-sandstone hover:text-sandstone-light text-sm mb-4 inline-block"
      >
        &larr; My Tools
      </Link>

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

      {/* Onboarding — always visible, collapsible when rooms exist */}
      <OnboardingView
        onBatchCreate={onBatchAddRooms}
        collapsed={hasRooms ? onboardingCollapsed : undefined}
        onToggleCollapse={hasRooms ? () => setOnboardingCollapsed((prev) => !prev) : undefined}
      />

      {/* Tracker UI — only when rooms exist */}
      {hasRooms && (
        <>
          {/* Room Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <button
              onClick={() => setRoomFilter(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                roomFilter === null
                  ? 'bg-sandstone/20 text-sandstone ring-1 ring-sandstone/40'
                  : 'bg-cream/10 text-cream/60 hover:text-cream/80'
              }`}
            >
              All Rooms
            </button>
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => setRoomFilter(roomFilter === room.id ? null : room.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  roomFilter === room.id
                    ? 'bg-sandstone/20 text-sandstone ring-1 ring-sandstone/40'
                    : 'bg-cream/10 text-cream/60 hover:text-cream/80'
                }`}
              >
                {room.name}
                <span className="text-[10px] opacity-70 ml-1.5">{room.decisions.length}</span>
              </button>
            ))}
          </div>

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
            {(Object.entries(STATUS_CONFIG_V3) as [StatusV3, (typeof STATUS_CONFIG_V3)[StatusV3]][]).map(
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
            <button
              onClick={expandAll}
              className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-cream/10 text-cream/50 hover:text-cream/80 transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-cream/10 text-cream/50 hover:text-cream/80 transition-colors"
            >
              Collapse All
            </button>

            <div className="flex-1" />

            {isFiltering && (
              <span className="text-xs text-cream/50">
                {filteredDecisions} of {totalDecisions} decisions
              </span>
            )}
          </div>

          {/* Content */}
          {filteredRooms.length === 0 ? (
            <div className="bg-basalt-50 rounded-card p-8 text-center">
              <p className="text-cream/50">
                No decisions match your {searchQuery ? 'search' : 'filters'}.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilters([])
                  setRoomFilter(null)
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
        </>
      )}
    </>
  )
}
