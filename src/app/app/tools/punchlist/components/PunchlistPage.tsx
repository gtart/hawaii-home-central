'use client'

import { useState, useMemo } from 'react'
import type { PunchlistStateAPI } from '../usePunchlistState'
import type { PunchlistStatus } from '../types'
import { PunchlistItemCard } from './PunchlistItemCard'
import { PunchlistItemForm } from './PunchlistItemForm'
import { ExportPDFModal } from './ExportPDFModal'

type SortMode = 'newest' | 'oldest' | 'priority'
type FilterStatus = 'ALL' | PunchlistStatus

const STATUS_OPTIONS: { key: FilterStatus; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'OPEN', label: 'Open' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
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
  const [editingId, setEditingId] = useState<string | null>(null)
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
    const c = { OPEN: 0, IN_PROGRESS: 0, DONE: 0, total: payload.items.length }
    for (const item of payload.items) {
      c[item.status]++
    }
    return c
  }, [payload.items])

  const editingItem = editingId ? payload.items.find((i) => i.id === editingId) : undefined

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
          <span className="text-sm text-cream/70">{counts.IN_PROGRESS} in progress</span>
        </div>
        <div className="bg-basalt-50 rounded-lg px-4 py-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-sm text-cream/70">{counts.DONE} done</span>
        </div>
      </div>

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
          className="text-xs px-3 py-1.5 border border-cream/20 text-cream/50 rounded-lg hover:border-cream/40 transition-colors"
        >
          Export
        </button>
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
              api={api}
              onEdit={() => setEditingId(item.id)}
            />
          ))}
        </div>
      )}

      {/* Floating Add button */}
      {!readOnly && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="fixed bottom-8 right-8 w-14 h-14 bg-sandstone text-basalt rounded-full shadow-lg hover:bg-sandstone-light transition-colors flex items-center justify-center z-40"
          aria-label="Add punch item"
        >
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </button>
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

      {showExport && (
        <ExportPDFModal onClose={() => setShowExport(false)} />
      )}
    </>
  )
}
