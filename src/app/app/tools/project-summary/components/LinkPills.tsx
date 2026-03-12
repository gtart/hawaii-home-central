'use client'

import Link from 'next/link'
import type { SummaryLink } from '@/data/project-summary'

interface LinkPillsProps {
  links: SummaryLink[]
  onRemove?: (linkId: string) => void
  readOnly?: boolean
}

function linkHref(link: SummaryLink): string | null {
  if (link.linkType === 'selection' && link.entityId) {
    return `/app/tools/finish-decisions/decision/${link.entityId}`
  }
  if (link.linkType === 'fix_item' && link.collectionId && link.entityId) {
    return `/app/tools/punchlist/${link.collectionId}?itemId=${link.entityId}`
  }
  return null
}

function linkIcon(linkType: string) {
  if (linkType === 'selection') {
    return (
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 14l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (linkType === 'fix_item') {
    return (
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const TYPE_LABELS: Record<string, string> = {
  selection: 'Selection',
  fix_item: 'Fix Item',
  document: 'Document',
}

export function LinkPills({ links, onRemove, readOnly }: LinkPillsProps) {
  if (links.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {links.map((link) => {
        const href = linkHref(link)
        const pill = (
          <span
            key={link.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cream/5 border border-cream/[0.06] text-[10px] text-cream/50 group"
          >
            <span className="text-cream/30">{linkIcon(link.linkType)}</span>
            <span className="text-cream/40">{TYPE_LABELS[link.linkType] || link.linkType}:</span>
            <span className="text-cream/60 truncate max-w-[140px]">{link.label}</span>
            {!readOnly && onRemove && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(link.id) }}
                className="text-cream/20 hover:text-red-400/60 transition-colors ml-0.5 opacity-0 group-hover:opacity-100"
                title="Remove link"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </span>
        )

        if (href) {
          return (
            <Link key={link.id} href={href} className="hover:opacity-80 transition-opacity">
              {pill}
            </Link>
          )
        }

        return pill
      })}
    </div>
  )
}
