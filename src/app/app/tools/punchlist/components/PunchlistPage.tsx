'use client'

import { useState, useMemo, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import type { PunchlistStateAPI } from '../usePunchlistState'
import { PunchlistItemCard } from './PunchlistItemCard'
import { PunchlistItemDetail } from './PunchlistItemDetail'
import { PunchlistItemRow } from './PunchlistItemRow'
import { BulkPhotoUpload } from './BulkPhotoUpload'
import { BulkTextEntry } from './BulkTextEntry'
import { QuickAddStrip } from './QuickAddStrip'

type SortMode = 'newest' | 'oldest' | 'priority'

const STATUS_OPTIONS = [
  { key: 'OPEN', label: 'Open' },
  { key: 'ACCEPTED', label: 'In Progress' },
  { key: 'DONE', label: 'Done' },
  { key: '__unassigned__', label: 'Unassigned' },
]

const PRIORITY_OPTIONS = [
  { key: 'HIGH', label: 'High' },
  { key: 'MED', label: 'Medium' },
  { key: 'LOW', label: 'Low' },
  { key: '__unassigned__', label: 'Unassigned' },
]

const PRIORITY_ORDER = { HIGH: 0, MED: 1, LOW: 2 } as const

interface Props {
  api: PunchlistStateAPI
  collectionId?: string
  projectId?: string
}

export function PunchlistPage({ api, collectionId, projectId }: Props) {
  const { payload, readOnly } = api
  const searchParams = useSearchParams()

  const [filterStatuses, setFilterStatuses] = useState<Set<string>>(() => {
    const p = searchParams.get('status')
    return p && ['OPEN', 'ACCEPTED', 'DONE'].includes(p) ? new Set([p]) : new Set()
  })
  const [filterPriorities, setFilterPriorities] = useState<Set<string>>(() => {
    const p = searchParams.get('priority')
    return p && ['HIGH', 'MED', 'LOW'].includes(p) ? new Set([p]) : new Set()
  })
  const [filterLocations, setFilterLocations] = useState<Set<string>>(new Set())
  const [filterAssignees, setFilterAssignees] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortMode>('newest')
  const [showBulkPhotos, setShowBulkPhotos] = useState(false)
  const [showBulkText, setShowBulkText] = useState(false)
  const [viewingId, setViewingId] = useState<string | null>(() => searchParams.get('highlight'))
  const [expandedLocations, setExpandedLocations] = useState(false)
  const [expandedAssignees, setExpandedAssignees] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkMenuOpen, setBulkMenuOpen] = useState<'status' | 'assignee' | 'location' | 'priority' | null>(null)
  const [pageSize, setPageSize] = useState(25)
  const [currentPage, setCurrentPage] = useState(0)

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
    const locs = new Set(payload.items.map((i) => i.location).filter(Boolean))
    return Array.from(locs).sort()
  }, [payload.items])

  const uniqueAssignees = useMemo(() => {
    const assignees = new Set(payload.items.map((i) => i.assigneeLabel).filter(Boolean))
    return Array.from(assignees).sort()
  }, [payload.items])

  const filtered = useMemo(() => {
    let items = payload.items

    if (filterStatuses.size > 0) {
      const wantUnassigned = filterStatuses.has('__unassigned__')
      items = items.filter((i) => filterStatuses.has(i.status) || (wantUnassigned && !i.status))
    }

    if (filterPriorities.size > 0) {
      const wantUnassigned = filterPriorities.has('__unassigned__')
      items = items.filter((i) => {
        if (wantUnassigned && !i.priority) return true
        return filterPriorities.has(i.priority ?? '')
      })
    }

    if (filterLocations.size > 0) {
      const wantUnassigned = filterLocations.has('__unassigned__')
      const namedLocs = new Set([...filterLocations].filter((l) => l !== '__unassigned__'))
      items = items.filter((i) => {
        if (wantUnassigned && !i.location) return true
        if (namedLocs.size > 0 && namedLocs.has(i.location)) return true
        return false
      })
    }

    if (filterAssignees.size > 0) {
      const wantUnassigned = filterAssignees.has('__unassigned__')
      items = items.filter((i) => {
        if (wantUnassigned && !i.assigneeLabel) return true
        return filterAssignees.has(i.assigneeLabel)
      })
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.location.toLowerCase().includes(q) ||
          i.assigneeLabel.toLowerCase().includes(q)
      )
    }

    const sorted = [...items]
    if (sort === 'newest') {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else if (sort === 'oldest') {
      sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    } else {
      sorted.sort((a, b) => {
        const pa = PRIORITY_ORDER[a.priority ?? 'LOW']
        const pb = PRIORITY_ORDER[b.priority ?? 'LOW']
        return pa - pb
      })
    }

    return sorted
  }, [payload.items, filterStatuses, filterPriorities, filterLocations, filterAssignees, search, sort])

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filtered.map((i) => i.id)))
  }, [filtered])

  // Reset page when filters/sort change
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(currentPage, totalPages - 1)
  if (safePage !== currentPage) setCurrentPage(safePage)
  const paginatedItems = useMemo(() => {
    const start = currentPage * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage, pageSize])

  const counts = useMemo(() => {
    const c = { OPEN: 0, ACCEPTED: 0, DONE: 0, total: payload.items.length }
    for (const item of payload.items) {
      c[item.status]++
    }
    return c
  }, [payload.items])

  const viewingItem = viewingId ? payload.items.find((i) => i.id === viewingId) : undefined

  // ---- Mini dashboard insights ----
  const [dashboardOpen, setDashboardOpen] = useState(false)

  const insights = useMemo(() => {
    const items = payload.items
    if (items.length === 0) return null

    const now = Date.now()
    const DAY = 86_400_000

    // Last activity
    let lastUpdatedAt = 0
    for (const item of items) {
      const t = new Date(item.updatedAt).getTime()
      if (t > lastUpdatedAt) lastUpdatedAt = t
    }

    // Added this week
    const weekAgo = now - 7 * DAY
    const addedThisWeek = items.filter((i) => new Date(i.createdAt).getTime() > weekAgo).length

    // Stale open items (open, not updated in 21+ days)
    const staleThreshold = now - 21 * DAY
    const staleOpen = items.filter(
      (i) => i.status === 'OPEN' && new Date(i.updatedAt).getTime() < staleThreshold
    ).length

    // High priority open
    const highPriorityOpen = items.filter(
      (i) => i.status !== 'DONE' && i.priority === 'HIGH'
    ).length

    // Completion rate
    const doneCount = items.filter((i) => i.status === 'DONE').length
    const completionPct = Math.round((doneCount / items.length) * 100)

    // Average resolution time (for completed items)
    const completedItems = items.filter((i) => i.completedAt)
    let avgResolutionDays: number | null = null
    if (completedItems.length > 0) {
      const totalMs = completedItems.reduce((sum, i) => {
        return sum + (new Date(i.completedAt!).getTime() - new Date(i.createdAt).getTime())
      }, 0)
      avgResolutionDays = Math.round(totalMs / completedItems.length / DAY)
    }

    // Relative time for last activity
    const diffMs = now - lastUpdatedAt
    let lastActivityLabel: string
    const mins = Math.floor(diffMs / 60_000)
    if (mins < 1) lastActivityLabel = 'just now'
    else if (mins < 60) lastActivityLabel = `${mins}m ago`
    else {
      const hours = Math.floor(mins / 60)
      if (hours < 24) lastActivityLabel = `${hours}h ago`
      else {
        const days = Math.floor(hours / 24)
        lastActivityLabel = days === 1 ? 'yesterday' : `${days}d ago`
      }
    }

    return {
      lastActivityLabel,
      addedThisWeek,
      staleOpen,
      highPriorityOpen,
      completionPct,
      avgResolutionDays,
    }
  }, [payload.items])

  return (
    <>
      {/* Row 1: Summary stats + Share & Export */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="bg-basalt-50 rounded-lg px-4 py-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-400" />
          <span className="text-sm text-cream/70">{counts.OPEN} open</span>
        </div>
        <div className="bg-basalt-50 rounded-lg px-4 py-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-sm text-cream/70">{counts.ACCEPTED} accepted</span>
        </div>
        <div className="bg-basalt-50 rounded-lg px-4 py-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-sm text-cream/70">{counts.DONE} done</span>
        </div>

      </div>

      {/* Mini dashboard — activity insights */}
      {insights && (
        <div className="mb-5">
          <button
            type="button"
            onClick={() => setDashboardOpen(!dashboardOpen)}
            className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-cream/30 hover:text-cream/50 transition-colors mb-2"
          >
            <svg
              className={`w-3 h-3 transition-transform ${dashboardOpen ? 'rotate-90' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Activity
          </button>

          {dashboardOpen && (
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
              {/* Last activity */}
              <span className="text-cream/40">
                Last updated <span className="text-cream/60">{insights.lastActivityLabel}</span>
              </span>

              {/* Added this week */}
              {insights.addedThisWeek > 0 && (
                <span className="text-cream/40">
                  <span className="text-cream/60">{insights.addedThisWeek}</span> added this week
                </span>
              )}

              {/* Completion rate */}
              <span className="text-cream/40">
                <span className="text-cream/60">{insights.completionPct}%</span> done
              </span>

              {/* Avg resolution */}
              {insights.avgResolutionDays !== null && (
                <span className="text-cream/40">
                  Avg <span className="text-cream/60">{insights.avgResolutionDays === 0 ? '<1' : insights.avgResolutionDays}d</span> to complete
                </span>
              )}

              {/* High priority open — attention-worthy */}
              {insights.highPriorityOpen > 0 && (
                <span className="text-red-400/70">
                  <span className="text-red-400">{insights.highPriorityOpen}</span> high priority open
                </span>
              )}

              {/* Stale items — attention-worthy */}
              {insights.staleOpen > 0 && (
                <span className="text-amber-400/70">
                  <span className="text-amber-400">{insights.staleOpen}</span> open &amp; idle 21+ days
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Row 2: Filter pills — all multi-select toggle with Unassigned */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {/* Status pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-cream/30 mr-0.5">Status</span>
          {STATUS_OPTIONS.map((opt) => {
            const active = filterStatuses.has(opt.key)
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => {
                  setFilterStatuses((prev) => {
                    const next = new Set(prev)
                    if (next.has(opt.key)) next.delete(opt.key)
                    else next.add(opt.key)
                    return next
                  })
                  setCurrentPage(0)
                }}
                aria-label={`Filter by status: ${opt.label}`}
                aria-pressed={active}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                  active
                    ? 'bg-sandstone/20 border-sandstone/40 text-sandstone'
                    : 'border-cream/20 text-cream/50 hover:border-cream/40'
                }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>

        {/* Priority pills */}
        <span className="hidden sm:block w-px h-5 bg-cream/15" aria-hidden="true" />
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-cream/30 mr-0.5">Priority</span>
          {PRIORITY_OPTIONS.map((opt) => {
            const active = filterPriorities.has(opt.key)
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => {
                  setFilterPriorities((prev) => {
                    const next = new Set(prev)
                    if (next.has(opt.key)) next.delete(opt.key)
                    else next.add(opt.key)
                    return next
                  })
                  setCurrentPage(0)
                }}
                aria-label={`Filter by priority: ${opt.label}`}
                aria-pressed={active}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                  active
                    ? 'bg-sandstone/20 border-sandstone/40 text-sandstone'
                    : 'border-cream/20 text-cream/50 hover:border-cream/40'
                }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>

        {/* Location pills (collapsible) */}
        <span className="hidden sm:block w-px h-5 bg-cream/15" aria-hidden="true" />
        {(() => {
          const MAX_VISIBLE = 5
          const activeLocs = uniqueLocations.filter((l) => filterLocations.has(l))
          const inactiveLocs = uniqueLocations.filter((l) => !filterLocations.has(l))
          const remainingSlots = Math.max(0, MAX_VISIBLE - activeLocs.length)
          const visibleLocs = expandedLocations
            ? uniqueLocations
            : [...activeLocs, ...inactiveLocs.slice(0, remainingSlots)]
          const hiddenCount = uniqueLocations.length - visibleLocs.length

          return (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-cream/30 mr-0.5">Location</span>
              <button
                type="button"
                onClick={() => {
                  setFilterLocations((prev) => {
                    const next = new Set(prev)
                    if (next.has('__unassigned__')) next.delete('__unassigned__')
                    else next.add('__unassigned__')
                    return next
                  })
                  setCurrentPage(0)
                }}
                aria-label="Filter by unassigned location"
                aria-pressed={filterLocations.has('__unassigned__')}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                  filterLocations.has('__unassigned__')
                    ? 'bg-sandstone/20 border-sandstone/40 text-sandstone'
                    : 'border-cream/15 text-cream/40 hover:border-cream/30'
                }`}
              >
                Unassigned
              </button>
              {visibleLocs.map((loc) => {
                const active = filterLocations.has(loc)
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => {
                      setFilterLocations((prev) => {
                        const next = new Set(prev)
                        if (next.has(loc)) next.delete(loc)
                        else next.add(loc)
                        return next
                      })
                      setCurrentPage(0)
                    }}
                    aria-label={`Filter by location: ${loc}`}
                    aria-pressed={active}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                      active
                        ? 'bg-sandstone/20 border-sandstone/40 text-sandstone'
                        : 'border-cream/15 text-cream/40 hover:border-cream/30'
                    }`}
                  >
                    {loc}
                  </button>
                )
              })}
              {hiddenCount > 0 && (
                <button
                  type="button"
                  onClick={() => setExpandedLocations(true)}
                  className="text-xs px-2.5 py-1 rounded-full border border-cream/15 text-cream/40 hover:border-cream/30 hover:text-cream/60 transition-colors cursor-pointer"
                >
                  +{hiddenCount} more
                </button>
              )}
              {expandedLocations && uniqueLocations.length > MAX_VISIBLE && (
                <button
                  type="button"
                  onClick={() => setExpandedLocations(false)}
                  className="text-xs px-2.5 py-1 text-cream/30 hover:text-cream/50 transition-colors cursor-pointer"
                >
                  Show less
                </button>
              )}
            </div>
          )
        })()}

        {/* Assignee pills (collapsible) */}
        <span className="hidden sm:block w-px h-5 bg-cream/15" aria-hidden="true" />
        {(() => {
          const MAX_VISIBLE = 5
          const activeAssignees = uniqueAssignees.filter((a) => filterAssignees.has(a))
          const inactiveAssignees = uniqueAssignees.filter((a) => !filterAssignees.has(a))
          const remainingSlots = Math.max(0, MAX_VISIBLE - activeAssignees.length)
          const visibleAssignees = expandedAssignees
            ? uniqueAssignees
            : [...activeAssignees, ...inactiveAssignees.slice(0, remainingSlots)]
          const hiddenCount = uniqueAssignees.length - visibleAssignees.length

          return (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-cream/30 mr-0.5">Assignee</span>
              <button
                type="button"
                onClick={() => {
                  setFilterAssignees((prev) => {
                    const next = new Set(prev)
                    if (next.has('__unassigned__')) next.delete('__unassigned__')
                    else next.add('__unassigned__')
                    return next
                  })
                  setCurrentPage(0)
                }}
                aria-label="Filter by unassigned assignee"
                aria-pressed={filterAssignees.has('__unassigned__')}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                  filterAssignees.has('__unassigned__')
                    ? 'bg-sandstone/20 border-sandstone/40 text-sandstone'
                    : 'border-cream/15 text-cream/40 hover:border-cream/30'
                }`}
              >
                Unassigned
              </button>
              {visibleAssignees.map((a) => {
                const active = filterAssignees.has(a)
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => {
                      setFilterAssignees((prev) => {
                        const next = new Set(prev)
                        if (next.has(a)) next.delete(a)
                        else next.add(a)
                        return next
                      })
                      setCurrentPage(0)
                    }}
                    aria-label={`Filter by assignee: ${a}`}
                    aria-pressed={active}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                      active
                        ? 'bg-sandstone/20 border-sandstone/40 text-sandstone'
                        : 'border-cream/15 text-cream/40 hover:border-cream/30'
                    }`}
                  >
                    {a}
                  </button>
                )
              })}
              {hiddenCount > 0 && (
                <button
                  type="button"
                  onClick={() => setExpandedAssignees(true)}
                  className="text-xs px-2.5 py-1 rounded-full border border-cream/15 text-cream/40 hover:border-cream/30 hover:text-cream/60 transition-colors cursor-pointer"
                >
                  +{hiddenCount} more
                </button>
              )}
              {expandedAssignees && uniqueAssignees.length > MAX_VISIBLE && (
                <button
                  type="button"
                  onClick={() => setExpandedAssignees(false)}
                  className="text-xs px-2.5 py-1 text-cream/30 hover:text-cream/50 transition-colors cursor-pointer"
                >
                  Show less
                </button>
              )}
            </div>
          )
        })()}
      </div>

      {/* Row 3: Search + Sort + Desktop Add buttons */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(0) }}
          placeholder="Search items..."
          aria-label="Search punchlist items"
          className="flex-1 min-w-[140px] bg-basalt border border-cream/20 rounded-lg px-3 py-1.5 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50"
        />

        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value as SortMode); setCurrentPage(0) }}
          aria-label="Sort items"
          className="bg-basalt border border-cream/20 rounded-lg px-2 py-1.5 text-sm text-cream focus:outline-none focus:border-sandstone/50"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="priority">Priority</option>
        </select>

        {/* Desktop Add button — hidden on mobile, visible md+ */}
        {!readOnly && (
          <button
            type="button"
            onClick={() => setQuickAddOpen(true)}
            className="hidden md:inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-sandstone text-basalt font-medium rounded-lg hover:bg-sandstone-light transition-colors ml-auto"
          >
            + Add Fix
          </button>
        )}
      </div>

      {/* Row 4: Active filter summary */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {(filterStatuses.size > 0 || filterPriorities.size > 0 || filterLocations.size > 0 || filterAssignees.size > 0 || search.trim()) && (
          <>
            <span className="text-xs text-cream/40">
              Showing {filtered.length} of {payload.items.length}
            </span>
            <span className="mx-0.5 text-cream/20" aria-hidden="true">&middot;</span>
            <button
              type="button"
              onClick={() => { setFilterStatuses(new Set()); setFilterPriorities(new Set()); setFilterLocations(new Set()); setFilterAssignees(new Set()); setSearch(''); setCurrentPage(0) }}
              className="text-xs text-sandstone/70 hover:text-sandstone transition-colors"
              aria-label="Clear all filters"
            >
              Clear
            </button>
          </>
        )}
      </div>

      {/* Quick Add Strip — rendered above item list so it's visible on desktop */}
      {quickAddOpen && (
        <QuickAddStrip
          api={api}
          onDone={() => setQuickAddOpen(false)}
          onViewItem={(id) => { setQuickAddOpen(false); setViewingId(id) }}
          onBulkPhotos={() => { setQuickAddOpen(false); setShowBulkPhotos(true) }}
          onBulkText={() => { setQuickAddOpen(false); setShowBulkText(true) }}
        />
      )}

      {/* Item list */}
      {filtered.length === 0 ? (
        <p className="text-cream/40 text-sm text-center py-8">
          No items match your filters.
        </p>
      ) : (
        <>
          {/* Desktop: compact table */}
          <div className="hidden md:block">
            <div className="bg-basalt-50 rounded-card border border-cream/8 overflow-hidden">
              <div className={`grid ${!readOnly ? 'grid-cols-[1.5rem_2.5rem_1fr_8rem_8rem_4rem_5rem_3rem]' : 'grid-cols-[2.5rem_1fr_8rem_8rem_4rem_5rem_3rem]'} gap-2 px-4 py-2 border-b border-cream/8 text-[10px] uppercase tracking-wider text-cream/30`}>
                {!readOnly && (
                  <label className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={filtered.length > 0 && selectedIds.size === filtered.length}
                      onChange={() => selectedIds.size === filtered.length ? deselectAll() : selectAll()}
                      className="w-3.5 h-3.5 rounded border-cream/30 bg-transparent text-sandstone focus:ring-sandstone/30 focus:ring-offset-0 cursor-pointer"
                    />
                  </label>
                )}
                <span></span>
                <span>Title</span>
                <span>Location</span>
                <span>Assignee</span>
                <span>Pri</span>
                <span>Date</span>
                <span></span>
              </div>
              {paginatedItems.map((item) => (
                <PunchlistItemRow
                  key={item.id}
                  item={item}
                  onTap={() => setViewingId(item.id)}
                  onStatusChange={readOnly ? undefined : api.setStatus}
                  onRename={readOnly ? undefined : (id, title) => api.updateItem(id, { title })}
                  selected={selectedIds.has(item.id)}
                  onToggleSelect={readOnly ? undefined : toggleSelect}
                />
              ))}
            </div>
          </div>

          {/* Mobile: cards */}
          <div className="md:hidden space-y-3">
            {paginatedItems.map((item) => (
              <PunchlistItemCard
                key={item.id}
                item={item}
                onTap={() => setViewingId(item.id)}
                onStatusChange={readOnly ? undefined : api.setStatus}
                onRename={readOnly ? undefined : (id, title) => api.updateItem(id, { title })}
                selected={selectedIds.has(item.id)}
                onToggleSelect={readOnly ? undefined : toggleSelect}
              />
            ))}
          </div>

          {/* Pagination controls */}
          {filtered.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-cream/40 text-xs">
                  {currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, filtered.length)} of {filtered.length}
                </span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(0) }}
                  className="bg-basalt border border-cream/20 rounded-lg px-2 py-1 text-xs text-cream focus:outline-none focus:border-sandstone/50"
                  aria-label="Items per page"
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                </select>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(0)}
                    disabled={currentPage === 0}
                    className="px-2 py-1 text-xs text-cream/50 hover:text-cream disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="First page"
                  >
                    ««
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="px-2 py-1 text-xs text-cream/50 hover:text-cream disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous page"
                  >
                    «
                  </button>
                  <span className="px-3 py-1 text-xs text-cream/60">
                    {currentPage + 1} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="px-2 py-1 text-xs text-cream/50 hover:text-cream disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next page"
                  >
                    »
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages - 1)}
                    disabled={currentPage >= totalPages - 1}
                    className="px-2 py-1 text-xs text-cream/50 hover:text-cream disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Last page"
                  >
                    »»
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Mobile FAB — opens QuickAddStrip */}
      {!readOnly && !quickAddOpen && (
        <button
          type="button"
          onClick={() => setQuickAddOpen(true)}
          className="md:hidden fixed right-6 w-14 h-14 bg-sandstone text-basalt rounded-full shadow-lg hover:bg-sandstone-light transition-all flex items-center justify-center z-40"
          style={{ bottom: 'calc(var(--bottom-nav-offset, 3.5rem) + 1rem)' }}
          aria-label="Add Fix"
        >
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {/* Detail view modal (inline editing built in) */}
      {viewingItem && (
        <PunchlistItemDetail
          item={viewingItem}
          api={api}
          collectionId={collectionId}
          projectId={projectId}
          onClose={() => setViewingId(null)}
        />
      )}

      {/* Bulk photo upload modal */}
      {showBulkPhotos && (
        <BulkPhotoUpload
          api={api}
          onClose={() => setShowBulkPhotos(false)}
        />
      )}

      {/* Bulk text entry modal */}
      {showBulkText && (
        <BulkTextEntry
          api={api}
          onClose={() => setShowBulkText(false)}
        />
      )}

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && !readOnly && (
        <div
          className="fixed left-0 right-0 z-40 bg-basalt-50 border-t border-cream/15 shadow-2xl px-4 py-3"
          style={{ bottom: 'calc(var(--bottom-nav-offset, 0rem))' }}
        >
          <div className="max-w-4xl mx-auto flex items-center gap-3 flex-wrap">
            <span className="text-sm text-cream/70 font-medium shrink-0">
              {selectedIds.size} selected
            </span>

            <div className="flex items-center gap-2 flex-wrap flex-1">
              {/* Status */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setBulkMenuOpen(bulkMenuOpen === 'status' ? null : 'status')}
                  className="text-xs px-3 py-1.5 rounded-lg bg-cream/8 text-cream/60 hover:bg-cream/12 hover:text-cream transition-colors"
                >
                  Status
                </button>
                {bulkMenuOpen === 'status' && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setBulkMenuOpen(null)} />
                    <div className="absolute bottom-full mb-1 left-0 bg-basalt border border-cream/15 rounded-lg shadow-xl z-20 py-1 min-w-[120px]">
                      {(['OPEN', 'ACCEPTED', 'DONE'] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            const ids = Array.from(selectedIds)
                            ids.forEach((id) => api.setStatus(id, s))
                            deselectAll()
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-cream/70 hover:bg-cream/5 transition-colors"
                        >
                          {s === 'OPEN' ? 'Open' : s === 'ACCEPTED' ? 'In Progress' : 'Done'}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Assignee */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setBulkMenuOpen(bulkMenuOpen === 'assignee' ? null : 'assignee')}
                  className="text-xs px-3 py-1.5 rounded-lg bg-cream/8 text-cream/60 hover:bg-cream/12 hover:text-cream transition-colors"
                >
                  Assignee
                </button>
                {bulkMenuOpen === 'assignee' && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setBulkMenuOpen(null)} />
                    <div className="absolute bottom-full mb-1 left-0 bg-basalt border border-cream/15 rounded-lg shadow-xl z-20 py-1 min-w-[140px] max-h-48 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => {
                          api.bulkUpdateItems(Array.from(selectedIds), { assigneeLabel: '' })
                          deselectAll()
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-cream/40 italic hover:bg-cream/5 transition-colors"
                      >
                        Unassigned
                      </button>
                      {uniqueAssignees.map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => {
                            api.bulkUpdateItems(Array.from(selectedIds), { assigneeLabel: a })
                            deselectAll()
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-cream/70 hover:bg-cream/5 transition-colors"
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Location */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setBulkMenuOpen(bulkMenuOpen === 'location' ? null : 'location')}
                  className="text-xs px-3 py-1.5 rounded-lg bg-cream/8 text-cream/60 hover:bg-cream/12 hover:text-cream transition-colors"
                >
                  Location
                </button>
                {bulkMenuOpen === 'location' && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setBulkMenuOpen(null)} />
                    <div className="absolute bottom-full mb-1 left-0 bg-basalt border border-cream/15 rounded-lg shadow-xl z-20 py-1 min-w-[140px] max-h-48 overflow-y-auto">
                      {uniqueLocations.map((loc) => (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => {
                            api.bulkUpdateItems(Array.from(selectedIds), { location: loc })
                            deselectAll()
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-cream/70 hover:bg-cream/5 transition-colors"
                        >
                          {loc}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Priority */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setBulkMenuOpen(bulkMenuOpen === 'priority' ? null : 'priority')}
                  className="text-xs px-3 py-1.5 rounded-lg bg-cream/8 text-cream/60 hover:bg-cream/12 hover:text-cream transition-colors"
                >
                  Priority
                </button>
                {bulkMenuOpen === 'priority' && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setBulkMenuOpen(null)} />
                    <div className="absolute bottom-full mb-1 left-0 bg-basalt border border-cream/15 rounded-lg shadow-xl z-20 py-1 min-w-[120px]">
                      {(['HIGH', 'MED', 'LOW'] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            api.bulkUpdateItems(Array.from(selectedIds), { priority: p })
                            deselectAll()
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-cream/70 hover:bg-cream/5 transition-colors"
                        >
                          {p === 'HIGH' ? 'High' : p === 'MED' ? 'Medium' : 'Low'}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={deselectAll}
              className="text-xs text-cream/30 hover:text-cream/50 transition-colors shrink-0"
            >
              Deselect all
            </button>
          </div>
        </div>
      )}

    </>
  )
}
