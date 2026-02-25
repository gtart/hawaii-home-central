'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { STATUS_CONFIG_V3, type DecisionV3 } from '@/data/finish-decisions'
import { getHeroImage, displayUrl } from '@/lib/finishDecisionsImages'
import { relativeTime } from '@/lib/relativeTime'

function getSelectionThumbnail(decision: DecisionV3): string | null {
  // 1. Selected option with image
  for (const opt of decision.options) {
    if (opt.isSelected) {
      const hero = getHeroImage(opt)
      if (hero) return hero.thumbnailUrl || hero.url
      if (opt.thumbnailUrl) return opt.thumbnailUrl
      if (opt.imageUrl) return opt.imageUrl
    }
  }
  // 2. Most recent option with image
  const withImage = [...decision.options]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  for (const opt of withImage) {
    const hero = getHeroImage(opt)
    if (hero) return hero.thumbnailUrl || hero.url
    if (opt.thumbnailUrl) return opt.thumbnailUrl
    if (opt.imageUrl) return opt.imageUrl
  }
  return null
}

function safeStatusConfig(status: string) {
  return STATUS_CONFIG_V3[status as keyof typeof STATUS_CONFIG_V3] ?? STATUS_CONFIG_V3.deciding
}

export function SelectionsBoardView({
  decisions,
  onDeleteDecision,
  readOnly = false,
}: {
  decisions: DecisionV3[]
  roomType: string
  onDeleteDecision: (decisionId: string) => void
  readOnly?: boolean
}) {
  const router = useRouter()

  const sortedDecisions = useMemo(() => {
    return [...decisions].sort((a, b) => {
      // Pin uncategorized first
      const aUncat = a.systemKey === 'uncategorized' ? 0 : 1
      const bUncat = b.systemKey === 'uncategorized' ? 0 : 1
      if (aUncat !== bUncat) return aUncat - bUncat
      return a.title.localeCompare(b.title)
    })
  }, [decisions])

  if (decisions.length === 0) {
    return (
      <div className="text-center py-8 text-cream/50 text-sm">
        No selections yet. Use <strong className="text-cream/60">+ Selection</strong> in this room to get started.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {sortedDecisions.map((decision) => {
        const thumbnail = getSelectionThumbnail(decision)
        const statusCfg = safeStatusConfig(decision.status)
        const selectedOption = decision.options.find((o) => o.isSelected)

        return (
          <div
            key={decision.id}
            role="button"
            tabIndex={0}
            onClick={() => router.push(`/app/tools/finish-decisions/decision/${decision.id}`)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                router.push(`/app/tools/finish-decisions/decision/${decision.id}`)
              }
            }}
            className="bg-basalt-50 rounded-xl overflow-hidden border border-cream/10 hover:border-cream/25 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-sandstone/50"
          >
            {/* Thumbnail */}
            <div className="relative aspect-[4/3] bg-basalt overflow-hidden">
              {thumbnail ? (
                <>
                  <img
                    src={displayUrl(thumbnail)}
                    alt={decision.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-basalt to-basalt-50">
                  <svg className="w-8 h-8 text-cream/15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
              )}

              {/* Status badge overlay */}
              <div className="absolute bottom-2 right-2">
                {decision.systemKey === 'uncategorized' ? (
                  <span className="inline-flex items-center px-2 py-0.5 bg-amber-500/90 text-white text-[10px] font-medium rounded-full shadow-sm">
                    Unsorted
                  </span>
                ) : (
                  <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                )}
              </div>

              {/* Delete button (hover) */}
              {!readOnly && decision.systemKey !== 'uncategorized' && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDeleteDecision(decision.id) }}
                  className="absolute top-1.5 right-1.5 p-1 bg-black/40 rounded-full text-white/60 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>

            {/* Card body */}
            <div className="px-3 py-2.5">
              <h3 className="text-sm font-medium text-cream truncate leading-tight">
                {decision.title || 'Untitled Selection'}
              </h3>

              {selectedOption && (
                <p className="text-[11px] text-sandstone/70 truncate mt-0.5">
                  Selected: {selectedOption.name}
                </p>
              )}

              <div className="flex items-center gap-1.5 text-[10px] text-cream/35 mt-1.5">
                {decision.dueDate ? (
                  <span>
                    Due {new Date(decision.dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                ) : (
                  <span className="text-cream/20">No due</span>
                )}
                <span className="text-cream/15">·</span>
                <span>{decision.options.length} idea{decision.options.length !== 1 ? 's' : ''}</span>
              </div>

              <p className="text-[10px] text-cream/25 mt-0.5">
                {relativeTime(decision.updatedAt)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
