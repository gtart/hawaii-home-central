'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Input } from '@/components/ui/Input'
import {
  STATUS_CONFIG_V3,
  type RoomV3,
  type DecisionV3,
  type StatusV3,
  type RoomSelection,
  type SelectionComment,
} from '@/data/finish-decisions'
import type { RoomTypeV3 } from '@/data/finish-decisions'
import type { FinishDecisionKit } from '@/data/finish-decision-kits'
import { findKitsForRoomType } from '@/lib/finish-decision-kits'
import { applyKitToRoom, removeKitFromRoom } from '@/lib/finish-decision-kits'
import { displayUrl } from '@/lib/finishDecisionsImages'
import { OnboardingView } from './OnboardingView'
import { IdeasPackModal } from './IdeasPackModal'
import { buildDecisionHref } from '../lib/routing'

function getDecisionThumb(decision: DecisionV3): string | null {
  // 1. Final/selected option hero image
  const sel = decision.options.find((o) => o.isSelected)
  if (sel) {
    if (sel.images && sel.images.length > 0) {
      const hero = sel.heroImageId ? sel.images.find((img) => img.id === sel.heroImageId) : null
      const url = hero?.thumbnailUrl || hero?.url || sel.images[0].thumbnailUrl || sel.images[0].url
      if (url) return displayUrl(url)
    }
    if (sel.thumbnailUrl || sel.imageUrl) return displayUrl(sel.thumbnailUrl || sel.imageUrl || '')
  }
  // 2. Most recent option with an image (hero first)
  for (let i = decision.options.length - 1; i >= 0; i--) {
    const opt = decision.options[i]
    if (opt.images && opt.images.length > 0) {
      const hero = opt.heroImageId ? opt.images.find((img) => img.id === opt.heroImageId) : null
      const url = hero?.thumbnailUrl || hero?.url || opt.images[0].thumbnailUrl || opt.images[0].url
      return url ? displayUrl(url) : null
    }
    if (opt.thumbnailUrl || opt.imageUrl) return displayUrl(opt.thumbnailUrl || opt.imageUrl || '')
  }
  return null
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

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
  collectionId,
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
  collectionId?: string
}) {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilters, setStatusFilters] = useState<StatusV3[]>([])
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [ideasModalOpen, setIdeasModalOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; kitId: string; roomId: string } | null>(null)
  const [simpleToast, setSimpleToast] = useState<string | null>(null)
  const [addInputValue, setAddInputValue] = useState('')
  const [addInputVisible, setAddInputVisible] = useState(false)
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({})
  const [replyOpenId, setReplyOpenId] = useState<string | null>(null)

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

  function handleInlineComment(decisionId: string) {
    const text = (replyTexts[decisionId] || '').trim()
    if (!text || !room) return
    const comment: SelectionComment = {
      id: `cmt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      text,
      authorName: session?.user?.name || 'Unknown',
      authorEmail: session?.user?.email || '',
      createdAt: new Date().toISOString(),
    }
    const updated = room.decisions.map((d) =>
      d.id === decisionId
        ? { ...d, comments: [...(d.comments || []), comment] }
        : d
    )
    onUpdateRoom(room.id, { decisions: updated, updatedAt: new Date().toISOString() })
    setReplyTexts((prev) => ({ ...prev, [decisionId]: '' }))
    setReplyOpenId(null)
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
          <p className="text-cream/50">This list doesn&apos;t have any selections yet.</p>
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
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
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
            <>
              {/* ── Desktop: table layout ── */}
              <table className="hidden md:table w-full border-collapse">
                <thead>
                  <tr className="text-[11px] text-cream/40 uppercase tracking-wider">
                    <th className="text-left font-medium pb-2 pl-2 w-12" />
                    <th className="text-left font-medium pb-2">Selection</th>
                    <th className="text-left font-medium pb-2 w-28">Location</th>
                    <th className="text-left font-medium pb-2 w-24">Status</th>
                    <th className="text-left font-medium pb-2">Specs</th>
                    <th className="text-left font-medium pb-2 w-28">Updated</th>
                    <th className="text-left font-medium pb-2">Last comment</th>
                    <th className="w-8 pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {sortedDecisions.map((decision) => {
                    const config = STATUS_CONFIG_V3[decision.status]
                    const thumbUrl = getDecisionThumb(decision)
                    const selectedOption = decision.options.find((o) => o.isSelected)
                    const userComments = (decision.comments || []).filter((c) => c.authorEmail !== '')
                    const lastComment = userComments.length > 0 ? userComments[userComments.length - 1] : null

                    return (
                      <tr key={decision.id} className="group border-t border-cream/5 first:border-t-0 hover:bg-cream/[0.02] transition-colors">
                        <td className="py-2.5 pl-2">
                          <Link href={buildDecisionHref({ decisionId: decision.id, collectionId })}>
                            {thumbUrl ? (
                              <img src={thumbUrl} alt="" className="w-9 h-9 rounded object-cover" loading="lazy" />
                            ) : (
                              <div className="w-9 h-9 rounded bg-cream/5 flex items-center justify-center">
                                <svg className="w-4 h-4 text-cream/15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                  <rect x="3" y="3" width="18" height="18" rx="2" />
                                  <circle cx="8.5" cy="8.5" r="1.5" />
                                  <path d="M21 15l-5-5L5 21" />
                                </svg>
                              </div>
                            )}
                          </Link>
                        </td>
                        <td className="py-2.5 pr-3">
                          <Link href={buildDecisionHref({ decisionId: decision.id, collectionId })} className="block">
                            <span className="text-sm font-medium text-cream group-hover:text-sandstone transition-colors">{decision.title}</span>
                            {decision.options.length > 0 && (
                              <span className="text-[11px] text-cream/30 ml-2">{decision.options.length} option{decision.options.length !== 1 ? 's' : ''}</span>
                            )}
                          </Link>
                        </td>
                        <td className="py-2.5 pr-3 text-[11px] text-cream/40 truncate max-w-[120px]">
                          {decision.location || '—'}
                        </td>
                        <td className="py-2.5 pr-3">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-medium ${config.pillClass}`}>
                            {config.label}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3 text-[11px] text-cream/40 max-w-[200px]">
                          {selectedOption?.notes ? (
                            <span className="line-clamp-2 whitespace-pre-wrap">{selectedOption.notes}</span>
                          ) : (
                            <span className="text-cream/20">—</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-3 text-[11px] text-cream/40">
                          {relativeTime(decision.updatedAt)}
                        </td>
                        <td className="py-2.5 pr-3">
                          {lastComment ? (
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div className="w-4 h-4 rounded-full bg-sandstone/20 text-sandstone text-[9px] font-bold flex items-center justify-center shrink-0">
                                {lastComment.authorName.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-[11px] text-cream/50 truncate max-w-[200px]">{lastComment.text}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-cream/20">—</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-2">
                          <Link href={buildDecisionHref({ decisionId: decision.id, collectionId })}>
                            <svg className="w-4 h-4 text-cream/15 group-hover:text-cream/40 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* ── Mobile: card layout ── */}
              <div className="md:hidden space-y-1.5">
                {sortedDecisions.map((decision) => {
                  const config = STATUS_CONFIG_V3[decision.status]
                  const selectedOption = decision.options.find((o) => o.isSelected)
                  const thumbUrl = getDecisionThumb(decision)
                  const comments = (decision.comments || []).filter((c) => c.authorEmail !== '')
                  const commentCount = comments.length
                  const lastComment = commentCount > 0 ? comments[comments.length - 1] : null
                  const today = new Date().toISOString().slice(0, 10)
                  const isOverdue = decision.dueDate && decision.dueDate < today && decision.status !== 'done'
                  const isReplyOpen = replyOpenId === decision.id

                  return (
                    <div key={decision.id} className="bg-basalt-50 rounded-lg border border-cream/10 hover:border-sandstone/30 transition-colors">
                      <Link
                        href={buildDecisionHref({ decisionId: decision.id, collectionId })}
                        className="flex items-center gap-3 px-4 py-3 group"
                      >
                        {thumbUrl ? (
                          <img src={thumbUrl} alt="" className="w-10 h-10 rounded object-cover shrink-0" loading="lazy" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-cream/5 shrink-0 flex items-center justify-center">
                            <svg className="w-4 h-4 text-cream/15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <rect x="3" y="3" width="18" height="18" rx="2" />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                              <path d="M21 15l-5-5L5 21" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="text-sm font-medium text-cream truncate">{decision.title}</h4>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-medium shrink-0 ${config.pillClass}`}>
                              {config.label}
                            </span>
                          </div>
                          {decision.location && (
                            <p className="text-[11px] text-cream/35 truncate">{decision.location}</p>
                          )}
                          {selectedOption ? (
                            <>
                              <p className="text-[11px] text-sandstone/70 truncate mb-0.5">
                                Picked: {selectedOption.name}
                                {selectedOption.price ? ` · ${selectedOption.price}` : ''}
                              </p>
                              {selectedOption.notes && (
                                <p className="text-[11px] text-cream/35 line-clamp-1 mb-0.5">{selectedOption.notes}</p>
                              )}
                            </>
                          ) : null}
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-cream/40">
                            {decision.options.length > 0 && (
                              <span>{decision.options.length} option{decision.options.length !== 1 ? 's' : ''}</span>
                            )}
                            {commentCount > 0 && (
                              <span className="inline-flex items-center gap-0.5">
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                                </svg>
                                {commentCount}
                              </span>
                            )}
                            {decision.dueDate && (
                              <span className={isOverdue ? 'text-red-400' : ''}>
                                {isOverdue ? 'Overdue: ' : 'Due '}
                                {new Date(decision.dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                            <span>Updated {relativeTime(decision.updatedAt)}</span>
                          </div>
                        </div>
                        <svg className="w-4 h-4 text-cream/20 group-hover:text-cream/40 transition-colors shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </Link>

                      {(lastComment || isReplyOpen) && (
                        <div className="px-4 pb-3 border-t border-cream/5">
                          {lastComment && (
                            <div className="pt-2 flex items-start gap-2">
                              <div className="w-5 h-5 rounded-full bg-sandstone/20 text-sandstone text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {lastComment.authorName.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 text-[10px] text-cream/40">
                                  <span className="font-medium text-cream/60">{lastComment.authorName}</span>
                                  <span>{relativeTime(lastComment.createdAt)}</span>
                                </div>
                                <p className="text-[11px] text-cream/50 line-clamp-2 leading-relaxed">{lastComment.text}</p>
                              </div>
                              {!readOnly && !isReplyOpen && (
                                <button
                                  type="button"
                                  onClick={() => setReplyOpenId(decision.id)}
                                  className="text-[10px] text-sandstone/60 hover:text-sandstone transition-colors shrink-0 mt-0.5"
                                >
                                  Reply
                                </button>
                              )}
                            </div>
                          )}
                          {!readOnly && isReplyOpen && (
                            <div className="flex items-center gap-2 mt-2">
                              <input
                                type="text"
                                autoFocus
                                value={replyTexts[decision.id] || ''}
                                onChange={(e) => setReplyTexts((prev) => ({ ...prev, [decision.id]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleInlineComment(decision.id)
                                  if (e.key === 'Escape') setReplyOpenId(null)
                                }}
                                placeholder="Reply..."
                                className="flex-1 bg-basalt border border-cream/15 rounded px-2.5 py-1.5 text-[11px] text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50"
                              />
                              <button
                                type="button"
                                onClick={() => handleInlineComment(decision.id)}
                                disabled={!(replyTexts[decision.id] || '').trim()}
                                className="px-2.5 py-1.5 bg-sandstone text-basalt text-[11px] font-medium rounded hover:bg-sandstone-light transition-colors disabled:opacity-30"
                              >
                                Send
                              </button>
                            </div>
                          )}
                          {!lastComment && !readOnly && isReplyOpen && (
                            <p className="text-[10px] text-cream/30 mt-1">Leave a comment on this selection.</p>
                          )}
                        </div>
                      )}
                      {!lastComment && !isReplyOpen && !readOnly && (
                        <button
                          type="button"
                          onClick={() => setReplyOpenId(decision.id)}
                          className="w-full px-4 py-1.5 border-t border-cream/5 text-[10px] text-cream/25 hover:text-cream/40 transition-colors text-left"
                        >
                          + Add comment
                        </button>
                      )}
                    </div>
                  )
                })}

              </div>

              {/* Inline add selection */}
              {!readOnly && (
                addInputVisible ? (
                  <div className="flex gap-2 px-4 py-2 mt-2">
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
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 mt-2 bg-basalt-50/50 rounded-card border-2 border-dashed border-cream/15 hover:border-sandstone/40 transition-all cursor-pointer group"
                  >
                    <svg className="w-4 h-4 text-cream/30 group-hover:text-sandstone transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                    </svg>
                    <span className="text-sm font-medium text-cream/40 group-hover:text-sandstone transition-colors">Add a Selection</span>
                  </button>
                )
              )}
            </>
          )}

        </>
      )}

      {/* Mobile FAB — Add Selection */}
      {hasDecisions && !readOnly && (
        <button
          type="button"
          onClick={() => setAddInputVisible(true)}
          className="md:hidden fixed right-6 w-14 h-14 bg-sandstone rounded-full shadow-lg z-40 flex items-center justify-center active:scale-95 transition-transform"
          style={{ bottom: 'calc(var(--bottom-nav-offset, 3.5rem) + 1rem)' }}
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
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
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
