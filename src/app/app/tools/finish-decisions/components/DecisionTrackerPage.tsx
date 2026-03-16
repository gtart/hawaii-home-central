'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'
import {
  STATUS_CONFIG_V3,
  SELECTION_PRIORITY_CONFIG,
  type SelectionV4,
  type StatusV3,
  type SelectionPriority,
} from '@/data/finish-decisions'
import type { FinishDecisionKit } from '@/data/finish-decision-kits'
import { applyKitToWorkspace, removeKitFromWorkspace } from '@/lib/finish-decision-kits'
import { getUniqueTags, getUniqueLocations } from '@/lib/decisionHelpers'
import { displayUrl } from '@/lib/finishDecisionsImages'
import { OnboardingView } from './OnboardingView'
import { IdeasPackModal } from './IdeasPackModal'
import { TAG_SUGGESTIONS, LOCATION_SUGGESTIONS } from './TagInput'
import { buildDecisionHref } from '../lib/routing'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

function getDecisionThumb(decision: SelectionV4): string | null {
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

type SortKey = 'created' | 'updated' | 'due' | 'location'
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'created', label: 'Date added' },
  { key: 'updated', label: 'Recently updated' },
  { key: 'due', label: 'Next due date' },
  { key: 'location', label: 'Location' },
]

export function DecisionTrackerPage({
  selections,
  onUpdateSelections,
  onAcquireKit,
  onAddSelection,
  readOnly = false,
  kits = [],
  emojiMap = {},
  ownedKitIds = [],
  appliedKitIds = [],
  onUpdateAppliedKitIds,
  collectionId,
  projectId,
  commentCounts,
  commentLatestAt,
  selectionVisited,
}: {
  selections: SelectionV4[]
  onUpdateSelections: (selections: SelectionV4[]) => void
  onAcquireKit?: (kitId: string) => void
  onAddSelection: (title: string) => void
  readOnly?: boolean
  kits?: FinishDecisionKit[]
  emojiMap?: Record<string, string>
  ownedKitIds?: string[]
  appliedKitIds?: string[]
  onUpdateAppliedKitIds?: (ids: string[]) => void
  collectionId?: string
  projectId?: string
  commentCounts?: Map<string, number>
  commentLatestAt?: Map<string, string>
  selectionVisited?: { hasUnread: (selectionId: string, latestAt: string | undefined | null) => boolean }
}) {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilters, setStatusFilters] = useState<StatusV3[]>(() => {
    const p = searchParams.get('status')
    if (!p) return []
    const valid: StatusV3[] = ['deciding', 'selected', 'ordered', 'done']
    return p.split(',').filter((s): s is StatusV3 => valid.includes(s as StatusV3))
  })
  const [tagFilters, setTagFilters] = useState<string[]>([])
  const [locationFilters, setLocationFilters] = useState<string[]>([])
  const [groupBy, setGroupBy] = useState<'none' | 'tag' | 'location' | 'status' | 'priority'>('none')
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [viewMenuOpen, setViewMenuOpen] = useState(false)
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [ideasModalOpen, setIdeasModalOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; kitId: string } | null>(null)
  const [simpleToast, setSimpleToast] = useState<string | null>(null)
  const [addInputValue, setAddInputValue] = useState('')
  const [addInputVisible, setAddInputVisible] = useState(false)

  // Bulk select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkMenuOpen, setBulkMenuOpen] = useState<'status' | 'location' | 'tags' | 'priority' | null>(null)
  const [bulkTagInput, setBulkTagInput] = useState('')
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)
  const [bulkToast, setBulkToast] = useState<string | null>(null)

  const [sortKey, setSortKey] = useState<SortKey>(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(SORT_KEY) : null
      return (stored as SortKey) || 'created'
    } catch { return 'created' }
  })

  useEffect(() => {
    try { localStorage.setItem(SORT_KEY, sortKey) } catch { /* ignore */ }
  }, [sortKey])

  // Flat selections (V4 — no room wrapper)
  const hasDecisions = selections.length > 0

  // Toggle a status filter chip
  const toggleStatusFilter = (status: StatusV3) => {
    setStatusFilters((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    )
  }

  // Filter selections by search query and status
  const filteredDecisions = useMemo(() => {
    let result = [...selections]

    if (statusFilters.length > 0) {
      result = result.filter((d) => statusFilters.includes(d.status))
    }

    if (tagFilters.length > 0) {
      result = result.filter((d) =>
        tagFilters.some((tag) => d.tags.includes(tag))
      )
    }

    if (locationFilters.length > 0) {
      result = result.filter((d) =>
        d.location && locationFilters.includes(d.location)
      )
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((decision) => {
        const searchable = [
          decision.title,
          decision.notes,
          decision.location || '',
          ...decision.tags,
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
  }, [selections, searchQuery, statusFilters, tagFilters, locationFilters])

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
        case 'location': {
          const aLoc = (a.location || '').toLowerCase()
          const bLoc = (b.location || '').toLowerCase()
          if (!aLoc && !bLoc) return 0
          if (!aLoc) return 1
          if (!bLoc) return -1
          return aLoc.localeCompare(bLoc)
        }
        default:
          return 0
      }
    })
  }, [filteredDecisions, sortKey])

  // Bulk select helpers
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set())
    setBulkMenuOpen(null)
  }, [])

  const uniqueLocations = useMemo(() => {
    const fromData = getUniqueLocations(selections)
    const all = new Set([...fromData, ...LOCATION_SUGGESTIONS])
    return Array.from(all).sort()
  }, [selections])

  // Locations actually used in data (for filter chips — only show locations that exist)
  const usedLocations = useMemo(() => getUniqueLocations(selections), [selections])

  // Location counts for filter chips
  const locationCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const d of selections) {
      if (d.location) {
        counts[d.location] = (counts[d.location] || 0) + 1
      }
    }
    return counts
  }, [selections])

  const toggleLocationFilter = (loc: string) => {
    setLocationFilters((prev) =>
      prev.includes(loc)
        ? prev.filter((l) => l !== loc)
        : [...prev, loc]
    )
  }

  // Total stats
  const isFiltering = searchQuery.trim() !== '' || statusFilters.length > 0 || tagFilters.length > 0 || locationFilters.length > 0

  const summaryStats = useMemo(() => {
    const source = isFiltering ? filteredDecisions : selections
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
  }, [selections, filteredDecisions, isFiltering])

  // Status counts for filter chips (from all decisions, not filtered)
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const [status] of Object.entries(STATUS_CONFIG_V3)) {
      counts[status] = selections.filter((d) => d.status === status).length
    }
    return counts
  }, [selections])

  // All unique tags across selections (for filter chips)
  const allTags = useMemo(() => getUniqueTags(selections), [selections])

  // Tag counts for filter chips
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const d of selections) {
      for (const tag of d.tags) {
        counts[tag] = (counts[tag] || 0) + 1
      }
    }
    return counts
  }, [selections])

  const toggleTagFilter = (tag: string) => {
    setTagFilters((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    )
  }

  const activeFilterCount = statusFilters.length + tagFilters.length + locationFilters.length

  // Group-by computation
  const groupedSections = useMemo(() => {
    if (groupBy === 'none') return null

    const groups = new Map<string, SelectionV4[]>()

    for (const d of sortedDecisions) {
      if (groupBy === 'tag') {
        if (d.tags.length === 0) {
          const key = 'Unlabeled'
          if (!groups.has(key)) groups.set(key, [])
          groups.get(key)!.push(d)
        } else {
          for (const tag of d.tags) {
            if (!groups.has(tag)) groups.set(tag, [])
            groups.get(tag)!.push(d)
          }
        }
      } else if (groupBy === 'location') {
        const key = d.location || 'No location'
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key)!.push(d)
      } else if (groupBy === 'status') {
        const label = STATUS_CONFIG_V3[d.status]?.label || d.status
        if (!groups.has(label)) groups.set(label, [])
        groups.get(label)!.push(d)
      } else if (groupBy === 'priority') {
        const label = d.priority
          ? SELECTION_PRIORITY_CONFIG[d.priority]?.label || d.priority
          : 'No priority'
        if (!groups.has(label)) groups.set(label, [])
        groups.get(label)!.push(d)
      }
    }

    return Array.from(groups.entries())
  }, [sortedDecisions, groupBy])

  // Pack handlers
  function handleApplyKit(kit: FinishDecisionKit) {
    const isResync = appliedKitIds.includes(kit.id)
    const result = applyKitToWorkspace(selections, appliedKitIds, kit)
    onUpdateSelections(result.selections)
    onUpdateAppliedKitIds?.(result.appliedKitIds)
    if (onAcquireKit && !ownedKitIds.includes(kit.id)) {
      onAcquireKit(kit.id)
    }
    const toastMsg = isResync
      ? `Re-synced "${kit.label}" (+${result.addedOptionCount} options)`
      : `Applied "${kit.label}" (+${result.addedSelectionCount} selections, +${result.addedOptionCount} options)`
    setToast({ message: toastMsg, kitId: kit.id })
    setTimeout(() => setToast(null), 8000)
  }

  function handleRemoveKit(kitId: string) {
    const result = removeKitFromWorkspace(selections, appliedKitIds, kitId)
    onUpdateSelections(result.selections)
    onUpdateAppliedKitIds?.(result.appliedKitIds)
    const kit = kits.find((k) => k.id === kitId)
    setSimpleToast(`Removed "${kit?.label || 'pack'}"`)
    setTimeout(() => setSimpleToast(null), 4000)
  }

  function handleUndoKit() {
    if (!toast) return
    const result = removeKitFromWorkspace(selections, appliedKitIds, toast.kitId)
    onUpdateSelections(result.selections)
    onUpdateAppliedKitIds?.(result.appliedKitIds)
    setToast(null)
    setSimpleToast('Removed pack')
    setTimeout(() => setSimpleToast(null), 3000)
  }

  function handleOpenPackChooser() {
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
        <div className="bg-stone rounded-card p-8 text-center">
          <p className="text-cream/65">No selection boards have been created yet.</p>
        </div>
      )}

      {/* Main content — when decisions exist */}
      {hasDecisions && (
        <>
          {/* ── Toolbar: Search + Add + More ── */}
          <div className="flex items-center gap-2 mb-4">
            {/* Add Selection — primary CTA */}
            {!readOnly && (
              <button
                type="button"
                onClick={() => setAddInputVisible(true)}
                className="inline-flex items-center gap-1.5 h-9 px-4 text-sm font-medium rounded-lg bg-sandstone text-basalt hover:bg-sandstone-light transition-colors shrink-0"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                <span className="hidden sm:inline">New Selection</span>
              </button>
            )}
            <div className="flex-1 min-w-0">
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {/* More menu (desktop) — filters, sort, group */}
            <div className="hidden md:block relative shrink-0">
              <button
                type="button"
                onClick={() => setViewMenuOpen(!viewMenuOpen)}
                className={`inline-flex items-center gap-1.5 h-9 px-3 text-xs font-medium rounded-lg border transition-colors ${
                  activeFilterCount > 0
                    ? 'bg-sandstone/10 text-sandstone border-sandstone/30'
                    : 'bg-stone-200 text-cream/65 hover:text-cream/80 border-cream/15'
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" y1="21" x2="4" y2="14" strokeLinecap="round" />
                  <line x1="4" y1="10" x2="4" y2="3" strokeLinecap="round" />
                  <line x1="12" y1="21" x2="12" y2="12" strokeLinecap="round" />
                  <line x1="12" y1="8" x2="12" y2="3" strokeLinecap="round" />
                  <line x1="20" y1="21" x2="20" y2="16" strokeLinecap="round" />
                  <line x1="20" y1="12" x2="20" y2="3" strokeLinecap="round" />
                  <line x1="1" y1="14" x2="7" y2="14" strokeLinecap="round" />
                  <line x1="9" y1="8" x2="15" y2="8" strokeLinecap="round" />
                  <line x1="17" y1="16" x2="23" y2="16" strokeLinecap="round" />
                </svg>
                Sort &amp; Filter
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 bg-sandstone text-basalt text-[10px] font-bold rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              {viewMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setViewMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-40 w-56 bg-stone border border-cream/15 rounded-xl shadow-lg p-3 space-y-3">
                    {/* Sort */}
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-cream/55 font-medium">Sort by</span>
                      <div className="mt-1.5 space-y-0.5">
                        {SORT_OPTIONS.map((opt) => (
                          <button
                            key={opt.key}
                            onClick={() => { setSortKey(opt.key); setViewMenuOpen(false) }}
                            className={`w-full text-left px-2 py-1 text-xs rounded transition-colors ${
                              sortKey === opt.key ? 'bg-sandstone/15 text-sandstone font-medium' : 'text-cream/70 hover:text-cream/90 hover:bg-stone-hover'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Group */}
                    <div className="border-t border-cream/15 pt-2">
                      <span className="text-[10px] uppercase tracking-wider text-cream/55 font-medium">Group by</span>
                      <div className="mt-1.5 space-y-0.5">
                        {[
                          { key: 'none', label: 'None' },
                          { key: 'tag', label: 'Label' },
                          { key: 'location', label: 'Location' },
                          { key: 'status', label: 'Status' },
                          { key: 'priority', label: 'Priority' },
                        ].map((opt) => (
                          <button
                            key={opt.key}
                            onClick={() => { setGroupBy(opt.key as typeof groupBy); setViewMenuOpen(false) }}
                            className={`w-full text-left px-2 py-1 text-xs rounded transition-colors ${
                              groupBy === opt.key ? 'bg-sandstone/15 text-sandstone font-medium' : 'text-cream/70 hover:text-cream/90 hover:bg-stone-hover'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Quick status filters */}
                    <div className="border-t border-cream/15 pt-2">
                      <span className="text-[10px] uppercase tracking-wider text-cream/55 font-medium">Filter by status</span>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {(Object.entries(STATUS_CONFIG_V3) as [StatusV3, (typeof STATUS_CONFIG_V3)[StatusV3]][]).map(
                          ([status, config]) => {
                            const isActive = statusFilters.includes(status)
                            const count = statusCounts[status] ?? 0
                            if (count === 0 && !isActive) return null
                            return (
                              <button
                                key={status}
                                onClick={() => toggleStatusFilter(status)}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                                  isActive
                                    ? 'bg-sandstone/30 text-sandstone ring-1 ring-sandstone/50'
                                    : 'bg-cream/10 text-cream/70 hover:text-cream/90'
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
                    {/* Quick tag filters (if tags exist) */}
                    {allTags.length > 0 && (
                      <div className="border-t border-cream/15 pt-2">
                        <span className="text-[10px] uppercase tracking-wider text-cream/55 font-medium">Filter by label</span>
                        <div className="mt-1.5 flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                          {allTags.map((tag) => {
                            const isActive = tagFilters.includes(tag)
                            return (
                              <button
                                key={tag}
                                onClick={() => toggleTagFilter(tag)}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                                  isActive
                                    ? 'bg-sandstone/30 text-sandstone ring-1 ring-sandstone/50'
                                    : 'bg-cream/10 text-cream/70 hover:text-cream/90'
                                }`}
                              >
                                {tag}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    {/* Clear filters */}
                    {activeFilterCount > 0 && (
                      <div className="border-t border-cream/15 pt-2">
                        <button
                          onClick={() => { setStatusFilters([]); setTagFilters([]); setLocationFilters([]); setViewMenuOpen(false) }}
                          className="text-xs text-sandstone hover:text-sandstone-light transition-colors"
                        >
                          Clear all filters
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Inline add selection — shown at top when triggered */}
          {!readOnly && addInputVisible && (
            <div className="flex gap-2 mb-4 bg-stone rounded-xl p-3 border border-cream/15">
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
                placeholder="What do you need to choose? e.g. Countertop, Faucet, Tile"
                className="flex-1 bg-basalt border border-cream/15 rounded-lg px-3 py-2 text-sm text-cream placeholder:text-cream/45 focus:outline-none focus:border-sandstone/50"
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
          )}

          {/* Compact summary — only shown when useful */}
          {selections.length > 3 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-cream/50 mb-3">
              {isFiltering && (
                <span className="text-cream/45 italic">
                  {filteredDecisions.length} of {selections.length}
                </span>
              )}
              {!isFiltering && summaryStats.deciding + summaryStats.selected + summaryStats.ordered > 0 && (
                <span>
                  {summaryStats.deciding + summaryStats.selected + summaryStats.ordered} still deciding
                </span>
              )}
              {summaryStats.done > 0 && <span>{summaryStats.done} done</span>}
              {summaryStats.overdue > 0 && (
                <span className="text-red-400">{summaryStats.overdue} overdue</span>
              )}
            </div>
          )}

          {/* Active filter pills (desktop) — shown inline when any filter is active */}
          {activeFilterCount > 0 && (
            <div className="hidden md:flex flex-wrap items-center gap-1.5 mb-3">
              {statusFilters.map((status) => (
                <button
                  key={status}
                  onClick={() => toggleStatusFilter(status)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-sandstone/20 text-sandstone ring-1 ring-sandstone/30"
                >
                  {STATUS_CONFIG_V3[status].label}
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              ))}
              {tagFilters.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTagFilter(tag)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-sandstone/20 text-sandstone ring-1 ring-sandstone/30"
                >
                  {tag}
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              ))}
              {locationFilters.map((loc) => (
                <button
                  key={loc}
                  onClick={() => toggleLocationFilter(loc)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-sandstone/20 text-sandstone ring-1 ring-sandstone/30"
                >
                  {loc}
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              ))}
              <button
                onClick={() => { setStatusFilters([]); setTagFilters([]); setLocationFilters([]) }}
                className="text-[11px] text-cream/45 hover:text-cream/65 transition-colors"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Mobile filter bar */}
          <div className="flex md:hidden items-center gap-2 mb-4">
            <button
              onClick={() => setFilterSheetOpen(true)}
              className="relative inline-flex items-center gap-1.5 px-3 py-1.5 bg-cream/10 rounded-lg text-xs text-cream/80 hover:text-cream transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
              </svg>
              Sort &amp; Filter
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-sandstone text-basalt text-[10px] font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <div className="flex-1" />
            {isFiltering && (
              <span className="text-[11px] text-cream/65">
                {filteredDecisions.length}/{selections.length}
              </span>
            )}
          </div>

          {/* Location filters moved into Sort & Filter menu */}

          {/* Decision list */}
          {sortedDecisions.length === 0 ? (
            <div className="bg-stone rounded-card p-8 text-center">
              <p className="text-cream/65">
                No selections match your {searchQuery ? 'search' : 'filters'}.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilters([])
                  setTagFilters([])
                  setLocationFilters([])
                }}
                className="text-sandstone text-sm mt-2 hover:text-sandstone-light"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              {/* ── Desktop: clean board list ── */}
              <table className="hidden md:table w-full border-collapse">
                <thead>
                  <tr className="text-[11px] text-cream/45 uppercase tracking-wider">
                    {!readOnly && (
                      <th className="w-10 pb-2 pl-2 text-left">
                        <input
                          type="checkbox"
                          checked={selectedIds.size > 0 && selectedIds.size === sortedDecisions.length}
                          onChange={() => {
                            if (selectedIds.size === sortedDecisions.length) {
                              deselectAll()
                            } else {
                              setSelectedIds(new Set(sortedDecisions.map((d) => d.id)))
                            }
                          }}
                          className="accent-sandstone w-3.5 h-3.5 cursor-pointer"
                        />
                      </th>
                    )}
                    <th className="text-left font-medium pb-2 pl-2 w-12" />
                    <th className="text-left font-medium pb-2">Selection</th>
                    <th className="text-left font-medium pb-2 w-24">Status</th>
                    <th className="text-left font-medium pb-2 w-28">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {(groupedSections || [['', sortedDecisions] as [string, SelectionV4[]]]).map(([groupLabel, groupItems]) => {
                    const items = groupedSections ? groupItems : sortedDecisions
                    return (
                      <React.Fragment key={groupLabel || '__ungrouped'}>
                        {groupedSections && (
                          <tr>
                            <td colSpan={100} className="pt-4 pb-1">
                              <div className="flex items-center gap-2 border-b border-cream/15 pb-1">
                                <span className="text-xs font-medium text-cream/70">{groupLabel}</span>
                                <span className="text-[10px] text-cream/45">{items.length}</span>
                              </div>
                            </td>
                          </tr>
                        )}
                        {items.map((decision) => {
                    const config = STATUS_CONFIG_V3[decision.status]
                    const thumbUrl = getDecisionThumb(decision)
                    const selectedOption = decision.options.find((o) => o.isSelected)

                    return (
                      <tr
                        key={decision.id}
                        className="group border-t border-cream/10 first:border-t-0 hover:bg-stone-50 transition-colors"
                      >
                        {!readOnly && (
                          <td className="w-10 py-2.5 pl-2">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(decision.id)}
                              onChange={() => toggleSelect(decision.id)}
                              className="accent-sandstone w-3.5 h-3.5 cursor-pointer"
                            />
                          </td>
                        )}
                        <td className="py-2.5 pl-2">
                          <Link href={buildDecisionHref({ decisionId: decision.id, collectionId })}>
                            {thumbUrl ? (
                              <img src={thumbUrl} alt="" className="w-10 h-10 rounded-lg object-cover" loading="lazy" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-stone-200 flex items-center justify-center">
                                <span className="text-lg">{emojiMap[decision.title.toLowerCase()] || '📋'}</span>
                              </div>
                            )}
                          </Link>
                        </td>
                        <td className="py-2.5 pl-3 pr-3">
                          <Link href={buildDecisionHref({ decisionId: decision.id, collectionId })} className="block">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-cream group-hover:text-sandstone transition-colors">{decision.title}</span>
                              {decision.options.length > 0 && (
                                <span className="text-[11px] text-cream/40">{decision.options.length} option{decision.options.length !== 1 ? 's' : ''}</span>
                              )}
                              {commentCounts && (commentCounts.get(decision.id) || 0) > 0 && (() => {
                                const count = commentCounts.get(decision.id) || 0
                                const unread = selectionVisited?.hasUnread(decision.id, commentLatestAt?.get(decision.id))
                                return (
                                  <span className={`relative inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] ${unread ? 'bg-sandstone/15 text-sandstone' : 'bg-cream/8 text-cream/50'}`}>
                                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    {count}
                                    {unread && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-sandstone" />}
                                  </span>
                                )
                              })()}
                            </div>
                            {/* Picked option — prominent when set */}
                            {selectedOption && (
                              <p className="text-[11px] text-emerald-400/70 mt-0.5 truncate">
                                ✓ {selectedOption.name}
                                {selectedOption.price ? ` · ${selectedOption.price}` : ''}
                              </p>
                            )}
                            {/* Tags + location inline */}
                            {(decision.tags.length > 0 || decision.location) && (
                              <div className="flex flex-wrap items-center gap-1 mt-0.5">
                                {decision.tags.slice(0, 3).map((tag) => (
                                  <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-cream/8 text-cream/45">{tag}</span>
                                ))}
                                {decision.tags.length > 3 && <span className="text-[9px] text-cream/35">+{decision.tags.length - 3}</span>}
                                {decision.location && (
                                  <span className="text-[9px] text-cream/40 ml-1">{decision.location}</span>
                                )}
                              </div>
                            )}
                          </Link>
                        </td>
                        <td className="py-2.5 pr-3">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-medium ${config.pillClass}`}>
                            {config.label}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3 text-[11px] text-cream/45">
                          <Link href={buildDecisionHref({ decisionId: decision.id, collectionId })} className="hover:text-cream/65 transition-colors">
                            {relativeTime(decision.updatedAt)}
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>

              {/* ── Mobile: card layout ── */}
              <div className="md:hidden space-y-1.5">
                {(groupedSections || [['', sortedDecisions] as [string, SelectionV4[]]]).map(([groupLabel, groupItems]) => {
                  const mobileItems = groupedSections ? groupItems : sortedDecisions
                  return (
                    <React.Fragment key={groupLabel || '__ungrouped_mobile'}>
                      {groupedSections && (
                        <div className="flex items-center gap-2 pt-3 pb-1 border-b border-cream/15 mb-1.5">
                          <span className="text-xs font-medium text-cream/70">{groupLabel}</span>
                          <span className="text-[10px] text-cream/45">{mobileItems.length}</span>
                        </div>
                      )}
                {mobileItems.map((decision) => {
                  const config = STATUS_CONFIG_V3[decision.status]
                  const selectedOption = decision.options.find((o) => o.isSelected)
                  const thumbUrl = getDecisionThumb(decision)

                  return (
                    <div
                      key={decision.id}
                      className="bg-stone rounded-xl border border-cream/15 hover:border-sandstone/30 transition-colors"
                    >
                      <div className="flex items-center gap-0">
                        {!readOnly && (
                          <div className="pl-3 py-3 shrink-0">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(decision.id)}
                              onChange={() => toggleSelect(decision.id)}
                              className="accent-sandstone w-4 h-4 cursor-pointer"
                            />
                          </div>
                        )}
                      <Link
                        href={buildDecisionHref({ decisionId: decision.id, collectionId })}
                        className="flex items-center gap-3 px-4 py-3 group flex-1 min-w-0"
                      >
                        {thumbUrl ? (
                          <img src={thumbUrl} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0" loading="lazy" />
                        ) : (
                          <div className="w-11 h-11 rounded-lg bg-stone-200 shrink-0 flex items-center justify-center">
                            <span className="text-lg">{emojiMap[decision.title.toLowerCase()] || '📋'}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="text-sm font-medium text-cream truncate">{decision.title}</h4>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-medium shrink-0 ${config.pillClass}`}>
                              {config.label}
                            </span>
                          </div>
                          {selectedOption && (
                            <p className="text-[11px] text-emerald-400/70 truncate">
                              ✓ {selectedOption.name}
                              {selectedOption.price ? ` · ${selectedOption.price}` : ''}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-cream/45 mt-0.5">
                            {decision.options.length > 0 && (
                              <span>{decision.options.length} option{decision.options.length !== 1 ? 's' : ''}</span>
                            )}
                            <span>{relativeTime(decision.updatedAt)}</span>
                            {decision.tags.length > 0 && (
                              <span className="text-cream/35">{decision.tags.slice(0, 2).join(', ')}</span>
                            )}
                          </div>
                        </div>
                        <svg className="w-4 h-4 text-cream/25 group-hover:text-cream/50 transition-colors shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </Link>
                      </div>
                    </div>
                  )
                })}
                    </React.Fragment>
                  )
                })}
              </div>

            </>
          )}

        </>
      )}

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && !readOnly && (
        <div
          className="fixed left-0 right-0 z-40 bg-stone border-t border-cream/15 shadow-2xl px-4 py-3"
          style={{ bottom: 'calc(var(--bottom-nav-offset, 0rem))' }}
        >
          <div className="max-w-4xl mx-auto flex items-center gap-3 flex-wrap">
            <span className="text-sm text-cream/80 font-medium shrink-0">
              {selectedIds.size} selected
            </span>

            <div className="flex items-center gap-2 flex-wrap flex-1">
              {/* Status */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setBulkMenuOpen(bulkMenuOpen === 'status' ? null : 'status')}
                  className="text-xs px-3 py-1.5 rounded-lg bg-cream/8 text-cream/70 hover:bg-cream/12 hover:text-cream transition-colors"
                >
                  Status
                </button>
                {bulkMenuOpen === 'status' && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setBulkMenuOpen(null)} />
                    <div className="absolute bottom-full mb-1 left-0 bg-basalt border border-cream/15 rounded-lg shadow-xl z-20 py-1 min-w-[130px]">
                      {(['deciding', 'selected', 'ordered', 'done'] as StatusV3[]).map((s) => {
                        const cfg = STATUS_CONFIG_V3[s]
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              const idSet = selectedIds
                              const updated = selections.map((d) =>
                                idSet.has(d.id) ? { ...d, status: s, updatedAt: new Date().toISOString() } : d
                              )
                              onUpdateSelections(updated)
                              deselectAll()
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-cream/80 hover:bg-stone-hover transition-colors"
                          >
                            {cfg.label}
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Location */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setBulkMenuOpen(bulkMenuOpen === 'location' ? null : 'location')}
                  className="text-xs px-3 py-1.5 rounded-lg bg-cream/8 text-cream/70 hover:bg-cream/12 hover:text-cream transition-colors"
                >
                  Location
                </button>
                {bulkMenuOpen === 'location' && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setBulkMenuOpen(null)} />
                    <div className="absolute bottom-full mb-1 left-0 bg-basalt border border-cream/15 rounded-lg shadow-xl z-20 min-w-[180px] max-h-56 overflow-y-auto">
                      <div className="p-2 border-b border-cream/15">
                        <input
                          autoFocus
                          placeholder="Type location..."
                          className="w-full bg-basalt border border-cream/20 rounded px-2 py-1.5 text-xs text-cream placeholder:text-cream/45 focus:outline-none focus:border-sandstone/50"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                              const val = e.currentTarget.value.trim()
                              const idSet = selectedIds
                              const updated = selections.map((d) =>
                                idSet.has(d.id) ? { ...d, location: val, updatedAt: new Date().toISOString() } : d
                              )
                              onUpdateSelections(updated)
                              deselectAll()
                            }
                          }}
                        />
                      </div>
                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => {
                            const idSet = selectedIds
                            const updated = selections.map((d) =>
                              idSet.has(d.id) ? { ...d, location: '', updatedAt: new Date().toISOString() } : d
                            )
                            onUpdateSelections(updated)
                            deselectAll()
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-cream/55 italic hover:bg-stone-hover transition-colors"
                        >
                          Unassigned
                        </button>
                        {uniqueLocations.map((loc) => (
                          <button
                            key={loc}
                            type="button"
                            onClick={() => {
                              const idSet = selectedIds
                              const updated = selections.map((d) =>
                                idSet.has(d.id) ? { ...d, location: loc, updatedAt: new Date().toISOString() } : d
                              )
                              onUpdateSelections(updated)
                              deselectAll()
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-cream/80 hover:bg-stone-hover transition-colors"
                          >
                            {loc}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Labels */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setBulkMenuOpen(bulkMenuOpen === 'tags' ? null : 'tags'); setBulkTagInput('') }}
                  className="text-xs px-3 py-1.5 rounded-lg bg-cream/8 text-cream/70 hover:bg-cream/12 hover:text-cream transition-colors"
                >
                  Labels
                </button>
                {bulkMenuOpen === 'tags' && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setBulkMenuOpen(null)} />
                    <div className="absolute bottom-full mb-1 left-0 bg-basalt border border-cream/15 rounded-lg shadow-xl z-20 min-w-[200px] max-h-64 flex flex-col">
                      <div className="p-2 border-b border-cream/15">
                        <input
                          autoFocus
                          placeholder="Type to add label..."
                          value={bulkTagInput}
                          onChange={(e) => setBulkTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && bulkTagInput.trim()) {
                              const tag = bulkTagInput.trim()
                              const idSet = selectedIds
                              const updated = selections.map((d) => {
                                if (!idSet.has(d.id)) return d
                                if (d.tags.includes(tag)) return d
                                return { ...d, tags: [...d.tags, tag], updatedAt: new Date().toISOString() }
                              })
                              onUpdateSelections(updated)
                              setBulkTagInput('')
                            }
                          }}
                          className="w-full bg-basalt border border-cream/20 rounded px-2 py-1.5 text-xs text-cream placeholder:text-cream/45 focus:outline-none focus:border-sandstone/50"
                        />
                      </div>
                      <div className="py-1 overflow-y-auto">
                        {(() => {
                          // Compute which tags are shared by ALL selected, SOME selected, or NONE
                          const selectedSelections = selections.filter((d) => selectedIds.has(d.id))
                          const tagCounts = new Map<string, number>()
                          for (const s of selectedSelections) {
                            for (const t of s.tags) {
                              tagCounts.set(t, (tagCounts.get(t) || 0) + 1)
                            }
                          }
                          const totalSelected = selectedSelections.length
                          // Show all existing tags + suggestions, filtered by input
                          const allAvailable = Array.from(new Set([...allTags, ...TAG_SUGGESTIONS]))
                          const filtered = bulkTagInput.trim()
                            ? allAvailable.filter((t) => t.toLowerCase().includes(bulkTagInput.toLowerCase()))
                            : allAvailable
                          const showCreate = bulkTagInput.trim().length > 0 && !filtered.some((t) => t.toLowerCase() === bulkTagInput.trim().toLowerCase())

                          return (
                            <>
                              {filtered.slice(0, 15).map((tag) => {
                                const count = tagCounts.get(tag) || 0
                                const isAll = count === totalSelected
                                const isSome = count > 0 && count < totalSelected
                                return (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => {
                                      const idSet = selectedIds
                                      if (isAll) {
                                        // Remove from all selected
                                        const updated = selections.map((d) => {
                                          if (!idSet.has(d.id)) return d
                                          return { ...d, tags: d.tags.filter((t) => t !== tag), updatedAt: new Date().toISOString() }
                                        })
                                        onUpdateSelections(updated)
                                      } else {
                                        // Add to all selected that don't have it
                                        const updated = selections.map((d) => {
                                          if (!idSet.has(d.id)) return d
                                          if (d.tags.includes(tag)) return d
                                          return { ...d, tags: [...d.tags, tag], updatedAt: new Date().toISOString() }
                                        })
                                        onUpdateSelections(updated)
                                      }
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs text-cream/80 hover:bg-stone-hover transition-colors flex items-center gap-2"
                                  >
                                    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[9px] shrink-0 ${
                                      isAll ? 'bg-sandstone/80 border-sandstone text-basalt' : isSome ? 'border-sandstone/50 bg-sandstone/20 text-sandstone' : 'border-cream/20'
                                    }`}>
                                      {isAll ? '✓' : isSome ? '–' : ''}
                                    </span>
                                    {tag}
                                  </button>
                                )
                              })}
                              {showCreate && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const tag = bulkTagInput.trim()
                                    const idSet = selectedIds
                                    const updated = selections.map((d) => {
                                      if (!idSet.has(d.id)) return d
                                      if (d.tags.includes(tag)) return d
                                      return { ...d, tags: [...d.tags, tag], updatedAt: new Date().toISOString() }
                                    })
                                    onUpdateSelections(updated)
                                    setBulkTagInput('')
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-xs text-cream/65 hover:bg-stone-hover transition-colors border-t border-cream/15"
                                >
                                  Create &ldquo;{bulkTagInput.trim()}&rdquo;
                                </button>
                              )}
                              {filtered.length === 0 && !showCreate && (
                                <div className="px-3 py-2 text-xs text-cream/45 italic">No labels</div>
                              )}
                            </>
                          )
                        })()}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Priority */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setBulkMenuOpen(bulkMenuOpen === 'priority' ? null : 'priority')}
                  className="text-xs px-3 py-1.5 rounded-lg bg-cream/8 text-cream/70 hover:bg-cream/12 hover:text-cream transition-colors"
                >
                  Priority
                </button>
                {bulkMenuOpen === 'priority' && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setBulkMenuOpen(null)} />
                    <div className="absolute bottom-full mb-1 left-0 bg-basalt border border-cream/15 rounded-lg shadow-xl z-20 py-1 min-w-[130px]">
                      <button
                        type="button"
                        onClick={() => {
                          const idSet = selectedIds
                          const updated = selections.map((d) =>
                            idSet.has(d.id) ? { ...d, priority: undefined, updatedAt: new Date().toISOString() } : d
                          )
                          onUpdateSelections(updated)
                          deselectAll()
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-cream/55 italic hover:bg-stone-hover transition-colors"
                      >
                        None
                      </button>
                      {(Object.entries(SELECTION_PRIORITY_CONFIG) as [SelectionPriority, { label: string; className: string }][]).map(([key, cfg]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            const idSet = selectedIds
                            const updated = selections.map((d) =>
                              idSet.has(d.id) ? { ...d, priority: key, updatedAt: new Date().toISOString() } : d
                            )
                            onUpdateSelections(updated)
                            deselectAll()
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-cream/80 hover:bg-stone-hover transition-colors"
                        >
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${cfg.className}`}>{cfg.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Delete */}
              <button
                type="button"
                onClick={() => setBulkDeleteConfirm(true)}
                className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400/70 hover:bg-red-500/20 hover:text-red-400 transition-colors"
              >
                Delete
              </button>
            </div>

            <button
              type="button"
              onClick={deselectAll}
              className="text-xs text-cream/45 hover:text-cream/65 transition-colors shrink-0"
            >
              Deselect all
            </button>
          </div>
        </div>
      )}

      {/* Bulk delete confirm */}
      {bulkDeleteConfirm && (
        <ConfirmDialog
          title={`Delete ${selectedIds.size} selection${selectedIds.size !== 1 ? 's' : ''}?`}
          message="This cannot be undone. All options and comments will be permanently deleted."
          confirmLabel="Delete"
          confirmVariant="danger"
          onConfirm={() => {
            const idSet = selectedIds
            const updated = selections.filter((d) => !idSet.has(d.id))
            onUpdateSelections(updated)
            deselectAll()
            setBulkDeleteConfirm(false)
          }}
          onCancel={() => setBulkDeleteConfirm(false)}
        />
      )}

      {/* Bulk toast */}
      {bulkToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-stone border border-cream/15 rounded-lg px-4 py-2.5 text-sm text-cream shadow-xl">
          {bulkToast}
        </div>
      )}

      {/* Mobile FAB — Add Selection */}
      {hasDecisions && !readOnly && (
        <button
          type="button"
          onClick={() => setAddInputVisible(true)}
          className="md:hidden fixed right-6 w-14 h-14 bg-sandstone rounded-full shadow-lg z-40 flex items-center justify-center active:scale-95 transition-transform"
          style={{ bottom: 'calc(var(--bottom-nav-offset, 3.5rem) + 1rem)' }}
          aria-label="New selection"
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
          <div className="relative bg-stone border-t border-cream/15 rounded-t-xl w-full max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h2 className="text-lg font-medium text-cream">Filters</h2>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => { setStatusFilters([]); setTagFilters([]); setLocationFilters([]) }}
                  className="text-xs text-sandstone hover:text-sandstone-light transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="px-5 pb-5 space-y-5">
              {/* Status section */}
              <div>
                <label className="block text-sm text-cream/80 mb-2">Status</label>
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
                              : 'bg-cream/10 text-cream/70'
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

              {/* Location */}
              {usedLocations.length > 0 && (
                <div>
                  <label className="block text-sm text-cream/80 mb-2">Location</label>
                  <div className="flex flex-wrap gap-2">
                    {usedLocations.map((loc) => {
                      const isActive = locationFilters.includes(loc)
                      return (
                        <button
                          key={loc}
                          onClick={() => toggleLocationFilter(loc)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                            isActive
                              ? 'bg-sandstone/30 text-sandstone ring-1 ring-sandstone/50'
                              : 'bg-cream/10 text-cream/70'
                          }`}
                        >
                          {loc}
                          <span className="text-[10px] opacity-70">{locationCounts[loc] || 0}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Labels */}
              {allTags.length > 0 && (
                <div>
                  <label className="block text-sm text-cream/80 mb-2">Labels</label>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => {
                      const isActive = tagFilters.includes(tag)
                      return (
                        <button
                          key={tag}
                          onClick={() => toggleTagFilter(tag)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                            isActive
                              ? 'bg-sandstone/30 text-sandstone ring-1 ring-sandstone/50'
                              : 'bg-cream/10 text-cream/70'
                          }`}
                        >
                          {tag}
                          <span className="text-[10px] opacity-70">{tagCounts[tag] || 0}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Sort */}
              <div>
                <label className="block text-sm text-cream/80 mb-2">Sort by</label>
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                  className="w-full bg-basalt text-cream/70 text-sm rounded-lg border border-cream/15 px-3 py-2 focus:outline-none focus:border-sandstone/40"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Group by */}
              <div>
                <label className="block text-sm text-cream/80 mb-2">Group by</label>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as typeof groupBy)}
                  className="w-full bg-basalt text-cream/70 text-sm rounded-lg border border-cream/15 px-3 py-2 focus:outline-none focus:border-sandstone/40"
                >
                  <option value="none">None</option>
                  <option value="location">By Location</option>
                  <option value="tag">By Label</option>
                  <option value="status">By Status</option>
                  <option value="priority">By Priority</option>
                </select>
              </div>

              {/* Packs */}
              {!readOnly && kits.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => { setFilterSheetOpen(false); setIdeasModalOpen(true) }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-cream/80 bg-stone-200 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    Add an Idea Pack
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
      {ideasModalOpen && (
        <IdeasPackModal
          appliedKitIds={appliedKitIds}
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-stone border border-cream/15 rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 max-w-sm">
          <span className="text-sm text-cream/80">{toast.message}</span>
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
            className="text-cream/45 hover:text-cream/70 transition-colors"
          >
            ×
          </button>
        </div>
      )}

      {/* Simple toast (no undo) */}
      {simpleToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-stone border border-cream/15 rounded-lg shadow-lg px-4 py-2.5 flex items-center gap-2 max-w-xs">
          <svg className="w-4 h-4 text-green-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm text-cream/80">{simpleToast}</span>
        </div>
      )}
    </>
  )
}
