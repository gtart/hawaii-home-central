'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface LinkedItem {
  itemNumber: number
  title: string
  status: string
  collectionId: string
}

interface Props {
  projectId: string | undefined | null
  entityId: string
}

/**
 * Lightweight badge that shows alignment items linked to a given entity
 * (e.g. a selection or fix item). Fetches from the API on mount.
 */
export function AlignmentLinkBadge({ projectId, entityId }: Props) {
  const [items, setItems] = useState<LinkedItem[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!projectId || !entityId) return
    let cancelled = false

    fetch(`/api/tools/project-alignment/linked-items?projectId=${projectId}&entityId=${entityId}`)
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
  }, [projectId, entityId])

  if (!loaded || items.length === 0) return null

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-400/5 border border-amber-400/10">
      <svg className="w-3.5 h-3.5 text-amber-400/60 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-[11px] text-amber-400/70 font-medium">
        {items.length} alignment item{items.length !== 1 ? 's' : ''}
      </span>
      <div className="flex flex-wrap gap-1.5 ml-1">
        {items.slice(0, 3).map((item) => (
          <Link
            key={`${item.collectionId}-${item.itemNumber}`}
            href={`/app/tools/project-alignment/${item.collectionId}`}
            className="text-[11px] text-amber-400/50 hover:text-amber-400 transition-colors"
            title={item.title}
          >
            #{item.itemNumber}
          </Link>
        ))}
        {items.length > 3 && (
          <span className="text-[11px] text-amber-400/30">+{items.length - 3} more</span>
        )}
      </div>
    </div>
  )
}
