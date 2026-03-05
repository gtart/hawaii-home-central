'use client'

import { useState, useEffect, useCallback } from 'react'
import { relativeTime } from '@/lib/relativeTime'
import { useInboxCount } from '@/hooks/useInboxCount'
import { SortWizard } from './SortWizard'
import { QuickCaptureSheet } from './QuickCaptureSheet'

type ItemType = 'IMAGE' | 'PAGE' | 'NOTE'

interface CapturedItem {
  id: string
  type: ItemType
  title: string | null
  note: string | null
  description: string | null
  sourceUrl: string | null
  imageUrl: string | null
  thumbnailUrl: string | null
  suggestedToolKey: string | null
  createdAt: string
}

const TYPE_FILTERS: { key: ItemType | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'IMAGE', label: 'Images' },
  { key: 'PAGE', label: 'Pages' },
  { key: 'NOTE', label: 'Notes' },
]

function hostnameFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

export function InboxPage() {
  const [items, setItems] = useState<CapturedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<ItemType | 'ALL'>('ALL')
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [sortItem, setSortItem] = useState<CapturedItem | null>(null)
  const [showCapture, setShowCapture] = useState(false)
  const { total: inboxCount, refetch: refetchInbox } = useInboxCount()

  const fetchItems = useCallback(async (cursor?: string, type?: ItemType | 'ALL') => {
    const params = new URLSearchParams({ status: 'UNSORTED', limit: '20' })
    if (type && type !== 'ALL') params.set('type', type)
    if (cursor) params.set('cursor', cursor)

    const res = await fetch(`/api/captured-items?${params}`)
    if (!res.ok) return { items: [], nextCursor: null }
    return res.json()
  }, [])

  // Initial load + filter changes
  useEffect(() => {
    setLoading(true)
    fetchItems(undefined, typeFilter).then((data) => {
      setItems(data.items || [])
      setNextCursor(data.nextCursor || null)
      setLoading(false)
    })
  }, [typeFilter, fetchItems])

  async function loadMore() {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    const data = await fetchItems(nextCursor, typeFilter)
    setItems((prev) => [...prev, ...(data.items || [])])
    setNextCursor(data.nextCursor || null)
    setLoadingMore(false)
  }

  async function dismissItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
    await fetch(`/api/captured-items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'DISMISSED' }),
    })
    refetchInbox()
  }

  function handleSorted() {
    if (sortItem) {
      setItems((prev) => prev.filter((i) => i.id !== sortItem.id))
    }
    setSortItem(null)
    refetchInbox()
  }

  return (
    <>
      {/* Sort Wizard */}
      {sortItem && (
        <SortWizard
          item={sortItem}
          onClose={() => setSortItem(null)}
          onSorted={handleSorted}
        />
      )}

      {/* Quick Capture Sheet */}
      {showCapture && (
        <QuickCaptureSheet
          onClose={() => setShowCapture(false)}
          onSort={(result) => {
            setShowCapture(false)
            setSortItem(result as unknown as CapturedItem)
          }}
        />
      )}

      <div className="pt-24 md:pt-20 pb-24 px-4 md:px-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="font-serif text-2xl text-sandstone">Inbox</h1>
              <p className="text-sm text-cream/40 mt-0.5">
                {inboxCount === 0 ? 'No unsorted items' : `${inboxCount} unsorted`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCapture(true)}
              className="flex items-center gap-2 px-3 py-2 bg-sandstone/10 text-sandstone text-sm rounded-lg hover:bg-sandstone/15 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              Capture
            </button>
          </div>

          {/* Filter chips */}
          <div className="flex gap-1.5 mb-5 overflow-x-auto">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setTypeFilter(f.key)}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${
                  typeFilter === f.key
                    ? 'bg-sandstone/20 text-sandstone font-medium'
                    : 'text-cream/40 hover:text-cream/60 bg-cream/5'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 border-2 border-cream/20 border-t-sandstone rounded-full animate-spin" />
            </div>
          )}

          {/* Empty state */}
          {!loading && items.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-10 h-10 text-cream/15 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 12h-6l-2 3H10l-2-3H2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-sm text-cream/30">No unsorted items</p>
              <p className="text-xs text-cream/20 mt-1">
                Use the + button to capture ideas, photos, and links
              </p>
            </div>
          )}

          {/* Item list */}
          {!loading && items.length > 0 && (
            <div className="space-y-2">
              {items.map((item) => (
                <InboxItemCard
                  key={item.id}
                  item={item}
                  onSort={() => setSortItem(item)}
                  onDismiss={() => dismissItem(item.id)}
                />
              ))}
            </div>
          )}

          {/* Load more */}
          {nextCursor && !loading && (
            <div className="flex justify-center mt-6">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="px-4 py-2 text-sm text-cream/40 hover:text-cream/60 bg-cream/5 rounded-lg transition-colors disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function InboxItemCard({
  item,
  onSort,
  onDismiss,
}: {
  item: CapturedItem
  onSort: () => void
  onDismiss: () => void
}) {
  const displayTitle = item.title || item.note || item.sourceUrl || 'Captured item'
  const hostname = item.sourceUrl ? hostnameFromUrl(item.sourceUrl) : null
  const typeLabel = item.type === 'IMAGE' ? 'Image' : item.type === 'PAGE' ? 'Page' : 'Note'

  return (
    <div className="flex items-start gap-3 p-3 bg-cream/[0.03] border border-cream/8 rounded-lg group">
      {/* Thumbnail */}
      {(item.thumbnailUrl || item.imageUrl) ? (
        <img
          src={item.thumbnailUrl || item.imageUrl || ''}
          alt=""
          className="w-14 h-14 rounded-lg object-cover shrink-0"
        />
      ) : (
        <div className="w-14 h-14 rounded-lg bg-cream/5 flex items-center justify-center shrink-0">
          {item.type === 'NOTE' ? (
            <svg className="w-6 h-6 text-cream/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 2v6h6M16 13H8M16 17H8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-cream/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-cream truncate">{displayTitle}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-cream/25 uppercase tracking-wide">{typeLabel}</span>
          {hostname && (
            <>
              <span className="text-cream/15">·</span>
              <span className="text-[11px] text-cream/25 truncate">{hostname}</span>
            </>
          )}
          <span className="text-cream/15">·</span>
          <span className="text-[11px] text-cream/25">{relativeTime(item.createdAt)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onSort}
          className="px-3 py-1.5 text-xs bg-sandstone/10 text-sandstone rounded-md hover:bg-sandstone/20 transition-colors"
        >
          Sort
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="p-1.5 text-cream/20 hover:text-cream/50 transition-colors"
          title="Dismiss"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
