'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useActivityFeed, type ActivityFeedEvent } from '@/hooks/useActivityFeed'
import { relativeTime } from '@/lib/relativeTime'
import { TOOL_LABEL, eventHref, dayLabel } from '@/lib/activityHelpers'

// ── Action type filter groups ──

const ACTION_FILTERS: { key: string[] | undefined; label: string }[] = [
  { key: undefined, label: 'All' },
  { key: ['commented'], label: 'Comments' },
  { key: ['selected', 'status_changed', 'done', 'reopened'], label: 'Status' },
  { key: ['added', 'removed', 'created', 'updated'], label: 'Changes' },
  { key: ['shared'], label: 'Sharing' },
]

// ── Component ──

interface ActivityPanelProps {
  onClose: () => void
  toolKey?: string
  collectionId?: string
  collectionTitle?: string
}

export function ActivityPanel({ onClose, toolKey, collectionId, collectionTitle }: ActivityPanelProps) {
  const [search, setSearch] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [activeFilter, setActiveFilter] = useState<string[] | undefined>(undefined)
  const searchRef = useRef<HTMLInputElement>(null)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const { events, isLoading, hasMore, loadMore } = useActivityFeed({
    toolKey,
    collectionId,
    actionTypes: activeFilter,
    q: debouncedQ || undefined,
  })

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Body scroll lock
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Group events by day
  const grouped = useMemo(() => {
    const groups: { label: string; events: ActivityFeedEvent[] }[] = []
    let currentLabel = ''
    for (const evt of events) {
      const label = dayLabel(evt.createdAt)
      if (label !== currentLabel) {
        currentLabel = label
        groups.push({ label, events: [] })
      }
      groups[groups.length - 1].events.push(evt)
    }
    return groups
  }, [events])

  const title = collectionTitle ? `Activity — ${collectionTitle}` : 'Activity'

  const panelContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 border-b border-cream/10 px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium text-cream truncate pr-3">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-cream/40 hover:text-cream transition-colors shrink-0"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cream/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activity..."
            className="w-full bg-cream/5 border border-cream/10 rounded-lg pl-8 pr-3 py-1.5 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/40"
          />
        </div>

        {/* Action type filter chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {ACTION_FILTERS.map((f) => (
            <button
              key={f.label}
              type="button"
              onClick={() => setActiveFilter(f.key)}
              className={`text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
                activeFilter === f.key
                  ? 'bg-sandstone/20 text-sandstone font-medium'
                  : 'text-cream/40 hover:text-cream/60 bg-cream/5'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Event list */}
      <div className="flex-1 overflow-y-auto px-5 py-3">
        {isLoading ? (
          <div className="space-y-3 animate-pulse py-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 bg-cream/5 rounded w-3/4" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <p className="text-sm text-cream/25 text-center py-8">No activity yet</p>
        ) : (
          <>
            {grouped.map((group) => (
              <div key={group.label} className="mb-4">
                <p className="text-[10px] uppercase tracking-wider text-cream/25 mb-2">{group.label}</p>
                {group.events.map((evt) => (
                  <Link
                    key={evt.id}
                    href={eventHref(evt)}
                    onClick={onClose}
                    className="block py-2 -mx-2 px-2 hover:bg-cream/5 rounded transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-sm text-cream/60 flex-1 min-w-0 leading-snug">
                        {evt.summaryText}
                      </span>
                      {!toolKey && (
                        <span className="text-[10px] text-cream/20 shrink-0 mt-0.5">
                          {TOOL_LABEL[evt.toolKey] || evt.toolKey}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {evt.actorName && (
                        <span className="text-[11px] text-cream/30">{evt.actorName.split(' ')[0]}</span>
                      )}
                      <span className="text-[11px] text-cream/20">
                        {relativeTime(evt.createdAt)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ))}

            {hasMore && (
              <button
                type="button"
                onClick={loadMore}
                className="w-full text-xs text-cream/30 hover:text-cream/50 transition-colors py-2"
              >
                Load more
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Backdrop — transparent so the page stays visible */}
      <div
        className="fixed inset-0 z-[55]"
        onClick={onClose}
      />

      {/* Desktop: right side panel */}
      <div className="hidden md:flex fixed right-0 top-0 bottom-0 z-[56] w-96 bg-basalt-50 border-l border-cream/10 flex-col shadow-2xl">
        {panelContent}
      </div>

      {/* Mobile: bottom sheet */}
      <div className="md:hidden fixed inset-x-0 bottom-0 z-[56] bg-basalt-50 border-t border-cream/10 rounded-t-xl flex flex-col max-h-[80vh] shadow-2xl">
        {panelContent}
      </div>
    </>
  )
}
