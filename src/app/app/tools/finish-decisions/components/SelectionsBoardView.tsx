'use client'

import { useState, useMemo } from 'react'
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

/** Stateful image with emoji fallback — no blank tiles */
function SelectionImage({ src, alt, emoji }: { src: string; alt: string; emoji: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-basalt to-basalt-50">
        <span className="text-4xl opacity-30">{emoji}</span>
      </div>
    )
  }
  return (
    <img
      src={displayUrl(src)}
      alt={alt}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}

function safeStatusConfig(status: string) {
  return STATUS_CONFIG_V3[status as keyof typeof STATUS_CONFIG_V3] ?? STATUS_CONFIG_V3.deciding
}

function getSelectionEmoji(title: string, emojiMap: Record<string, string>): string {
  const lower = title.toLowerCase()
  return emojiMap[lower] || '📋'
}

export function SelectionsBoardView({
  decisions,
  onDeleteDecision,
  onAddSelection,
  readOnly = false,
  emojiMap = {},
}: {
  decisions: DecisionV3[]
  roomType: string
  onDeleteDecision: (decisionId: string) => void
  onAddSelection?: () => void
  readOnly?: boolean
  emojiMap?: Record<string, string>
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
      <div data-testid="empty-state-selection" className="text-center py-8 text-cream/50 text-sm">
        No decisions yet.
        {onAddSelection && !readOnly && (
          <>
            {' '}
            <button
              type="button"
              onClick={onAddSelection}
              className="text-sandstone hover:text-sandstone-light font-medium transition-colors"
            >
              + Add a decision
            </button>{' '}
            to get started.
          </>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {sortedDecisions.map((decision) => {
        const thumbnail = getSelectionThumbnail(decision)
        const statusCfg = safeStatusConfig(decision.status)
        const selectedOption = decision.options.find((o) => o.isSelected)
        const userCommentCount = (decision.comments || []).filter((c) => c.authorEmail !== '').length

        const selectionEmoji = getSelectionEmoji(decision.title, emojiMap)

        return (
          <div
            key={decision.id}
            data-testid="selection-card"
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
            {/* Title row — above image */}
            <div className="px-3 pt-2.5 pb-1 flex items-center gap-1.5">
              <h3 className="text-sm font-medium text-cream truncate leading-tight flex-1">
                {decision.title || 'Untitled Decision'}
              </h3>
              {/* Delete button (hover) */}
              {!readOnly && decision.systemKey !== 'uncategorized' && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDeleteDecision(decision.id) }}
                  className="p-1 text-cream/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                  title="Delete"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>

            {/* Thumbnail */}
            <div className="relative aspect-[4/3] bg-basalt overflow-hidden">
              {thumbnail ? (
                <>
                  <SelectionImage src={thumbnail} alt={decision.title} emoji={selectionEmoji} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-basalt to-basalt-50">
                  <span className="text-4xl opacity-30">{selectionEmoji}</span>
                </div>
              )}

              {/* Status badge overlay */}
              <div className="absolute bottom-2 right-2">
                {decision.systemKey === 'uncategorized' ? (
                  <span className="inline-flex items-center px-2 py-0.5 bg-amber-500/90 text-white text-[10px] font-medium rounded-full shadow-sm">
                    Unsorted
                  </span>
                ) : (
                  <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full border shadow-sm ${statusCfg.pillClass}`}>
                    {statusCfg.label}
                  </span>
                )}
              </div>
            </div>

            {/* Card body */}
            <div className="px-3 py-2">
              {/* Final snippet or Done-without-final warning */}
              {selectedOption ? (
                <p className="text-[11px] text-sandstone/70 truncate">
                  Final: {selectedOption.name || 'Untitled'}
                </p>
              ) : decision.status === 'done' && decision.systemKey !== 'uncategorized' ? (
                <p className="text-[10px] text-red-400/70 inline-flex items-center gap-1">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  No final selected
                </p>
              ) : null}

              {/* Meta row: options pill, open, comments */}
              <div className="flex items-center gap-1.5 text-[11px] text-cream/55 mt-1">
                <span className="inline-flex items-center gap-1 px-1.5 h-[1.125rem] bg-cream/10 text-cream/50 text-[10px] font-medium rounded-full">
                  Options <span className="text-cream/25">&middot;</span> {decision.options.length}
                </span>
                <span className="text-cream/20">·</span>
                <button
                  type="button"
                  data-testid="selection-open"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/app/tools/finish-decisions/decision/${decision.id}`)
                  }}
                  className="text-sandstone hover:text-sandstone-light font-medium transition-colors"
                >
                  Open
                </button>
                {userCommentCount > 0 && (
                  <>
                    <span className="text-cream/20">·</span>
                    <span className="inline-flex items-center gap-0.5" title="Comments">
                      💬 {userCommentCount}
                    </span>
                  </>
                )}
              </div>

              {/* Due date + updated */}
              <div className="flex items-center gap-1.5 text-[10px] text-cream/40 mt-1">
                {decision.dueDate && (
                  <>
                    <span>
                      Due {new Date(decision.dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-cream/20">·</span>
                  </>
                )}
                <span>Updated {relativeTime(decision.updatedAt)}</span>
              </div>
            </div>
          </div>
        )
      })}

      {/* Add Decision tile */}
      {!readOnly && onAddSelection && (
        <button
          type="button"
          onClick={onAddSelection}
          className="rounded-xl border-2 border-dashed border-cream/15 hover:border-sandstone/40 bg-transparent hover:bg-sandstone/5 transition-all flex flex-col items-center justify-center gap-2 min-h-[200px] group/add focus:outline-none focus:ring-2 focus:ring-sandstone/50"
        >
          <div className="w-10 h-10 rounded-full bg-cream/5 group-hover/add:bg-sandstone/10 flex items-center justify-center transition-colors">
            <svg className="w-5 h-5 text-cream/30 group-hover/add:text-sandstone transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-xs text-cream/40 group-hover/add:text-cream/60 font-medium transition-colors">
            Add a decision
          </span>
        </button>
      )}

    </div>
  )
}
