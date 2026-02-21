'use client'

import type { PunchlistItem, PunchlistStatus } from '../types'
import { STATUS_CONFIG, STATUS_CYCLE, PRIORITY_CONFIG } from '../constants'

interface Props {
  item: PunchlistItem
  onTap: () => void
  onStatusChange?: (itemId: string, status: PunchlistStatus) => void
}

export function PunchlistItemCard({ item, onTap, onStatusChange }: Props) {
  const statusCfg = STATUS_CONFIG[item.status]
  const priorityCfg = item.priority ? PRIORITY_CONFIG[item.priority] : null

  function cycleStatus(e: React.MouseEvent) {
    e.stopPropagation()
    if (!onStatusChange) return
    const idx = STATUS_CYCLE.indexOf(item.status)
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
    onStatusChange(item.id, next)
  }

  return (
    <div
      className="bg-basalt-50 rounded-card p-4 sm:p-5 cursor-pointer active:bg-basalt-50/80 transition-colors"
      onClick={onTap}
    >
      {/* Top row: photo thumb + info */}
      <div className="flex gap-4">
        {/* Photo thumbnail */}
        {item.photos.length > 0 && (
          <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden relative">
            <img
              src={item.photos[0].thumbnailUrl || item.photos[0].url}
              alt={item.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {item.photos.length > 1 && (
              <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[10px] px-1 rounded">
                +{item.photos.length - 1}
              </span>
            )}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-cream font-medium text-sm sm:text-base truncate">
            {item.title}
          </h3>

          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span className="text-cream/50 text-xs">{item.location}</span>
            <span className="text-cream/20">&middot;</span>
            <span className="text-cream/50 text-xs">{item.assigneeLabel}</span>
            {priorityCfg && (
              <>
                <span className="text-cream/20">&middot;</span>
                <span className={`text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded ${priorityCfg.className}`}>
                  {priorityCfg.label}
                </span>
              </>
            )}
          </div>

          {item.notes && (
            <p className="text-cream/40 text-xs mt-2 line-clamp-2 leading-relaxed">
              {item.notes}
            </p>
          )}
        </div>
      </div>

      {/* Latest comment */}
      {item.comments && item.comments.length > 0 && (() => {
        const latest = item.comments[item.comments.length - 1]
        return (
          <div className="mt-3 pt-3 border-t border-cream/5 flex items-start gap-2">
            <svg className="w-3.5 h-3.5 text-cream/25 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-cream/40 text-xs line-clamp-1">{latest.text}</p>
              <p className="text-cream/25 text-[10px] mt-0.5">
                {latest.authorName} &middot; {new Date(latest.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        )
      })()}

      {/* Bottom row: status badge + date */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-cream/5">
        {onStatusChange ? (
          <button
            type="button"
            onClick={cycleStatus}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text} hover:opacity-80 active:scale-95 transition-all cursor-pointer`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
            {statusCfg.label}
          </button>
        ) : (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
            {statusCfg.label}
          </span>
        )}

        <span className="text-cream/30 text-[11px]">
          {new Date(item.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  )
}
