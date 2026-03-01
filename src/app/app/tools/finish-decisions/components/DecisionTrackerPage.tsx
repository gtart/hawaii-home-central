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
import { isGlobalUnsorted, findUncategorizedDecision } from '@/lib/decisionHelpers'
import { useRouter } from 'next/navigation'
import { RoomSection } from './RoomSection'
import { RoomsBoardView } from './RoomsBoardView'
import { OnboardingView } from './OnboardingView'
import { QuickAddDecisionModal } from './QuickAddDecisionModal'
import { AddRoomModal } from './AddRoomModal'
import { IdeasPackModal } from './IdeasPackModal'

const VIEW_MODE_KEY = 'hhc_finish_view_mode_v2'
const SORT_KEY = 'hhc_finish_sort_key'

type SortKey = 'alpha' | 'created' | 'updated' | 'due' | 'inProgress' | 'comments'
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'alpha', label: 'A – Z' },
  { key: 'created', label: 'Date added' },
  { key: 'updated', label: 'Recently updated' },
  { key: 'due', label: 'Next due date' },
  { key: 'inProgress', label: 'Most in-progress' },
  { key: 'comments', label: 'Most comments' },
]

function getRoomSortStats(room: RoomV3) {
  const decisions = room.decisions.filter((d) => d.systemKey !== 'uncategorized')
  const deciding = decisions.filter((d) => d.status === 'deciding').length

  let lastUpdated = room.updatedAt
  for (const d of room.decisions) {
    if (d.updatedAt > lastUpdated) lastUpdated = d.updatedAt
  }

  let totalComments = 0
  for (const d of room.decisions) {
    totalComments += (d.comments || []).length
  }

  const today = new Date().toISOString().slice(0, 10)
  const futureDues = decisions
    .filter((d) => d.dueDate && d.dueDate >= today && d.status !== 'done')
    .map((d) => d.dueDate!)
    .sort()
  const nextDue = futureDues[0] || null

  return { deciding, lastUpdated, totalComments, nextDue }
}

function GlobalUnsortedRow({ room }: { room: RoomV3 }) {
  const router = useRouter()
  const uncatDecision = findUncategorizedDecision(room)
  const count = uncatDecision ? uncatDecision.options.length : 0

  return (
    <div
      data-testid="unsorted-room-row"
      role={count > 0 ? 'button' : undefined}
      tabIndex={count > 0 ? 0 : undefined}
      onClick={() => { if (count > 0) router.push(`/app/tools/finish-decisions/room/${room.id}`) }}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && count > 0) { e.preventDefault(); router.push(`/app/tools/finish-decisions/room/${room.id}`) } }}
      className={`bg-basalt-50 rounded-card overflow-hidden border-2 border-dashed transition-all ${
        count > 0
          ? 'border-amber-500/30 hover:border-amber-500/50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/50'
          : 'border-cream/10'
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${count > 0 ? 'bg-amber-500/10' : 'bg-cream/5'}`}>
          <svg className={`w-5 h-5 ${count > 0 ? 'text-amber-400' : 'text-cream/20'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-medium ${count > 0 ? 'text-amber-300' : 'text-cream/30'}`}>Unsorted</h3>
          <p className="text-[11px] text-cream/30">
            {count > 0
              ? `${count} option${count !== 1 ? 's' : ''} to sort into rooms`
              : 'Saved-from-web items land here until you sort them'}
          </p>
        </div>
        {count > 0 && (
          <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 bg-amber-500/20 text-amber-300 text-[11px] font-bold rounded-full">
            {count}
          </span>
        )}
      </div>
    </div>
  )
}

export function DecisionTrackerPage({
  rooms,
  onBatchAddRooms,
  onUpdateRoom,
  onDeleteRoom,
  onAcquireKit,
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
  readOnly?: boolean
  kits?: FinishDecisionKit[]
  defaultDecisions?: Record<RoomTypeV3, string[]>
  emojiMap?: Record<string, string>
  ownedKitIds?: string[]
}) {
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(
    () => new Set(rooms.length <= 3 ? rooms.map((r) => r.id) : [])
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilters, setStatusFilters] = useState<StatusV3[]>([])
  const [roomFilter, setRoomFilter] = useState<string | null>(() => {
    try {
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
      return params?.get('room') || null
    } catch { return null }
  })
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [quickAddRoomId, setQuickAddRoomId] = useState<string | null>(null)
  const [addRoomOpen, setAddRoomOpen] = useState(false)
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [ideasModalRoomId, setIdeasModalRoomId] = useState<string | null>(null)
  const [ideasModalDestPicker, setIdeasModalDestPicker] = useState(false)
  const [destPickerRoomId, setDestPickerRoomId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; kitId: string; roomId: string } | null>(null)
  const [simpleToast, setSimpleToast] = useState<string | null>(null)
  const [packsPopoverOpen, setPacksPopoverOpen] = useState(false)
  const [saveInfoOpen, setSaveInfoOpen] = useState(false)
  const packsPopoverRef = useRef<HTMLDivElement>(null)
  const saveInfoRef = useRef<HTMLDivElement>(null)

  // Close popovers on outside click
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (packsPopoverRef.current && !packsPopoverRef.current.contains(e.target as Node)) {
      setPacksPopoverOpen(false)
    }
    if (saveInfoRef.current && !saveInfoRef.current.contains(e.target as Node)) {
      setSaveInfoOpen(false)
    }
  }, [])
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [handleClickOutside])
  // Flag: open pack chooser once rooms appear (set by onboarding "pack" level)
  const [pendingPackChooser, setPendingPackChooser] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'boards'>(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(VIEW_MODE_KEY) : null
      if (stored === 'boards') return 'boards'
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
      if (params?.get('view') === 'boards') return 'boards'
      return 'list'
    } catch { return 'list' }
  })
  const [sortKey, setSortKey] = useState<SortKey>(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(SORT_KEY) : null
      return (stored as SortKey) || 'created'
    } catch { return 'created' }
  })

  // Persist view mode + sort key
  useEffect(() => {
    try { localStorage.setItem(VIEW_MODE_KEY, viewMode) } catch { /* ignore */ }
  }, [viewMode])
  useEffect(() => {
    try { localStorage.setItem(SORT_KEY, sortKey) } catch { /* ignore */ }
  }, [sortKey])

  // Search auto-expand: save/restore expand state when searching
  const preSearchExpandRef = useRef<Set<string> | null>(null)

  // When navigating with ?room= param, redirect to the room detail page
  const initialRoomHandled = useRef(false)
  useEffect(() => {
    if (initialRoomHandled.current) return
    if (roomFilter && rooms.some((r) => r.id === roomFilter)) {
      initialRoomHandled.current = true
      // Navigate to room page instead of expanding inline
      window.location.href = `/app/tools/finish-decisions/room/${roomFilter}`
    }
  }, [roomFilter, rooms]) // eslint-disable-line react-hooks/exhaustive-deps

  // Refs for focus return (FS-UI-008)
  const quickAddTriggerRef = useRef<HTMLButtonElement | null>(null)

  const hasRooms = rooms.length > 0

  // First success state — detect 0→N room transition from onboarding
  const [showFirstSuccess, setShowFirstSuccess] = useState(false)
  const prevRoomCountRef = useRef(rooms.length)
  useEffect(() => {
    if (prevRoomCountRef.current === 0 && rooms.length > 0) {
      setShowFirstSuccess(true)
    }
    prevRoomCountRef.current = rooms.length
  }, [rooms.length])

  // Auto-expand newly added rooms (handles both 0→N and N→N+1 transitions)
  const prevRoomIdsRef = useRef(new Set(rooms.map((r) => r.id)))
  useEffect(() => {
    const currentIds = new Set(rooms.map((r) => r.id))
    const newIds = [...currentIds].filter((id) => !prevRoomIdsRef.current.has(id))
    if (newIds.length > 0) {
      setExpandedRooms((prev) => new Set([...prev, ...newIds]))
    }
    prevRoomIdsRef.current = currentIds
  }, [rooms])

  // Open pack modal once rooms appear after "pack" onboarding level
  // Use the newest non-unsorted room (just created by onboarding), not rooms[0]
  useEffect(() => {
    if (pendingPackChooser && rooms.length > 0) {
      setPendingPackChooser(false)
      const newIds = [...rooms.map((r) => r.id)].filter((id) => !prevRoomIdsRef.current.has(id))
      const targetRoom = newIds.length > 0
        ? rooms.find((r) => r.id === newIds[0])
        : rooms.find((r) => !isGlobalUnsorted(r))
      if (targetRoom) {
        setDestPickerRoomId(targetRoom.id)
        setIdeasModalDestPicker(true)
        setIdeasModalRoomId(targetRoom.id)
      }
    }
  }, [pendingPackChooser, rooms])

  // Auto-open pack modal when returning from marketplace (openPacks=1 query param)
  const openPacksHandled = useRef(false)
  useEffect(() => {
    if (openPacksHandled.current || !hasRooms) return
    try {
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
      if (params?.get('openPacks') === '1') {
        openPacksHandled.current = true
        const targetRoomId = params.get('roomId')
        const targetRoom = targetRoomId
          ? rooms.find((r) => r.id === targetRoomId)
          : rooms.find((r) => !isGlobalUnsorted(r))
        if (targetRoom) {
          setDestPickerRoomId(targetRoom.id)
          setIdeasModalDestPicker(true)
          setIdeasModalRoomId(targetRoom.id)
        }
        // Clean URL without triggering navigation
        const url = new URL(window.location.href)
        url.searchParams.delete('openPacks')
        url.searchParams.delete('roomId')
        url.searchParams.delete('highlightPackId')
        window.history.replaceState({}, '', url.pathname + (url.search || ''))
      }
    } catch { /* SSR guard */ }
  }, [hasRooms, rooms])

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

  // Sorted rooms — applies sort to filteredRooms
  const sortedFilteredRooms = useMemo(() => {
    return [...filteredRooms].sort((a, b) => {
      const aGlobal = isGlobalUnsorted(a) ? 0 : 1
      const bGlobal = isGlobalUnsorted(b) ? 0 : 1
      if (aGlobal !== bGlobal) return aGlobal - bGlobal

      const statsA = getRoomSortStats(a)
      const statsB = getRoomSortStats(b)

      switch (sortKey) {
        case 'alpha':
          return a.name.localeCompare(b.name)
        case 'created':
          return a.createdAt.localeCompare(b.createdAt)
        case 'updated':
          return statsB.lastUpdated.localeCompare(statsA.lastUpdated)
        case 'due': {
          if (statsA.nextDue && !statsB.nextDue) return -1
          if (!statsA.nextDue && statsB.nextDue) return 1
          if (statsA.nextDue && statsB.nextDue) return statsA.nextDue.localeCompare(statsB.nextDue)
          return 0
        }
        case 'inProgress':
          return statsB.deciding - statsA.deciding
        case 'comments':
          return statsB.totalComments - statsA.totalComments
        default:
          return 0
      }
    })
  }, [filteredRooms, sortKey])

  // Search auto-expand effect
  useEffect(() => {
    if (searchQuery.trim()) {
      if (!preSearchExpandRef.current) {
        preSearchExpandRef.current = new Set(expandedRooms)
      }
      setExpandedRooms(new Set(filteredRooms.map((r) => r.id)))
    } else if (preSearchExpandRef.current) {
      setExpandedRooms(preSearchExpandRef.current)
      preSearchExpandRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filteredRooms])

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

  function openQuickAdd(roomId: string | null) {
    setQuickAddRoomId(roomId)
    setQuickAddOpen(true)
  }

  function handleApplyKit(kit: FinishDecisionKit, targetRoomId?: string) {
    const roomId = targetRoomId || ideasModalRoomId
    const room = rooms.find((r) => r.id === roomId)
    if (!room) return
    const isResync = (room.appliedKitIds || []).includes(kit.id)
    const result = applyKitToRoom(room, kit)
    onUpdateRoom(room.id, result.room)
    setExpandedRooms((prev) => new Set([...prev, room.id]))
    // Auto-acquire kit on apply
    if (onAcquireKit && !ownedKitIds.includes(kit.id)) {
      onAcquireKit(kit.id)
    }
    const toastMsg = isResync
      ? `Re-synced "${kit.label}" in ${room.name} (+${result.addedOptionCount} options)`
      : `Applied "${kit.label}" to ${room.name} (+${result.addedDecisionCount} decisions, +${result.addedOptionCount} options)`
    setToast({ message: toastMsg, kitId: kit.id, roomId: room.id })
    setTimeout(() => setToast(null), 8000)
  }

  function handleRemoveKit(kitId: string) {
    // Remove kit from the active room (uses destination picker room or modal's room)
    const roomId = destPickerRoomId || ideasModalRoomId
    const room = roomId ? rooms.find((r) => r.id === roomId) : null
    if (!room) return
    const updated = removeKitFromRoom(room, kitId)
    onUpdateRoom(room.id, updated)
    const kit = kits.find((k) => k.id === kitId)
    setSimpleToast(`Removed "${kit?.label || 'pack'}" from ${room.name}`)
    setTimeout(() => setSimpleToast(null), 4000)
  }

  function handleUndoKit() {
    if (!toast) return
    const room = rooms.find((r) => r.id === toast.roomId)
    if (!room) return
    const updated = removeKitFromRoom(room, toast.kitId)
    onUpdateRoom(room.id, updated)
    setToast(null)
    setSimpleToast(`Removed pack from ${room.name}`)
    setTimeout(() => setSimpleToast(null), 3000)
  }

  const ideasModalRoom = ideasModalRoomId ? rooms.find((r) => r.id === ideasModalRoomId) : null

  return (
    <>
      {/* Onboarding — only for new users with zero rooms */}
      {!readOnly && !hasRooms && (
        <OnboardingView
          onBatchCreate={onBatchAddRooms}
          onRequestPackChooser={() => setPendingPackChooser(true)}
          defaultDecisions={defaultDecisions}
        />
      )}

      {/* Tracker UI — only when rooms exist */}
      {hasRooms && (
        <>
          {/* First success card — shown once after onboarding creates rooms */}
          {showFirstSuccess && !readOnly && (
            <div className="bg-basalt-50 rounded-card p-6 mb-6 border border-cream/10">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif text-lg text-sandstone mb-1">Your boards are ready!</h3>
                  <p className="text-sm text-cream/50 mb-4">
                    {rooms.length} {rooms.length === 1 ? 'room' : 'rooms'} created
                    {rooms.reduce((sum, r) => sum + r.decisions.length, 0) > 0 &&
                      ` with ${rooms.reduce((sum, r) => sum + r.decisions.length, 0)} decisions`
                    }
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowFirstSuccess(false)
                        openQuickAdd(rooms[0]?.id ?? null)
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-sandstone text-basalt font-medium text-sm rounded-lg hover:bg-sandstone-light transition-colors"
                    >
                      Add your first decision
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14m-7-7 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowFirstSuccess(false)}
                      className="text-xs text-cream/40 hover:text-cream/70 transition-colors"
                    >
                      Explore on your own
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Toolbar row: Search + ⓘ + View toggle + Sort + Packs + Expand/Collapse */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <Input
                placeholder="Search all rooms and decisions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {/* Save to HHC info icon */}
            {!readOnly && (
              <div className="relative" ref={saveInfoRef}>
                <button
                  type="button"
                  onClick={() => setSaveInfoOpen(!saveInfoOpen)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-cream/30 hover:text-sandstone hover:bg-cream/5 transition-colors shrink-0"
                  title="Save to HHC"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
                  </svg>
                </button>
                {saveInfoOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-72 bg-basalt-50 border border-cream/15 rounded-lg shadow-xl z-50 p-4">
                    <h4 className="text-sm font-medium text-cream mb-2">Save to HHC</h4>
                    <ul className="space-y-1.5 mb-3">
                      <li className="flex items-start gap-2 text-xs text-cream/50">
                        <span className="text-cream/25 mt-0.5">•</span>
                        Save images from any website into your boards.
                      </li>
                      <li className="flex items-start gap-2 text-xs text-cream/50">
                        <span className="text-cream/25 mt-0.5">•</span>
                        Install the Save to HHC bookmarklet for web.
                      </li>
                    </ul>
                    <div className="flex items-center gap-2">
                      <Link
                        href="/app/save-from-web"
                        onClick={() => setSaveInfoOpen(false)}
                        className="px-3 py-1.5 text-xs font-medium text-basalt bg-sandstone hover:bg-sandstone-light rounded-lg transition-colors"
                      >
                        Install bookmarklet
                      </Link>
                      <Link
                        href="/app/save-from-web"
                        onClick={() => setSaveInfoOpen(false)}
                        className="px-3 py-1.5 text-xs font-medium text-cream/50 hover:text-cream/70 transition-colors"
                      >
                        Learn more
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* View toggle */}
            <div className="flex bg-cream/5 rounded-lg p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-sandstone/20 text-sandstone'
                    : 'text-cream/40 hover:text-cream/60'
                }`}
                title="List view"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('boards')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === 'boards'
                    ? 'bg-sandstone/20 text-sandstone'
                    : 'text-cream/40 hover:text-cream/60'
                }`}
                title="Boards view"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </button>
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
              <div className="hidden md:block relative shrink-0" ref={packsPopoverRef}>
                <button
                  type="button"
                  onClick={() => setPacksPopoverOpen(!packsPopoverOpen)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-cream/70 hover:text-cream/90 bg-cream/10 hover:bg-cream/15 rounded-full transition-colors"
                >
                  ✨ Packs{ownedKitIds.length > 0 ? ` (${ownedKitIds.length})` : ''}
                </button>
                {packsPopoverOpen && (() => {
                  const featuredKit = kits[0]
                  const featuredOptionCount = featuredKit?.decisions.reduce((s, d) => s + d.options.length, 0) ?? 0
                  return (
                    <div className="absolute right-0 top-full mt-1.5 w-72 bg-basalt-50 border border-cream/15 rounded-lg shadow-xl z-50 p-4">
                      <h4 className="text-sm font-medium text-cream mb-0.5">Decision Packs</h4>
                      <p className="text-[11px] text-cream/40 mb-3">Curated ideas that help you choose faster.</p>
                      {ownedKitIds.length > 0 && (
                        <p className="text-[11px] text-cream/50 mb-2">My Packs ({ownedKitIds.length})</p>
                      )}
                      {featuredKit && (
                        <div className="flex items-center gap-2 px-2.5 py-2 bg-cream/5 rounded-lg mb-3">
                          <span className="text-sm">{emojiMap[featuredKit.id] || '✨'}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-cream/70 font-medium truncate">{featuredKit.label}</p>
                            <p className="text-[10px] text-cream/35">{featuredKit.decisions.length} decisions, {featuredOptionCount} options</p>
                          </div>
                        </div>
                      )}
                      <Link
                        href="/app/packs"
                        onClick={() => setPacksPopoverOpen(false)}
                        className="block w-full text-center px-3 py-1.5 text-xs font-medium text-basalt bg-sandstone hover:bg-sandstone-light rounded-lg transition-colors"
                      >
                        Browse Packs
                      </Link>
                    </div>
                  )
                })()}
              </div>
            )}
            {/* Expand/Collapse (desktop, list view only) */}
            {viewMode === 'list' && filteredRooms.filter((r) => !isGlobalUnsorted(r)).length > 1 && (
              <div className="hidden md:flex items-center gap-1 shrink-0 text-[11px]">
                <button type="button" onClick={expandAll} className="text-cream/40 hover:text-cream/70 transition-colors">Expand all</button>
                <span className="text-cream/15">|</span>
                <button type="button" onClick={collapseAll} className="text-cream/40 hover:text-cream/70 transition-colors">Collapse all</button>
              </div>
            )}
            {/* Search match count */}
            {searchQuery.trim() && (
              <span className="hidden md:inline text-[11px] text-cream/50 shrink-0">
                {filteredDecisions} match{filteredDecisions !== 1 ? 'es' : ''}
              </span>
            )}
          </div>

          {/* Summary strip */}
          {totalDecisions > 0 && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-cream/50 mb-3">
              {isFiltering && <span className="text-cream/30 italic">Filtered:</span>}
              {summaryStats.deciding + summaryStats.selected + summaryStats.ordered > 0 && (
                <span className="text-cream/70 font-medium">
                  {summaryStats.deciding + summaryStats.selected + summaryStats.ordered} Decisions Needed
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
                {filteredDecisions}/{totalDecisions}
              </span>
            )}
          </div>

          {/* Desktop filter rows */}
          <div className="hidden md:block mb-4 space-y-2">
            {/* Row 1: Room filters */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-cream/30 mr-1">Room</span>
              <button
                onClick={() => setRoomFilter(null)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  roomFilter === null
                    ? 'bg-sandstone/20 text-sandstone ring-1 ring-sandstone/40'
                    : 'bg-cream/10 text-cream/60 hover:text-cream/80'
                }`}
              >
                All
              </button>
              {rooms.filter((r) => !isGlobalUnsorted(r)).map((room) => (
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
              {isFiltering && (
                <span className="text-[11px] text-cream/50 ml-auto">
                  {filteredDecisions}/{totalDecisions}
                </span>
              )}
            </div>

            {/* Row 2: Status filters */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-cream/30 mr-1">Status</span>
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
            </div>
          </div>

          {/* Content */}
          {sortedFilteredRooms.length === 0 ? (
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
          ) : viewMode === 'boards' ? (
            <RoomsBoardView
              rooms={sortedFilteredRooms}
              onUpdateRoom={onUpdateRoom}
              onQuickAdd={(roomId) => openQuickAdd(roomId)}
              onAddRoom={() => setAddRoomOpen(true)}
              readOnly={readOnly}
            />
          ) : (
            <div className="space-y-2">
              {sortedFilteredRooms.map((room) =>
                isGlobalUnsorted(room) ? (
                  <GlobalUnsortedRow key={room.id} room={room} />
                ) : (
                  <RoomSection
                    key={room.id}
                    room={room}
                    isExpanded={expandedRooms.has(room.id)}
                    onToggleExpand={() => toggleRoom(room.id)}
                    onUpdateRoom={(updates) => onUpdateRoom(room.id, updates)}
                    onDeleteRoom={() => onDeleteRoom(room.id)}
                    onQuickAdd={() => openQuickAdd(room.id)}
                    onAddIdeasPack={() => {
                      setIdeasModalDestPicker(false)
                      setDestPickerRoomId(null)
                      setIdeasModalRoomId(room.id)
                    }}
                    readOnly={readOnly}
                    availableKitCount={findKitsForRoomType(kits, room.type as RoomTypeV3).length}
                    defaultDecisions={defaultDecisions}
                    emojiMap={emojiMap}
                  />
                )
              )}
              {/* Add Room row */}
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => setAddRoomOpen(true)}
                  className="hidden md:flex w-full items-center justify-center gap-2 px-4 py-3 bg-basalt-50/50 rounded-card border-2 border-dashed border-cream/15 hover:border-sandstone/40 transition-all cursor-pointer group"
                >
                  <svg className="w-4 h-4 text-cream/30 group-hover:text-sandstone transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                  <span className="text-sm font-medium text-cream/40 group-hover:text-sandstone transition-colors">Add a Room</span>
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Mobile FAB — Add a Room */}
      {hasRooms && !readOnly && (
        <button
          type="button"
          onClick={() => setAddRoomOpen(true)}
          className="md:hidden fixed bottom-8 right-8 w-14 h-14 bg-sandstone rounded-full shadow-lg z-40 flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Add a room"
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
                  {rooms.filter((r) => !isGlobalUnsorted(r)).map((room) => (
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

              {/* Sort */}
              <div>
                <label className="block text-sm text-cream/70 mb-2">Sort rooms by</label>
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
                  <Link
                    href="/app/packs"
                    onClick={() => setFilterSheetOpen(false)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-cream/70 bg-cream/5 rounded-lg transition-colors"
                  >
                    ✨ Packs{ownedKitIds.length > 0 ? ` (${ownedKitIds.length})` : ''}
                  </Link>
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

      {/* Add Room Modal */}
      {addRoomOpen && (
        <AddRoomModal
          onClose={() => setAddRoomOpen(false)}
          onAdd={(type, name, useDefaults) => {
            onBatchAddRooms([{ type, name, template: useDefaults ? 'standard' : 'none' }])
            const defaultCount = (defaultDecisions[type] || []).length
            const msg = useDefaults && defaultCount > 0
              ? `"${name}" added with ${defaultCount} suggested decisions — edit anytime`
              : `"${name}" added`
            setSimpleToast(msg)
            setTimeout(() => setSimpleToast(null), 4000)
          }}
          existingRooms={rooms}
        />
      )}

      {/* Ideas Pack Modal */}
      {ideasModalRoom && (
        <IdeasPackModal
          roomType={ideasModalRoom.type as RoomTypeV3}
          roomName={ideasModalRoom.name}
          appliedKitIds={ideasModalRoom.appliedKitIds || []}
          ownedKitIds={ownedKitIds}
          onApply={handleApplyKit}
          onAcquireKit={onAcquireKit}
          onRemoveKit={handleRemoveKit}
          onClose={() => {
            setIdeasModalRoomId(null)
            setIdeasModalDestPicker(false)
            setDestPickerRoomId(null)
          }}
          kits={kits}
          rooms={rooms}
          showDestinationPicker={ideasModalDestPicker}
          selectedRoomId={destPickerRoomId || ideasModalRoomId || undefined}
          onSelectRoomId={(id) => setDestPickerRoomId(id)}
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
