'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
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
import { OnboardingView } from './OnboardingView'
import { IdeasPackModal } from './IdeasPackModal'

const SORT_KEY = 'hhc_finish_sort_key'

type SortKey = 'created' | 'updated' | 'due' | 'comments'
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'created', label: 'Date added' },
  { key: 'updated', label: 'Recently updated' },
  { key: 'due', label: 'Next due date' },
  { key: 'comments', label: 'Most comments' },
]

export function DecisionTrackerPage({
  rooms,
  onBatchAddRooms,
  onUpdateRoom,
  onDeleteRoom,
  onAcquireKit,
  onAddSelection,
  readOnly = false,
  kits = [],
  defaultDecisions = {} as Record<RoomTypeV3, string[]>,
  emojiMap = {},
  ownedKitIds = [],
}: {
  rooms: RoomV3[]
  onBatchAddRooms: (selections: RoomSelection[]) => void
  onUpdateRoom: (roomId: string, updates: Partial<RoomV3>) => void
  onDeleteRoom: (roomId: string) => void
  onAcquireKit?: (kitId: string) => void
  onAddSelection: (title: string) => void
  readOnly?: boolean
  kits?: FinishDecisionKit[]
  defaultDecisions?: Record<RoomTypeV3, string[]>
  emojiMap?: Record<string, string>
  ownedKitIds?: string[]
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilters, setStatusFilters] = useState<StatusV3[]>([])
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [ideasModalOpen, setIdeasModalOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; kitId: string; roomId: string } | null>(null)
  const [simpleToast, setSimpleToast] = useState<string | null>(null)
  const [addInputValue, setAddInputValue] = useState('')
  const [addInputVisible, setAddInputVisible] = useState(false)

  const [sortKey, setSortKey] = useState<SortKey>(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(SORT_KEY) : null
      return (stored as SortKey) || 'created'
    } catch { return 'created' }
  })

  useEffect(() => {
    try { localStorage.setItem(SORT_KEY, sortKey) } catch { /* ignore */ }
  }, [sortKey])

  // The single room (board = area model)
  const room = rooms[0] ?? null
  const decisions = room?.decisions ?? []
  const hasDecisions = decisions.length > 0

  // Toggle a status filter chip
  const toggleStatusFilter = (status: StatusV3) => {
    setStatusFilters((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    )
  }

  // Filter decisions by search query and status
  const filteredDecisions = useMemo(() => {
    let result = decisions.filter((d) => d.systemKey !== 'uncategorized')

    if (statusFilters.length > 0) {
      result = result.filter((d) => statusFilters.includes(d.status))
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((decision) => {
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
    }

    return result
  }, [decisions, searchQuery, statusFilters])

  // Sort decisions
  const sortedDecisions = useMemo(() => {
    return [...filteredDecisions].sort((a, b) => {
      switch (sortKey) {
        case 'created':
          return b.createdAt.localeCompare(a.createdAt)
        case 'updated':
          return b.updatedAt.localeCompare(a.updatedAt)
        case 'due': {
          if (a.dueDate && !b.dueDate) return -1
          if (!a.dueDate && b.dueDate) return 1
          if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
          return 0
        }
        case 'comments': {
          const ac = (a.comments || []).length
          const bc = (b.comments || []).length
          return bc - ac
        }
        default:
          return 0
      }
    })
  }, [filteredDecisions, sortKey])

  // Total stats
  const isFiltering = searchQuery.trim() !== '' || statusFilters.length > 0

  const summaryStats = useMemo(() => {
    const source = isFiltering ? filteredDecisions : decisions
    const deciding = source.filter((d) => d.status === 'deciding').length
    const selected = source.filter((d) => d.status === 'selected').length
    const ordered = source.filter((d) => d.status === 'ordered').length
    const done = source.filter((d) => d.status === 'done').length

    const today = new Date().toISOString().slice(0, 10)
    const overdue = source.filter(
      (d) => d.dueDate && d.dueDate < today && d.status !== 'done'
    ).length

    const futureDueDates = source
      .filter((d) => d.dueDate && d.dueDate >= today && d.status !== 'done')
      .map((d) => d.dueDate!)
      .sort()
    const nextDue = futureDueDates[0] || null

    return { deciding, selected, ordered, done, overdue, nextDue }
  }, [decisions, filteredDecisions, isFiltering])

  // Status counts for filter chips (from all decisions, not filtered)
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const [status] of Object.entries(STATUS_CONFIG_V3)) {
      counts[status] = decisions.filter((d) => d.status === status).length
    }
    return counts
  }, [decisions])

  const activeFilterCount = statusFilters.length

  // Pack handlers
  function handleApplyKit(kit: FinishDecisionKit) {
    if (!room) return
    const isResync = (room.appliedKitIds || []).includes(kit.id)
    const result = applyKitToRoom(room, kit)
    onUpdateRoom(room.id, result.room)
    if (onAcquireKit && !ownedKitIds.includes(kit.id)) {
      onAcquireKit(kit.id)
    }
    const toastMsg = isResync
      ? `Re-synced "${kit.label}" (+${result.addedOptionCount} options)`
      : `Applied "${kit.label}" (+${result.addedDecisionCount} selections, +${result.addedOptionCount} options)`
    setToast({ message: toastMsg, kitId: kit.id, roomId: room.id })
    setTimeout(() => setToast(null), 8000)
  }

  function handleRemoveKit(kitId: string) {
    if (!room) return
    const updated = removeKitFromRoom(room, kitId)
    onUpdateRoom(room.id, updated)
    const kit = kits.find((k) => k.id === kitId)
    setSimpleToast(`Removed "${kit?.label || 'pack'}"`)
    setTimeout(() => setSimpleToast(null), 4000)
  }

  function handleUndoKit() {
    if (!toast || !room) return
    const updated = removeKitFromRoom(room, toast.kitId)
    onUpdateRoom(room.id, updated)
    setToast(null)
    setSimpleToast('Removed pack')
    setTimeout(() => setSimpleToast(null), 3000)
  }

  function handleOpenPackChooser() {
    if (!room) {
      // If no room yet, add a placeholder selection first to create the room, then open packs
      onAddSelection('(placeholder)')
      // Small delay to let room be created
      setTimeout(() => setIdeasModalOpen(true), 100)
      return
    }
    setIdeasModalOpen(true)
  }

  function handleInlineAdd() {
    const title = addInputValue.trim()
    if (!title) return
    onAddSelection(title)
    setAddInputValue('')
    setSimpleToast(`"${title}" added`)
    setTimeout(() => setSimpleToast(null), 3000)
  }

  return (
    <>
      {/* Empty state — no decisions yet */}
      {!hasDecisions && !readOnly && (
        <OnboardingView
          onAddSelection={onAddSelection}
          onOpenPackChooser={handleOpenPackChooser}
        />
      )}

      {/* Empty state for read-only */}
      {!hasDecisions && readOnly && (
        <div className="bg-basalt-50 rounded-card p-8 text-center">
          <p className="text-cream/50">This board doesn&apos;t have any selections yet.</p>
        </div>
      )}

      {/* Main content — when decisions exist */}
      {hasDecisions && (
        <>
          {/* Toolbar row: Search + Sort + Packs */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <Input
                placeholder="Search selections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {/* Sort dropdown (desktop) */}
            <div className="hidden md:flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] text-cream/30">Sort</span>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="bg-basalt-50 text-cream/60 text-[11px] rounded-lg border border-cream/10 px-2 py-1 focus:outline-none focus:border-sandstone/40"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>{opt.label}</option>
                ))}
              </select>
            </div>
            {/* Packs chip (desktop) */}
            {!readOnly && kits.length > 0 && (
              <button
                type="button"
                onClick={() => setIdeasModalOpen(true)}
                className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-cream/70 hover:text-cream/90 bg-cream/10 hover:bg-cream/15 rounded-full transition-colors shrink-0"
              >
                Add from Packs
              </button>
            )}
            {/* Search match count */}
            {searchQuery.trim() && (
              <span className="hidden md:inline text-[11px] text-cream/50 shrink-0">
                {filteredDecisions.length} match{filteredDecisions.length !== 1 ? 'es' : ''}
              </span>
            )}
          </div>

          {/* Summary strip */}
          {decisions.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-cream/50 mb-3">
              {isFiltering && <span className="text-cream/30 italic">Filtered:</span>}
              {summaryStats.deciding + summaryStats.selected + summaryStats.ordered > 0 && (
                <span className="text-cream/70 font-medium">
                  {summaryStats.deciding + summaryStats.selected + summaryStats.ordered} Selections Needed
                </span>
              )}
              <span>{summaryStats.deciding} Deciding</span>
              <span>{summaryStats.selected} Selected</span>
              <span>{summaryStats.ordered} Ordered</span>
              <span>{summaryStats.done} Done</span>
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
            {isFiltering && (
              <span className="text-[11px] text-cream/50">
                {filteredDecisions.length}/{decisions.length}
              </span>
            )}
          </div>

          {/* Desktop status filter row */}
          <div className="hidden md:flex flex-wrap items-center gap-1.5 mb-4">
            <span className="text-[11px] text-cream/30 mr-1">Status</span>
            {(Object.entries(STATUS_CONFIG_V3) as [StatusV3, (typeof STATUS_CONFIG_V3)[StatusV3]][]).map(
              ([status, config]) => {
                const isActive = statusFilters.includes(status)
                const count = statusCounts[status] ?? 0
                if (count === 0 && !isActive) return null

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
            {isFiltering && (
              <span className="text-[11px] text-cream/50 ml-auto">
                {filteredDecisions.length}/{decisions.length}
              </span>
            )}
          </div>

          {/* Decision list */}
          {sortedDecisions.length === 0 ? (
            <div className="bg-basalt-50 rounded-card p-8 text-center">
              <p className="text-cream/50">
                No selections match your {searchQuery ? 'search' : 'filters'}.
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
            <div className="space-y-1.5">
              {sortedDecisions.map((decision) => {
                const config = STATUS_CONFIG_V3[decision.status]
                return (
                  <Link
                    key={decision.id}
                    href={`/app/tools/finish-decisions/decision/${decision.id}?room=${room?.id}`}
                    className="flex items-center gap-3 px-4 py-3 bg-basalt-50 rounded-lg border border-cream/10 hover:border-sandstone/30 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-sm font-medium text-cream truncate">{decision.title}</h4>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-cream/40">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-medium ${config.pillClass}`}>
                          {config.label}
                        </span>
                        {decision.options.length > 0 && (
                          <span>{decision.options.length} option{decision.options.length !== 1 ? 's' : ''}</span>
                        )}
                        {(decision.comments || []).length > 0 && (
                          <span>{(decision.comments || []).length} comment{(decision.comments || []).length !== 1 ? 's' : ''}</span>
                        )}
                        {decision.dueDate && (
                          <span>{new Date(decision.dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        )}
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-cream/20 group-hover:text-cream/40 transition-colors shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                )
              })}

              {/* Inline add selection */}
              {!readOnly && (
                addInputVisible ? (
                  <div className="flex gap-2 px-4 py-2">
                    <input
                      type="text"
                      autoFocus
                      value={addInputValue}
                      onChange={(e) => setAddInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleInlineAdd()
                        if (e.key === 'Escape') { setAddInputVisible(false); setAddInputValue('') }
                      }}
                      onBlur={() => {
                        if (!addInputValue.trim()) { setAddInputVisible(false) }
                      }}
                      placeholder="e.g. Countertop, Faucet, Cabinet color"
                      className="flex-1 bg-basalt border border-cream/15 rounded-lg px-3 py-2 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50"
                    />
                    <button
                      type="button"
                      onClick={handleInlineAdd}
                      disabled={!addInputValue.trim()}
                      className="px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                    >
                      Add
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddInputVisible(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-basalt-50/50 rounded-card border-2 border-dashed border-cream/15 hover:border-sandstone/40 transition-all cursor-pointer group"
                  >
                    <svg className="w-4 h-4 text-cream/30 group-hover:text-sandstone transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                    </svg>
                    <span className="text-sm font-medium text-cream/40 group-hover:text-sandstone transition-colors">Add a Selection</span>
                  </button>
                )
              )}
            </div>
          )}
        </>
      )}

      {/* Mobile FAB — Add Selection */}
      {hasDecisions && !readOnly && (
        <button
          type="button"
          onClick={() => setAddInputVisible(true)}
          className="md:hidden fixed bottom-8 right-8 w-14 h-14 bg-sandstone rounded-full shadow-lg z-40 flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Add a selection"
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
                  onClick={() => setStatusFilters([])}
                  className="text-xs text-sandstone hover:text-sandstone-light transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="px-5 pb-5 space-y-5">
              {/* Status section */}
              <div>
                <label className="block text-sm text-cream/70 mb-2">Status</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(STATUS_CONFIG_V3) as [StatusV3, (typeof STATUS_CONFIG_V3)[StatusV3]][]).map(
                    ([status, config]) => {
                      const isActive = statusFilters.includes(status)
                      const count = statusCounts[status] ?? 0
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

              {/* Sort */}
              <div>
                <label className="block text-sm text-cream/70 mb-2">Sort by</label>
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                  className="w-full bg-basalt text-cream/60 text-sm rounded-lg border border-cream/10 px-3 py-2 focus:outline-none focus:border-sandstone/40"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Packs */}
              {!readOnly && kits.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => { setFilterSheetOpen(false); setIdeasModalOpen(true) }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-cream/70 bg-cream/5 rounded-lg transition-colors"
                  >
                    Add from Packs
                  </button>
                </div>
              )}

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

      {/* Ideas Pack Modal */}
      {ideasModalOpen && room && (
        <IdeasPackModal
          roomType={room.type as RoomTypeV3}
          roomName={room.name}
          appliedKitIds={room.appliedKitIds || []}
          ownedKitIds={ownedKitIds}
          onApply={handleApplyKit}
          onAcquireKit={onAcquireKit}
          onRemoveKit={handleRemoveKit}
          onClose={() => setIdeasModalOpen(false)}
          kits={kits}
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

      {/* Simple toast (no undo) */}
      {simpleToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-basalt-50 border border-cream/15 rounded-lg shadow-lg px-4 py-2.5 flex items-center gap-2 max-w-xs">
          <svg className="w-4 h-4 text-green-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm text-cream/70">{simpleToast}</span>
        </div>
      )}
    </>
  )
}
