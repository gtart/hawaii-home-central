'use client'

import type { PunchlistItem } from '../types'
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../constants'

interface Props {
  item: PunchlistItem
  onTap: () => void
}

export function PunchlistItemCard({ item, onTap }: Props) {
  const statusCfg = STATUS_CONFIG[item.status]
  const priorityCfg = item.priority ? PRIORITY_CONFIG[item.priority] : null

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

      {/* Bottom row: status badge + date */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-cream/5">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
          {statusCfg.label}
        </span>

        <span className="text-cream/30 text-[11px]">
          {new Date(item.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  )
}
