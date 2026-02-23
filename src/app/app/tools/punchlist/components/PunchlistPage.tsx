'use client'

import { useState, useMemo } from 'react'
import type { PunchlistStateAPI } from '../usePunchlistState'
import type { PunchlistStatus } from '../types'
import { PunchlistItemCard } from './PunchlistItemCard'
import { PunchlistItemDetail } from './PunchlistItemDetail'
import { PunchlistItemForm } from './PunchlistItemForm'
import { BulkPhotoUpload } from './BulkPhotoUpload'
import { BulkTextEntry } from './BulkTextEntry'
import { QuickAddStrip } from './QuickAddStrip'
import { ExportPDFModal } from './ExportPDFModal'

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
}

export function PunchlistPage({ api }: Props) {
  const { payload, readOnly } = api
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL')
  const [filterLocation, setFilterLocation] = useState<string | null>(null)
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortMode>('newest')
  const [showForm, setShowForm] = useState(false)
  const [showBulkPhotos, setShowBulkPhotos] = useState(false)
  const [showBulkText, setShowBulkText] = useState(false)
  const [showFab, setShowFab] = useState(false)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [showExport, setShowExport] = useState(false)

  const uniqueLocations = useMemo(() => {
    const locs = new Set(payload.items.map((i) => i.location))
    return Array.from(locs).sort()
  }, [payload.items])

  const uniqueAssignees = useMemo(() => {
    const assignees = new Set(payload.items.map((i) => i.assigneeLabel))
    return Array.from(assignees).sort()
  }, [payload.items])

  const filtered = useMemo(() => {
    let items = payload.items

    if (filterStatus !== 'ALL') {
      items = items.filter((i) => i.status === filterStatus)
    }

    if (filterLocation) {
      items = items.filter((i) => i.location === filterLocation)
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
  }, [payload.items, filterStatus, filterLocation, filterAssignee, search, sort])

  const counts = useMemo(() => {
    const c = { OPEN: 0, ACCEPTED: 0, DONE: 0, total: payload.items.length }
    for (const item of payload.items) {
      c[item.status]++
    }
    return c
  }, [payload.items])

  const editingItem = editingId ? payload.items.find((i) => i.id === editingId) : undefined
  const viewingItem = viewingId ? payload.items.find((i) => i.id === viewingId) : undefined

  return (
    <>
      {/* Summary stats */}
      <div className="flex flex-wrap gap-3 mb-6">
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

      <p className="text-xs text-cream/30 mb-6">
        Open = waiting for review &middot; Accepted = acknowledged &middot; Done = completed
      </p>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Status filter pills */}
        <div className="flex gap-1.5">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setFilterStatus(opt.key)}
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

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items..."
          className="flex-1 min-w-[140px] bg-basalt border border-cream/20 rounded-lg px-3 py-1.5 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50"
        />

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortMode)}
          className="bg-basalt border border-cream/20 rounded-lg px-2 py-1.5 text-sm text-cream focus:outline-none focus:border-sandstone/50"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="priority">Priority</option>
        </select>

        {/* Export */}
        <button
          type="button"
          onClick={() => setShowExport(true)}
          className="text-xs px-3 py-1.5 bg-sandstone/15 border border-sandstone/30 text-sandstone rounded-lg hover:bg-sandstone/25 transition-colors"
        >
          Export PDF
        </button>

        {/* Desktop Add buttons — hidden on mobile, visible md+ */}
        {!readOnly && (
          <div className="hidden md:flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => setShowBulkPhotos(true)}
              className="text-xs px-3 py-1.5 border border-cream/20 text-cream/50 rounded-lg hover:border-cream/40 hover:text-cream/70 transition-colors"
            >
              From Photos
            </button>
            <button
              type="button"
              onClick={() => setShowBulkText(true)}
              className="text-xs px-3 py-1.5 border border-cream/20 text-cream/50 rounded-lg hover:border-cream/40 hover:text-cream/70 transition-colors"
            >
              Bulk Items
            </button>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="text-xs px-3 py-1.5 bg-sandstone text-basalt font-medium rounded-lg hover:bg-sandstone-light transition-colors"
            >
              + Add Item
            </button>
          </div>
        )}
      </div>

      {/* Location + Assignee filter chips */}
      {(uniqueLocations.length > 1 || uniqueAssignees.length > 1) && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {uniqueLocations.length > 1 && (
            <>
              <span className="text-[10px] uppercase tracking-wider text-cream/30 mr-1">Location</span>
              {uniqueLocations.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setFilterLocation(filterLocation === loc ? null : loc)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                    filterLocation === loc
                      ? 'bg-sandstone/20 border-sandstone/40 text-sandstone'
                      : 'border-cream/15 text-cream/40 hover:border-cream/30'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </>
          )}
          {uniqueAssignees.length > 1 && (
            <>
              <span className={`text-[10px] uppercase tracking-wider text-cream/30 mr-1 ${uniqueLocations.length > 1 ? 'ml-3' : ''}`}>Assignee</span>
              {uniqueAssignees.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setFilterAssignee(filterAssignee === a ? null : a)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                    filterAssignee === a
                      ? 'bg-sandstone/20 border-sandstone/40 text-sandstone'
                      : 'border-cream/15 text-cream/40 hover:border-cream/30'
                  }`}
                >
                  {a}
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {/* Showing X of Y + Clear filters */}
      {(filtered.length !== payload.items.length || filterStatus !== 'ALL' || filterLocation || filterAssignee || search.trim()) && (
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-cream/40">
            Showing {filtered.length} of {payload.items.length}
          </span>
          <button
            type="button"
            onClick={() => { setFilterStatus('ALL'); setFilterLocation(null); setFilterAssignee(null); setSearch('') }}
            className="text-xs text-sandstone/60 hover:text-sandstone transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Item list */}
      {filtered.length === 0 ? (
        <p className="text-cream/40 text-sm text-center py-8">
          No items match your filters.
        </p>
      ) : (
        <div className={`space-y-4 ${showQuickAdd ? 'pb-28 md:pb-0' : ''}`}>
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

      {/* Quick-add strip (mobile sticky bottom + desktop inline) */}
      {!readOnly && showQuickAdd && (
        <QuickAddStrip api={api} onDone={() => setShowQuickAdd(false)} />
      )}

      {/* Floating action button + menu — mobile only, hidden when quick-add active */}
      {!readOnly && !showQuickAdd && (
        <div className="md:hidden">
          {/* Backdrop when FAB menu open */}
          {showFab && (
            <div className="fixed inset-0 z-40" onClick={() => setShowFab(false)} />
          )}

          {/* FAB menu options */}
          {showFab && (
            <div className="fixed bottom-24 right-8 z-40 flex flex-col items-end gap-2">
              <button
                type="button"
                onClick={() => { setShowFab(false); setShowBulkPhotos(true) }}
                className="flex items-center gap-2 bg-basalt-50 border border-cream/15 rounded-full pl-4 pr-3 py-2.5 shadow-lg hover:bg-basalt transition-colors"
              >
                <span className="text-sm text-cream whitespace-nowrap">Add Items from Photos</span>
                <span className="w-8 h-8 bg-sandstone/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-sandstone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </span>
              </button>
              <button
                type="button"
                onClick={() => { setShowFab(false); setShowBulkText(true) }}
                className="flex items-center gap-2 bg-basalt-50 border border-cream/15 rounded-full pl-4 pr-3 py-2.5 shadow-lg hover:bg-basalt transition-colors"
              >
                <span className="text-sm text-cream whitespace-nowrap">Add Multiple Items</span>
                <span className="w-8 h-8 bg-sandstone/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-sandstone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
              <button
                type="button"
                onClick={() => { setShowFab(false); setShowQuickAdd(true) }}
                className="flex items-center gap-2 bg-basalt-50 border border-cream/15 rounded-full pl-4 pr-3 py-2.5 shadow-lg hover:bg-basalt transition-colors"
              >
                <span className="text-sm text-cream whitespace-nowrap">Quick Add</span>
                <span className="w-8 h-8 bg-sandstone/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-sandstone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                </span>
              </button>
            </div>
          )}

          {/* FAB button */}
          <button
            type="button"
            onClick={() => setShowFab(!showFab)}
            className={`fixed bottom-8 right-8 w-14 h-14 bg-sandstone text-basalt rounded-full shadow-lg hover:bg-sandstone-light transition-all flex items-center justify-center z-40 ${showFab ? 'rotate-45' : ''}`}
            aria-label="Add item"
          >
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}

      {/* Add/Edit form modal */}
      {showForm && (
        <PunchlistItemForm
          api={api}
          onClose={() => setShowForm(false)}
        />
      )}
      {editingItem && (
        <PunchlistItemForm
          api={api}
          editItem={editingItem}
          onClose={() => setEditingId(null)}
        />
      )}

      {/* Detail view modal */}
      {viewingItem && (
        <PunchlistItemDetail
          item={viewingItem}
          api={api}
          onClose={() => setViewingId(null)}
          onEdit={() => {
            const id = viewingId
            setViewingId(null)
            setEditingId(id)
          }}
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

      {showExport && (
        <ExportPDFModal
          onClose={() => setShowExport(false)}
          locations={uniqueLocations}
          assignees={uniqueAssignees}
        />
      )}
    </>
  )
}
