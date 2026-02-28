'use client'

import { useState, useMemo } from 'react'
import type { PunchlistStateAPI } from '../usePunchlistState'
import type { PunchlistStatus } from '../types'
import { PunchlistItemCard } from './PunchlistItemCard'
import { PunchlistItemDetail } from './PunchlistItemDetail'
import { PunchlistItemForm } from './PunchlistItemForm'
import { BulkPhotoUpload } from './BulkPhotoUpload'
import { BulkTextEntry } from './BulkTextEntry'

type SortMode = 'newest' | 'oldest' | 'priority'
type FilterStatus = 'ALL' | PunchlistStatus

const STATUS_OPTIONS: { key: FilterStatus; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'OPEN', label: 'Open' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'DONE', label: 'Done' },
]

const PRIORITY_ORDER = { HIGH: 0, MED: 1, LOW: 2 } as const

interface Props {
  api: PunchlistStateAPI
  onShareExport?: () => void
}

export function PunchlistPage({ api, onShareExport }: Props) {
  const { payload, readOnly } = api
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL')
  const [filterLocations, setFilterLocations] = useState<Set<string>>(new Set())
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortMode>('newest')
  const [showForm, setShowForm] = useState(false)
  const [showBulkPhotos, setShowBulkPhotos] = useState(false)
  const [showBulkText, setShowBulkText] = useState(false)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [expandedLocations, setExpandedLocations] = useState(false)
  const [expandedAssignees, setExpandedAssignees] = useState(false)
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

    if (filterStatus !== 'ALL') {
      items = items.filter((i) => i.status === filterStatus)
    }

    if (filterLocations.size > 0) {
      items = items.filter((i) => filterLocations.has(i.location))
    }

    if (filterAssignee) {
      items = items.filter((i) => i.assigneeLabel === filterAssignee)
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
  }, [payload.items, filterStatus, filterLocations, filterAssignee, search, sort])

  const counts = useMemo(() => {
    const c = { OPEN: 0, ACCEPTED: 0, DONE: 0, total: payload.items.length }
    for (const item of payload.items) {
      c[item.status]++
    }
    return c
  }, [payload.items])

  const viewingItem = viewingId ? payload.items.find((i) => i.id === viewingId) : undefined

  // ---- Mini dashboard insights ----
  const [dashboardOpen, setDashboardOpen] = useState(true)

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

        {onShareExport && (
          <button
            type="button"
            onClick={onShareExport}
            className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-sandstone/15 text-sandstone hover:bg-sandstone/25 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="16 6 12 2 8 6" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="12" y1="2" x2="12" y2="15" strokeLinecap="round" />
            </svg>
            Share &amp; Export
          </button>
        )}
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

      {/* Row 2: Status filter pills + Location pills + Assignee chips */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {/* Status filter pills */}
        <div className="flex gap-1.5">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setFilterStatus(opt.key)}
              aria-label={`Filter by status: ${opt.label}`}
              aria-pressed={filterStatus === opt.key}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                filterStatus === opt.key
                  ? 'bg-sandstone/20 border-sandstone/40 text-sandstone'
                  : 'border-cream/20 text-cream/50 hover:border-cream/40'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Divider + Location multi-select pills (collapsible) */}
        {uniqueLocations.length > 0 && (() => {
          const MAX_VISIBLE = 5
          // Always show active (selected) pills + fill remaining slots from the list
          const activeLocs = uniqueLocations.filter((l) => filterLocations.has(l))
          const inactiveLocs = uniqueLocations.filter((l) => !filterLocations.has(l))
          const remainingSlots = Math.max(0, MAX_VISIBLE - activeLocs.length)
          const visibleLocs = expandedLocations
            ? uniqueLocations
            : [...activeLocs, ...inactiveLocs.slice(0, remainingSlots)]
          const hiddenCount = uniqueLocations.length - visibleLocs.length

          return (
            <>
              <span className="hidden sm:block w-px h-5 bg-cream/15" aria-hidden="true" />
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider text-cream/30 mr-0.5">Location</span>
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
            </>
          )
        })()}

        {/* Divider + Assignee chips (collapsible, if more than 1 assignee) */}
        {uniqueAssignees.length > 1 && (() => {
          const MAX_VISIBLE = 5
          const activeAssignees = filterAssignee ? uniqueAssignees.filter((a) => a === filterAssignee) : []
          const inactiveAssignees = uniqueAssignees.filter((a) => a !== filterAssignee)
          const remainingSlots = Math.max(0, MAX_VISIBLE - activeAssignees.length)
          const visibleAssignees = expandedAssignees
            ? uniqueAssignees
            : [...activeAssignees, ...inactiveAssignees.slice(0, remainingSlots)]
          const hiddenCount = uniqueAssignees.length - visibleAssignees.length

          return (
            <>
              <span className="hidden sm:block w-px h-5 bg-cream/15" aria-hidden="true" />
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider text-cream/30 mr-0.5">Assignee</span>
                {visibleAssignees.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setFilterAssignee(filterAssignee === a ? null : a)}
                    aria-label={`Filter by assignee: ${a}`}
                    aria-pressed={filterAssignee === a}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                      filterAssignee === a
                        ? 'bg-sandstone/20 border-sandstone/40 text-sandstone'
                        : 'border-cream/15 text-cream/40 hover:border-cream/30'
                    }`}
                  >
                    {a}
                  </button>
                ))}
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
            </>
          )
        })()}
      </div>

      {/* Row 3: Search + Sort + Desktop Add buttons */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items..."
          aria-label="Search punchlist items"
          className="flex-1 min-w-[140px] bg-basalt border border-cream/20 rounded-lg px-3 py-1.5 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50"
        />

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortMode)}
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
            onClick={() => setShowForm(true)}
            className="hidden md:inline-flex items-center gap-1.5 ml-auto text-xs px-3 py-1.5 bg-sandstone text-basalt font-medium rounded-lg hover:bg-sandstone-light transition-colors"
          >
            + Add Item
          </button>
        )}
      </div>

      {/* Row 4: Active filter summary */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {(filterStatus !== 'ALL' || filterLocations.size > 0 || filterAssignee || search.trim()) && (
          <>
            <span className="text-xs text-cream/40">
              Showing {filtered.length} of {payload.items.length}
            </span>
            <span className="mx-0.5 text-cream/20" aria-hidden="true">&middot;</span>
            <button
              type="button"
              onClick={() => { setFilterStatus('ALL'); setFilterLocations(new Set()); setFilterAssignee(null); setSearch('') }}
              className="text-xs text-sandstone/70 hover:text-sandstone transition-colors"
              aria-label="Clear all filters"
            >
              Clear
            </button>
          </>
        )}
      </div>

      {/* Item list */}
      {filtered.length === 0 ? (
        <p className="text-cream/40 text-sm text-center py-8">
          No items match your filters.
        </p>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <PunchlistItemCard
              key={item.id}
              item={item}
              onTap={() => setViewingId(item.id)}
              onStatusChange={readOnly ? undefined : api.setStatus}
            />
          ))}
        </div>
      )}

      {/* Mobile FAB — single tap opens Add Item form */}
      {!readOnly && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="md:hidden fixed bottom-8 right-8 w-14 h-14 bg-sandstone text-basalt rounded-full shadow-lg hover:bg-sandstone-light transition-all flex items-center justify-center z-40"
          aria-label="Add item"
        >
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {/* Add Item form modal */}
      {showForm && (
        <PunchlistItemForm
          api={api}
          onClose={() => setShowForm(false)}
          onBulkPhotos={() => { setShowForm(false); setShowBulkPhotos(true) }}
          onBulkText={() => { setShowForm(false); setShowBulkText(true) }}
        />
      )}
      {/* Detail view modal (inline editing built in) */}
      {viewingItem && (
        <PunchlistItemDetail
          item={viewingItem}
          api={api}
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

    </>
  )
}
