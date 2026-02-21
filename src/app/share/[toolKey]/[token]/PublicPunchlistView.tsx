'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { PunchlistItem, PunchlistStatus, PunchlistPhoto } from '@/app/app/tools/punchlist/types'

const STATUS_CONFIG: Record<PunchlistStatus, { label: string; dot: string; bg: string; text: string }> = {
  OPEN: { label: 'Open', dot: 'bg-red-400', bg: 'bg-red-400/10', text: 'text-red-400' },
  IN_PROGRESS: { label: 'In Progress', dot: 'bg-amber-400', bg: 'bg-amber-400/10', text: 'text-amber-400' },
  DONE: { label: 'Done', dot: 'bg-emerald-400', bg: 'bg-emerald-400/10', text: 'text-emerald-400' },
}

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  HIGH: { label: 'High', className: 'bg-red-400/15 text-red-400' },
  MED: { label: 'Med', className: 'bg-amber-400/15 text-amber-400' },
  LOW: { label: 'Low', className: 'bg-cream/10 text-cream/40' },
}

interface Props {
  payload: Record<string, unknown>
  projectName: string
  includeNotes: boolean
}

function PublicItemCard({ item, includeNotes }: { item: PunchlistItem; includeNotes: boolean }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const statusCfg = STATUS_CONFIG[item.status]
  const priorityCfg = item.priority ? PRIORITY_CONFIG[item.priority] : null

  return (
    <>
      <div className="bg-basalt-50 rounded-xl p-4 sm:p-5">
        <div className="flex gap-4">
          {item.photos.length > 0 && (
            <button
              type="button"
              onClick={() => setLightboxIndex(0)}
              className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden relative cursor-pointer"
            >
              <img src={item.photos[0].thumbnailUrl || item.photos[0].url} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
              {item.photos.length > 1 && (
                <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[10px] px-1 rounded">
                  +{item.photos.length - 1}
                </span>
              )}
            </button>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="text-cream font-medium text-sm sm:text-base truncate">{item.title}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="text-cream/50 text-xs">{item.location}</span>
              <span className="text-cream/20">&middot;</span>
              <span className="text-cream/50 text-xs">{item.assigneeLabel}</span>
              {priorityCfg && (
                <>
                  <span className="text-cream/20">&middot;</span>
                  <span className={`text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded ${priorityCfg.className}`}>
                    {priorityCfg.label}
                  </span>
                </>
              )}
            </div>
            {includeNotes && item.notes && (
              <p className="text-cream/40 text-xs mt-2 leading-relaxed">{item.notes}</p>
            )}
            {item.comments && item.comments.length > 0 && (
              <div className="mt-2 pt-2 border-t border-cream/5">
                <p className="text-[10px] uppercase tracking-wider text-cream/30 mb-1">Comments ({item.comments.length})</p>
                {item.comments.map((c) => (
                  <div key={c.id} className="mb-1">
                    <span className="text-[11px] text-cream/50">
                      <span className="font-medium text-cream/60">{c.authorName}</span>
                      {' '}&middot;{' '}
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                    <p className="text-xs text-cream/40">{c.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-cream/5">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
            {statusCfg.label}
          </span>
          <span className="text-cream/30 text-[11px]">
            {new Date(item.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Inline lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          photos={item.photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  )
}

function Lightbox({ photos, initialIndex, onClose }: { photos: PunchlistPhoto[]; initialIndex: number; onClose: () => void }) {
  const [index, setIndex] = useState(initialIndex)
  const photo = photos[index]
  if (!photo) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={onClose}>
      <button type="button" onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white z-10">
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
        </svg>
      </button>
      <div className="absolute top-4 left-4 text-white/50 text-sm z-10">{index + 1} / {photos.length}</div>
      {photos.length > 1 && (
        <button type="button" onClick={(e) => { e.stopPropagation(); setIndex((i) => (i > 0 ? i - 1 : photos.length - 1)) }} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white z-10">
          <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      <img src={photo.url} alt={photo.caption || ''} className="max-w-[90vw] max-h-[85vh] object-contain" onClick={(e) => e.stopPropagation()} />
      {photos.length > 1 && (
        <button type="button" onClick={(e) => { e.stopPropagation(); setIndex((i) => (i < photos.length - 1 ? i + 1 : 0)) }} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white z-10">
          <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  )
}

type FilterStatus = 'ALL' | PunchlistStatus

const STATUS_OPTIONS: { key: FilterStatus; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'OPEN', label: 'Open' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'DONE', label: 'Done' },
]

export function PublicPunchlistView({ payload, projectName, includeNotes }: Props) {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL')
  const [filterLocation, setFilterLocation] = useState<string | null>(null)
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const allItems = useMemo(() => (payload.items as PunchlistItem[]) || [], [payload.items])

  const uniqueLocations = useMemo(() => {
    const locs = new Set(allItems.map((i) => i.location))
    return Array.from(locs).sort()
  }, [allItems])

  const uniqueAssignees = useMemo(() => {
    const assignees = new Set(allItems.map((i) => i.assigneeLabel))
    return Array.from(assignees).sort()
  }, [allItems])

  const items = useMemo(() => {
    let filtered = allItems

    if (filterStatus !== 'ALL') {
      filtered = filtered.filter((i) => i.status === filterStatus)
    }

    if (filterLocation) {
      filtered = filtered.filter((i) => i.location === filterLocation)
    }

    if (filterAssignee) {
      filtered = filtered.filter((i) => i.assigneeLabel === filterAssignee)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      filtered = filtered.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.location.toLowerCase().includes(q) ||
          i.assigneeLabel.toLowerCase().includes(q)
      )
    }

    return filtered
  }, [allItems, filterStatus, filterLocation, filterAssignee, search])

  const counts = useMemo(() => {
    const c = { OPEN: 0, IN_PROGRESS: 0, DONE: 0, total: allItems.length }
    for (const item of allItems) c[item.status]++
    return c
  }, [allItems])

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-cream/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-cream/40">Shared Punchlist</p>
            <h1 className="font-serif text-xl text-sandstone">{projectName}</h1>
          </div>
          <Link href="/" className="text-xs text-cream/30 hover:text-cream/50 transition-colors">
            Hawaii Home Central
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Notes banner — only shown when notes are included */}
        {includeNotes && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs mb-6 bg-emerald-400/10 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Notes included
          </div>
        )}

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

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items..."
            className="flex-1 min-w-[140px] bg-basalt border border-cream/20 rounded-lg px-3 py-1.5 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50"
          />
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

        {/* Items */}
        {items.length === 0 ? (
          <p className="text-cream/40 text-sm text-center py-12">No items to display.</p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <PublicItemCard key={item.id} item={item} includeNotes={includeNotes} />
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-cream/5 text-center">
          <p className="text-cream/20 text-xs">
            Shared from{' '}
            <Link href="/" className="text-sandstone/50 hover:text-sandstone transition-colors">
              Hawaii Home Central
            </Link>
          </p>
        </footer>
      </div>
    </div>
  )
}
