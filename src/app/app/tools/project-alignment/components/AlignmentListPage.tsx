'use client'

import { useState, useMemo } from 'react'
import type { AlignmentItemStatus, AlignmentItemType } from '@/data/alignment'
import { ACTIVE_STATUSES } from '@/data/alignment'
import type { RefEntity } from '@/components/app/CommentThread'
import type { AlignmentStateAPI } from '../useAlignmentState'
import { STATUS_CONFIG, TYPE_CONFIG } from '../constants'
import { AlignmentItemRow } from './AlignmentItemRow'
import { AlignmentItemDetail } from './AlignmentItemDetail'
import { AlignmentCreateForm } from './AlignmentCreateForm'

interface Props {
  api: AlignmentStateAPI
  collectionId?: string
  commentCounts: Map<string, number>
  onOpenComments?: (ref?: RefEntity) => void
}

type FilterMode = 'all' | 'active' | 'resolved' | AlignmentItemStatus | AlignmentItemType

export function AlignmentListPage({ api, collectionId, commentCounts, onOpenComments }: Props) {
  const { payload, readOnly } = api
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState<FilterMode>('all')
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'number'>('updated')

  const filteredItems = useMemo(() => {
    let items = payload.items

    // Filter
    if (filter === 'active') {
      items = items.filter((i) => ACTIVE_STATUSES.has(i.status))
    } else if (filter === 'resolved') {
      items = items.filter((i) => !ACTIVE_STATUSES.has(i.status))
    } else if (filter !== 'all') {
      // Check if it's a status or type
      if (filter in STATUS_CONFIG) {
        items = items.filter((i) => i.status === filter)
      } else if (filter in TYPE_CONFIG) {
        items = items.filter((i) => i.type === filter)
      }
    }

    // Sort
    const sorted = [...items]
    if (sortBy === 'updated') {
      sorted.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    } else if (sortBy === 'created') {
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } else {
      sorted.sort((a, b) => b.itemNumber - a.itemNumber)
    }

    return sorted
  }, [payload.items, filter, sortBy])

  const selectedItem = selectedItemId ? payload.items.find((i) => i.id === selectedItemId) : null

  const activeCount = payload.items.filter((i) => ACTIVE_STATUSES.has(i.status)).length

  // Detail view
  if (selectedItem) {
    return (
      <AlignmentItemDetail
        item={selectedItem}
        api={api}
        collectionId={collectionId}
        onBack={() => setSelectedItemId(null)}
        onOpenComments={onOpenComments}
        commentCount={commentCounts.get(selectedItem.id) || 0}
      />
    )
  }

  // Create form
  if (showCreate) {
    return (
      <AlignmentCreateForm
        api={api}
        onClose={() => setShowCreate(false)}
        onCreated={(id) => setSelectedItemId(id)}
      />
    )
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-cream/30">
            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
            {filter === 'all' && activeCount > 0 && ` (${activeCount} active)`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!readOnly && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-sandstone text-basalt hover:bg-sandstone/90 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              Add Item
            </button>
          )}
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        {(['all', 'active', 'resolved'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
              filter === f
                ? 'bg-sandstone/15 text-sandstone border border-sandstone/25'
                : 'bg-cream/5 text-cream/40 border border-cream/8 hover:text-cream/60'
            }`}
          >
            {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Resolved'}
          </button>
        ))}
        <span className="w-px h-4 bg-cream/10 mx-1" />
        {/* Status filters */}
        <select
          value={filter in STATUS_CONFIG ? filter : ''}
          onChange={(e) => { if (e.target.value) setFilter(e.target.value as AlignmentItemStatus) }}
          className="px-2 py-1 rounded-full text-[11px] bg-cream/5 text-cream/40 border border-cream/8 focus:outline-none"
        >
          <option value="">Status...</option>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
        {/* Type filters */}
        <select
          value={filter in TYPE_CONFIG ? filter : ''}
          onChange={(e) => { if (e.target.value) setFilter(e.target.value as AlignmentItemType) }}
          className="px-2 py-1 rounded-full text-[11px] bg-cream/5 text-cream/40 border border-cream/8 focus:outline-none"
        >
          <option value="">Type...</option>
          {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
        <span className="w-px h-4 bg-cream/10 mx-1" />
        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'updated' | 'created' | 'number')}
          className="px-2 py-1 rounded-full text-[11px] bg-cream/5 text-cream/40 border border-cream/8 focus:outline-none"
        >
          <option value="updated">Last Updated</option>
          <option value="created">Newest First</option>
          <option value="number">By Number</option>
        </select>
      </div>

      {/* Items list */}
      <div className="space-y-2">
        {filteredItems.map((item) => (
          <AlignmentItemRow
            key={item.id}
            item={item}
            commentCount={commentCounts.get(item.id) || 0}
            isSelected={false}
            onClick={() => setSelectedItemId(item.id)}
          />
        ))}
        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-cream/30 text-sm">
            No items match this filter.
          </div>
        )}
      </div>
    </div>
  )
}
