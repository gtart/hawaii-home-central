'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import {
  STATUS_CONFIG_V3,
  type RoomV3,
  type DecisionV3,
  type StatusV3,
  type RoomSelection,
} from '@/data/finish-decisions'
import type { RoomTypeV3 } from '@/data/finish-decisions'
import type { FinishDecisionKit } from '@/data/finish-decision-kits'
import { findKitsForRoomType } from '@/lib/finish-decision-kits'
import { applyKitToRoom, removeKitFromRoom } from '@/lib/finish-decision-kits'
import { RoomSection } from './RoomSection'
import { OnboardingView } from './OnboardingView'
import { QuickAddDecisionModal } from './QuickAddDecisionModal'
import { IdeasPackModal } from './IdeasPackModal'

export function DecisionTrackerPage({
  rooms,
  onBatchAddRooms,
  onUpdateRoom,
  onDeleteRoom,
  readOnly = false,
}: {
  rooms: RoomV3[]
  onBatchAddRooms: (selections: RoomSelection[]) => void
  onUpdateRoom: (roomId: string, updates: Partial<RoomV3>) => void
  onDeleteRoom: (roomId: string) => void
  readOnly?: boolean
}) {
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(
    () => new Set(rooms.length <= 3 ? rooms.map((r) => r.id) : [])
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilters, setStatusFilters] = useState<StatusV3[]>([])
  const [roomFilter, setRoomFilter] = useState<string | null>(null)
  const [onboardingCollapsed, setOnboardingCollapsed] = useState(true)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [quickAddRoomId, setQuickAddRoomId] = useState<string | null>(null)
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [ideasModalRoomId, setIdeasModalRoomId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; kitId: string; roomId: string } | null>(null)

  // Refs for focus return (FS-UI-008)
  const fabRef = useRef<HTMLButtonElement>(null)
  const desktopAddRef = useRef<HTMLButtonElement>(null)
  const quickAddTriggerRef = useRef<HTMLButtonElement | null>(null)

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
  const activeFilterCount = (roomFilter ? 1 : 0) + statusFilters.length

  // Summary strip stats — reflects filters when active (FS-UI-007)
  const summaryStats = useMemo(() => {
    const source = isFiltering ? filteredRooms : rooms
    const allDecisions = source.flatMap((r) => r.decisions)
    const deciding = allDecisions.filter((d) => d.status === 'deciding').length
    const selected = allDecisions.filter((d) => d.status === 'selected').length
    const ordered = allDecisions.filter((d) => d.status === 'ordered').length
    const done = allDecisions.filter((d) => d.status === 'done').length

    const today = new Date().toISOString().slice(0, 10)
    const overdue = allDecisions.filter(
      (d) => d.dueDate && d.dueDate < today && d.status !== 'done'
    ).length

    const futureDueDates = allDecisions
      .filter((d) => d.dueDate && d.dueDate >= today && d.status !== 'done')
      .map((d) => d.dueDate!)
      .sort()
    const nextDue = futureDueDates[0] || null

    return { deciding, selected, ordered, done, overdue, nextDue }
  }, [rooms, filteredRooms, isFiltering])

  // Status counts for filter chips (computed from all rooms, not filtered)
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const [status] of Object.entries(STATUS_CONFIG_V3)) {
      counts[status] = rooms.reduce(
        (sum, r) => sum + r.decisions.filter((d) => d.status === status).length,
        0
      )
    }
    return counts
  }, [rooms])

  const handleQuickAddDecision = (roomId: string, decision: DecisionV3) => {
    const room = rooms.find((r) => r.id === roomId)
    if (!room) return
    onUpdateRoom(roomId, {
      decisions: [...room.decisions, decision],
      updatedAt: new Date().toISOString(),
    })
    // Auto-expand the room so user sees the new decision
    setExpandedRooms((prev) => new Set([...prev, roomId]))
  }

  function openQuickAdd(roomId: string | null, trigger: React.RefObject<HTMLButtonElement | null>) {
    quickAddTriggerRef.current = trigger.current
    setQuickAddRoomId(roomId)
    setQuickAddOpen(true)
  }

  function handleApplyKit(kit: FinishDecisionKit) {
    const room = rooms.find((r) => r.id === ideasModalRoomId)
    if (!room) return
    const result = applyKitToRoom(room, kit)
    onUpdateRoom(room.id, result.room)
    setExpandedRooms((prev) => new Set([...prev, room.id]))
    setToast({ message: `Added "${kit.label}" — ${result.addedOptionCount} ideas`, kitId: kit.id, roomId: room.id })
    setTimeout(() => setToast(null), 8000)
  }

  function handleUndoKit() {
    if (!toast) return
    const room = rooms.find((r) => r.id === toast.roomId)
    if (!room) return
    const updated = removeKitFromRoom(room, toast.kitId)
    onUpdateRoom(room.id, updated)
    setToast(null)
  }

  const ideasModalRoom = ideasModalRoomId ? rooms.find((r) => r.id === ideasModalRoomId) : null

  return (
    <>
      {/* Onboarding — hidden for readOnly users */}
      {!readOnly && (
        <OnboardingView
          onBatchCreate={onBatchAddRooms}
          collapsed={hasRooms ? onboardingCollapsed : undefined}
          onToggleCollapse={hasRooms ? () => setOnboardingCollapsed((prev) => !prev) : undefined}
        />
      )}

      {/* Tracker UI — only when rooms exist */}
      {hasRooms && (
        <>
          {/* Search */}
          <div className="mb-3">
            <Input
              placeholder="Search all rooms and selections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Summary strip */}
          {totalDecisions > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-cream/50 mb-3">
              {isFiltering && <span className="text-cream/30 italic">Filtered:</span>}
              <span>Deciding {summaryStats.deciding}</span>
              <span>Selected {summaryStats.selected}</span>
              <span>Ordered {summaryStats.ordered}</span>
              <span>Done {summaryStats.done}</span>
              {summaryStats.overdue > 0 && (
                <span className="text-red-400">Overdue {summaryStats.overdue}</span>
              )}
              {summaryStats.nextDue && (
                <span>
                  Next due:{' '}
                  {new Date(summaryStats.nextDue + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>
          )}

          {/* Mobile filter bar */}
          <div className="flex md:hidden items-center gap-2 mb-4">
            <button
              onClick={() => setFilterSheetOpen(true)}
              className="relative inline-flex items-center gap-1.5 px-3 py-1.5 bg-cream/10 rounded-lg text-xs text-cream/70 hover:text-cream transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
              </svg>
              Filter
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-sandstone text-basalt text-[10px] font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <div className="flex-1" />
            <button
              onClick={expandAll}
              className="text-[11px] text-cream/40 hover:text-cream/70 transition-colors"
            >
              Expand
            </button>
            <span className="text-cream/15 select-none">·</span>
            <button
              onClick={collapseAll}
              className="text-[11px] text-cream/40 hover:text-cream/70 transition-colors"
            >
              Collapse
            </button>
            {isFiltering && (
              <>
                <span className="text-cream/15 select-none">·</span>
                <span className="text-[11px] text-cream/50">
                  {filteredDecisions}/{totalDecisions}
                </span>
              </>
            )}
          </div>

          {/* Desktop filter row: rooms + status + expand/collapse */}
          <div className="hidden md:flex flex-wrap items-center gap-1.5 mb-4">
            {/* Room filters */}
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
                <span className="text-[10px] opacity-70 ml-1">{room.decisions.length}</span>
              </button>
            ))}

            {/* Separator */}
            <span className="text-cream/15 mx-0.5 select-none">|</span>

            {/* Status filters */}
            {(Object.entries(STATUS_CONFIG_V3) as [StatusV3, (typeof STATUS_CONFIG_V3)[StatusV3]][]).map(
              ([status, config]) => {
                const isActive = statusFilters.includes(status)
                const count = statusCounts[status] ?? 0
                if (count === 0) return null

                return (
                  <button
                    key={status}
                    onClick={() => toggleStatusFilter(status)}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
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

            {/* Expand / Collapse + results counter */}
            <div className="flex-1" />
            <button
              onClick={expandAll}
              className="text-[11px] text-cream/40 hover:text-cream/70 transition-colors"
            >
              Expand
            </button>
            <span className="text-cream/15 select-none">·</span>
            <button
              onClick={collapseAll}
              className="text-[11px] text-cream/40 hover:text-cream/70 transition-colors"
            >
              Collapse
            </button>
            {isFiltering && (
              <>
                <span className="text-cream/15 select-none">·</span>
                <span className="text-[11px] text-cream/50">
                  {filteredDecisions}/{totalDecisions}
                </span>
              </>
            )}
            {!readOnly && (
              <>
                <span className="text-cream/15 select-none">·</span>
                <button
                  ref={desktopAddRef}
                  onClick={() => openQuickAdd(null, desktopAddRef)}
                  className="inline-flex items-center gap-1 text-[11px] text-sandstone hover:text-sandstone-light transition-colors font-medium"
                >
                  + Add Selection
                </button>
              </>
            )}
          </div>

          {/* Content */}
          {filteredRooms.length === 0 ? (
            <div className="bg-basalt-50 rounded-card p-8 text-center">
              <p className="text-cream/50">
                No selections match your {searchQuery ? 'search' : 'filters'}.
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
                  onQuickAdd={() => { setQuickAddRoomId(room.id); setQuickAddOpen(true) }}
                  onAddIdeasPack={() => setIdeasModalRoomId(room.id)}
                  readOnly={readOnly}
                  hasAvailableKits={findKitsForRoomType(room.type as RoomTypeV3).length > 0}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Mobile FAB */}
      {hasRooms && !readOnly && (
        <button
          ref={fabRef}
          type="button"
          onClick={() => openQuickAdd(null, fabRef)}
          className="md:hidden fixed bottom-8 right-8 w-14 h-14 bg-sandstone rounded-full shadow-lg z-40 flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Add selection"
        >
          <svg className="w-7 h-7 text-basalt" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {/* Mobile Filter Sheet */}
      {filterSheetOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setFilterSheetOpen(false)} />
          <div className="relative bg-basalt-50 border-t border-cream/10 rounded-t-xl w-full max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h2 className="text-lg font-medium text-cream">Filters</h2>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => { setRoomFilter(null); setStatusFilters([]) }}
                  className="text-xs text-sandstone hover:text-sandstone-light transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="px-5 pb-5 space-y-5">
              {/* Room section */}
              <div>
                <label className="block text-sm text-cream/70 mb-2">Room</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setRoomFilter(null)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      roomFilter === null
                        ? 'bg-sandstone/20 text-sandstone ring-1 ring-sandstone/40'
                        : 'bg-cream/10 text-cream/60'
                    }`}
                  >
                    All Rooms
                  </button>
                  {rooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => setRoomFilter(roomFilter === room.id ? null : room.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        roomFilter === room.id
                          ? 'bg-sandstone/20 text-sandstone ring-1 ring-sandstone/40'
                          : 'bg-cream/10 text-cream/60'
                      }`}
                    >
                      {room.name}
                      <span className="text-[10px] opacity-70 ml-1">{room.decisions.length}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Status section — hide 0-count unless actively filtered (FS-UI-010) */}
              <div>
                <label className="block text-sm text-cream/70 mb-2">Status</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(STATUS_CONFIG_V3) as [StatusV3, (typeof STATUS_CONFIG_V3)[StatusV3]][]).map(
                    ([status, config]) => {
                      const isActive = statusFilters.includes(status)
                      const count = statusCounts[status] ?? 0
                      // Hide 0-count statuses unless actively selected as a filter
                      if (count === 0 && !isActive) return null

                      return (
                        <button
                          key={status}
                          onClick={() => toggleStatusFilter(status)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                            isActive
                              ? 'bg-sandstone/30 text-sandstone ring-1 ring-sandstone/50'
                              : 'bg-cream/10 text-cream/60'
                          }`}
                        >
                          {config.label}
                          <span className="text-[10px] opacity-70">{count}</span>
                        </button>
                      )
                    }
                  )}
                </div>
              </div>

              {/* Done button */}
              <button
                onClick={() => setFilterSheetOpen(false)}
                className="w-full py-3 bg-sandstone text-basalt font-medium rounded-lg hover:bg-sandstone-light transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Modal */}
      {quickAddOpen && rooms.length > 0 && (
        <QuickAddDecisionModal
          rooms={rooms}
          preselectedRoomId={quickAddRoomId}
          onAdd={handleQuickAddDecision}
          onClose={() => setQuickAddOpen(false)}
          triggerRef={quickAddTriggerRef}
        />
      )}

      {/* Ideas Pack Modal */}
      {ideasModalRoom && (
        <IdeasPackModal
          roomType={ideasModalRoom.type as RoomTypeV3}
          roomName={ideasModalRoom.name}
          appliedKitIds={ideasModalRoom.appliedKitIds || []}
          onApply={handleApplyKit}
          onClose={() => setIdeasModalRoomId(null)}
        />
      )}

      {/* Toast with undo */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-basalt-50 border border-cream/15 rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 max-w-sm">
          <span className="text-sm text-cream/70">{toast.message}</span>
          <button
            type="button"
            onClick={handleUndoKit}
            className="text-sm text-sandstone font-medium hover:text-sandstone-light transition-colors shrink-0"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-cream/30 hover:text-cream/60 transition-colors"
          >
            ×
          </button>
        </div>
      )}
    </>
  )
}
