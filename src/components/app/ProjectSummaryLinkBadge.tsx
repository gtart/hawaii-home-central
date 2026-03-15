'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface LinkedEntry {
  entryId: string
  entryTitle: string
  entryType: 'change' | 'decision'
  status: string
  collectionId: string
}

interface Props {
  projectId: string | undefined | null
  entityId: string
}

const STATUS_STYLE: Record<string, string> = {
  requested: 'text-amber-400/60',
  awaiting_homeowner: 'text-blue-400/60',
  approved_by_homeowner: 'text-emerald-400/60',
  accepted_by_contractor: 'text-teal-400/60',
  done: 'text-cream/50',
  closed: 'text-red-400/60',
  // Legacy v1 statuses (for any cached/stale data)
  proposed: 'text-amber-400/60',
  approved: 'text-emerald-400/60',
  not_approved: 'text-red-400/60',
  open: 'text-amber-400/60',
  decided: 'text-emerald-400/60',
}

const TYPE_LABEL: Record<string, string> = {
  change: 'Change',
}

/** Build a deep-link URL to the specific entry in Change Log */
function entryHref(item: LinkedEntry): string {
  return `/app/tools/project-summary/${item.collectionId}?focus=change-${item.entryId}`
}

/**
 * Read-only badge showing Project Summary entries linked to a given entity
 * (e.g. a selection or fix item). Fetches from the linked-entities API on mount.
 *
 * This component is a drop-in replacement for AlignmentLinkBadge that points
 * at the new Project Summary tool instead of the old PAT.
 *
 * It does NOT modify any data. Read-only.
 */
export function ProjectSummaryLinkBadge({ projectId, entityId }: Props) {
  const [items, setItems] = useState<LinkedEntry[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!projectId || !entityId) return
    let cancelled = false

    fetch(`/api/tools/project-summary/linked-entities?projectId=${projectId}&entityId=${entityId}`)
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
    <div className="rounded-lg bg-cream/[0.03] border border-cream/[0.06] overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2">
        <svg className="w-3.5 h-3.5 text-cream/30 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M8 12h8M8 16h5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-[11px] text-cream/50 font-medium">
          {items.length} linked {items.length !== 1 ? 'changes' : 'change'}
        </span>
      </div>
      <div className="border-t border-cream/[0.04] divide-y divide-cream/[0.04]">
        {items.slice(0, 4).map((item) => (
          <Link
            key={item.entryId}
            href={entryHref(item)}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-cream/[0.03] transition-colors group"
          >
            <span className={`text-[10px] font-medium ${STATUS_STYLE[item.status] || 'text-cream/40'}`}>
              {TYPE_LABEL[item.entryType] || item.entryType}
            </span>
            <span className="text-[11px] text-cream/50 truncate flex-1 group-hover:text-cream/70 transition-colors">
              {item.entryTitle}
            </span>
          </Link>
        ))}
        {items.length > 4 && (
          <div className="px-3 py-1.5 text-[10px] text-cream/25">
            +{items.length - 4} more
          </div>
        )}
      </div>
    </div>
  )
}
