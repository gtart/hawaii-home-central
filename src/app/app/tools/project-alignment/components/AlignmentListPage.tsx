'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import type { AlignmentItem, AlignmentItemStatus, AlignmentItemType } from '@/data/alignment'
import { ACTIVE_STATUSES } from '@/data/alignment'
import type { RefEntity } from '@/components/app/CommentThread'
import type { AlignmentStateAPI } from '../useAlignmentState'
import { STATUS_CONFIG, TYPE_CONFIG } from '../constants'
import { AlignmentItemRow } from './AlignmentItemRow'
import { AlignmentItemDetail } from './AlignmentItemDetail'
import { AlignmentCreateForm, type InitialArtifactLink } from './AlignmentCreateForm'

interface Props {
  api: AlignmentStateAPI
  collectionId?: string
  commentCounts: Map<string, number>
  onOpenComments?: (ref?: RefEntity) => void
}

type QuickFilter = 'all' | 'active' | 'resolved' | 'waiting_on_you' | 'waiting_on_contractor' | 'needs_action' | 'has_cost'
type FilterMode = QuickFilter | AlignmentItemStatus | AlignmentItemType

function isWaitingOnYou(i: AlignmentItem) {
  return i.status === 'waiting_on_homeowner' || (ACTIVE_STATUSES.has(i.status) && i.waiting_on_role === 'homeowner')
}
function isWaitingOnContractor(i: AlignmentItem) {
  return i.status === 'waiting_on_contractor' || (ACTIVE_STATUSES.has(i.status) && i.waiting_on_role === 'contractor')
}
function needsAction(i: AlignmentItem) {
  return i.status === 'needs_pricing' || i.status === 'needs_decision'
}
function hasCostImpact(i: AlignmentItem) {
  return i.cost_impact_status === 'possible' || i.cost_impact_status === 'confirmed'
}

export function AlignmentListPage({ api, collectionId, commentCounts, onOpenComments }: Props) {
  const { payload, readOnly } = api
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState<FilterMode>('all')
  const [areaFilter, setAreaFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'number'>('updated')

  // Deep-link: auto-select item from ?itemId= query param (e.g. from AlignmentLinkBadge)
  const searchParams = useSearchParams()
  const deepLinkProcessed = useRef(false)
  useEffect(() => {
    if (deepLinkProcessed.current) return
    const itemId = searchParams.get('itemId')
    if (itemId && payload.items.some((i) => i.id === itemId)) {
      deepLinkProcessed.current = true
      setSelectedItemId(itemId)
    }
  }, [searchParams, payload.items])

  // Pre-linked creation via sessionStorage (set by "Create Alignment Issue" buttons on other tools)
  const createFromProcessed = useRef(false)
  const [pendingLink, setPendingLink] = useState<{ link: InitialArtifactLink; title: string } | null>(null)
  useEffect(() => {
    if (createFromProcessed.current) return
    try {
      const raw = sessionStorage.getItem('hhc_alignment_create_link')
      if (!raw) return
      createFromProcessed.current = true
      sessionStorage.removeItem('hhc_alignment_create_link')
      const data = JSON.parse(raw) as {
        artifact_type: string; entity_label: string; entity_id?: string;
        tool_key?: string; collection_id?: string
      }
      setPendingLink({
        link: {
          artifact_type: data.artifact_type as InitialArtifactLink['artifact_type'],
          relationship: 'references',
          entity_label: data.entity_label,
          entity_id: data.entity_id,
          tool_key: data.tool_key,
          collection_id: data.collection_id,
        },
        title: data.entity_label ? `Re: ${data.entity_label}` : '',
      })
      setShowCreate(true)
    } catch { /* ignore */ }
  }, [])

  // Collect unique areas for filter dropdown
  const areas = useMemo(() => {
    const set = new Set<string>()
    payload.items.forEach((i) => { if (i.area_label) set.add(i.area_label) })
    return Array.from(set).sort()
  }, [payload.items])

  const filteredItems = useMemo(() => {
    let items = payload.items

    // Area filter
    if (areaFilter) {
      items = items.filter((i) => i.area_label === areaFilter)
    }

    // Quick / status / type filter
    if (filter === 'active') {
      items = items.filter((i) => ACTIVE_STATUSES.has(i.status))
    } else if (filter === 'resolved') {
      items = items.filter((i) => !ACTIVE_STATUSES.has(i.status))
    } else if (filter === 'waiting_on_you') {
      items = items.filter(isWaitingOnYou)
    } else if (filter === 'waiting_on_contractor') {
      items = items.filter(isWaitingOnContractor)
    } else if (filter === 'needs_action') {
      items = items.filter(needsAction)
    } else if (filter === 'has_cost') {
      items = items.filter(hasCostImpact)
    } else if (filter !== 'all') {
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
  }, [payload.items, filter, areaFilter, sortBy])

  const selectedItem = selectedItemId ? payload.items.find((i) => i.id === selectedItemId) : null

  // Counts for quick filter badges
  const counts = useMemo(() => {
    const items = payload.items
    return {
      active: items.filter((i) => ACTIVE_STATUSES.has(i.status)).length,
      resolved: items.filter((i) => !ACTIVE_STATUSES.has(i.status)).length,
      waitingOnYou: items.filter(isWaitingOnYou).length,
      waitingOnContractor: items.filter(isWaitingOnContractor).length,
      needsAction: items.filter(needsAction).length,
      hasCost: items.filter(hasCostImpact).length,
    }
  }, [payload.items])

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
        onClose={() => { setShowCreate(false); setPendingLink(null) }}
        onCreated={(id) => setSelectedItemId(id)}
        initialTitle={pendingLink?.title}
        initialLink={pendingLink?.link}
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
            {filter === 'all' && !areaFilter && counts.active > 0 && ` (${counts.active} active)`}
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

      {/* Quick filter chips */}
      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        {([
          { key: 'all' as QuickFilter, label: 'All', count: payload.items.length },
          { key: 'active' as QuickFilter, label: 'Active', count: counts.active },
          { key: 'waiting_on_you' as QuickFilter, label: 'Waiting on You', count: counts.waitingOnYou },
          { key: 'waiting_on_contractor' as QuickFilter, label: 'Waiting on Contractor', count: counts.waitingOnContractor },
          { key: 'needs_action' as QuickFilter, label: 'Needs Action', count: counts.needsAction },
          { key: 'has_cost' as QuickFilter, label: 'Cost Impact', count: counts.hasCost },
          { key: 'resolved' as QuickFilter, label: 'Resolved', count: counts.resolved },
        ]).map((f) => (
          // Hide zero-count chips except always-visible ones
          f.count === 0 && f.key !== 'all' && f.key !== 'active' && f.key !== 'resolved' ? null : (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                filter === f.key
                  ? 'bg-sandstone/15 text-sandstone border border-sandstone/25'
                  : 'bg-cream/5 text-cream/40 border border-cream/8 hover:text-cream/60'
              }`}
            >
              {f.label}
              {f.count > 0 && f.key !== 'all' && (
                <span className="ml-1 text-[10px] opacity-60">{f.count}</span>
              )}
            </button>
          )
        ))}
      </div>

      {/* Secondary filters: status, type, area, sort */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
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
        {areas.length > 0 && (
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="px-2 py-1 rounded-full text-[11px] bg-cream/5 text-cream/40 border border-cream/8 focus:outline-none"
          >
            <option value="">All Areas</option>
            {areas.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        )}
        <span className="w-px h-4 bg-cream/10 mx-0.5" />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'updated' | 'created' | 'number')}
          className="px-2 py-1 rounded-full text-[11px] bg-cream/5 text-cream/40 border border-cream/8 focus:outline-none"
        >
          <option value="updated">Last Updated</option>
          <option value="created">Newest First</option>
          <option value="number">By Number</option>
        </select>
        {(filter !== 'all' || areaFilter) && (
          <button
            type="button"
            onClick={() => { setFilter('all'); setAreaFilter('') }}
            className="px-2 py-1 text-[11px] text-cream/30 hover:text-cream/50 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Items list */}
      <div className="space-y-2">
        {filteredItems.map((item) => (
          <AlignmentItemRow
            key={item.id}
            item={item}
            allItems={payload.items}
            commentCount={commentCounts.get(item.id) || 0}
            isSelected={false}
            onClick={() => setSelectedItemId(item.id)}
          />
        ))}
        {filteredItems.length === 0 && payload.items.length > 0 && (
          <div className="text-center py-12 text-cream/30 text-sm">
            No items match this filter.
            <button
              type="button"
              onClick={() => { setFilter('all'); setAreaFilter('') }}
              className="text-sandstone/60 hover:text-sandstone ml-2 transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
