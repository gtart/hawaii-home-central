'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface LinkedItem {
  itemId: string
  itemNumber: number
  title: string
  status: string
  collectionId: string
  relationship: string
  entityLabel: string
}

interface Props {
  projectId: string | undefined | null
  entityId: string
  /** Optional: narrow link matching to a specific artifact type (e.g. 'selection', 'fix_item') */
  artifactType?: string
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  references: 'References',
  affects: 'Affects',
  supersedes: 'Supersedes',
  source_of_truth: 'Source of Truth',
}

const STATUS_STYLE: Record<string, string> = {
  open: 'text-amber-400/60',
  waiting_on_homeowner: 'text-blue-400/60',
  waiting_on_contractor: 'text-orange-400/60',
  needs_pricing: 'text-amber-400/60',
  needs_decision: 'text-amber-400/60',
  accepted: 'text-emerald-400/60',
  rejected: 'text-red-400/60',
  implemented: 'text-emerald-400/60',
  superseded: 'text-cream/30',
}

/**
 * Lightweight badge that shows alignment items linked to a given entity
 * (e.g. a selection or fix item). Fetches from the API on mount.
 * Deep-links to the specific alignment item within its collection.
 */
export function AlignmentLinkBadge({ projectId, entityId, artifactType }: Props) {
  const [items, setItems] = useState<LinkedItem[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!projectId || !entityId) return
    let cancelled = false

    const params = new URLSearchParams({ projectId, entityId })
    if (artifactType) params.set('artifactType', artifactType)

    fetch(`/api/tools/project-alignment/linked-items?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.items) {
          setItems(data.items)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })

    return () => { cancelled = true }
  }, [projectId, entityId, artifactType])

  if (!loaded || items.length === 0) return null

  // Filter out superseded items from prominent display (still counted)
  const activeItems = items.filter((i) => i.status !== 'superseded')
  const displayItems = activeItems.length > 0 ? activeItems : items

  return (
    <div className="rounded-lg bg-amber-400/5 border border-amber-400/10 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2">
        <svg className="w-3.5 h-3.5 text-amber-400/60 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-[11px] text-amber-400/70 font-medium">
          {items.length} alignment item{items.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="border-t border-amber-400/5 divide-y divide-amber-400/5">
        {displayItems.slice(0, 4).map((item) => (
          <Link
            key={`${item.collectionId}-${item.itemId}`}
            href={`/app/tools/project-alignment/${item.collectionId}?itemId=${item.itemId}`}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-amber-400/5 transition-colors group"
          >
            <span className={`text-[11px] font-mono ${STATUS_STYLE[item.status] || 'text-cream/40'}`}>
              #{item.itemNumber}
            </span>
            <span className="text-[11px] text-cream/60 truncate flex-1 group-hover:text-cream/80 transition-colors">
              {item.title}
            </span>
            <span className="text-[9px] text-cream/20 shrink-0">
              {RELATIONSHIP_LABELS[item.relationship] || item.relationship}
            </span>
          </Link>
        ))}
        {displayItems.length > 4 && (
          <div className="px-3 py-1.5 text-[10px] text-amber-400/30">
            +{displayItems.length - 4} more
          </div>
        )}
      </div>
    </div>
  )
}
