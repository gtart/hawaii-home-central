'use client'

import type { PunchlistItem, PunchlistStatus } from '../types'
import { STATUS_CONFIG, STATUS_CYCLE, PRIORITY_CONFIG } from '../constants'

interface Props {
  item: PunchlistItem
  onTap: () => void
  onStatusChange?: (itemId: string, status: PunchlistStatus) => void
}

function shortDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function PunchlistItemRow({ item, onTap, onStatusChange }: Props) {
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
      className="grid grid-cols-[2.5rem_1fr_8rem_8rem_4rem_5rem_3rem] gap-2 items-center px-4 py-2.5 border-b border-cream/5 last:border-0 cursor-pointer hover:bg-cream/3 transition-colors"
      onClick={onTap}
    >
      {/* Status dot */}
      {onStatusChange ? (
        <button
          type="button"
          onClick={cycleStatus}
          className={`w-2.5 h-2.5 rounded-full ${statusCfg.dot} hover:ring-2 hover:ring-offset-1 hover:ring-offset-basalt-50 hover:ring-current transition-all`}
          title={statusCfg.label}
        />
      ) : (
        <span className={`w-2.5 h-2.5 rounded-full ${statusCfg.dot}`} title={statusCfg.label} />
      )}

      {/* #N Title */}
      <div className="truncate text-sm text-cream">
        <span className="text-cream/30 text-xs">#{item.itemNumber}</span>{' '}
        {item.title || <span className="text-cream/40 italic">Untitled</span>}
      </div>

      {/* Location */}
      <span className="text-xs text-cream/50 truncate">{item.location || '—'}</span>

      {/* Assignee */}
      <span className="text-xs text-cream/50 truncate">{item.assigneeLabel || '—'}</span>

      {/* Priority */}
      {priorityCfg ? (
        <span className={`text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded text-center ${priorityCfg.className}`}>
          {priorityCfg.label}
        </span>
      ) : (
        <span className="text-cream/20 text-xs text-center">—</span>
      )}

      {/* Date */}
      <span className="text-[11px] text-cream/30 tabular-nums">{shortDate(item.createdAt)}</span>

      {/* Photo indicator */}
      <div className="flex justify-center">
        {item.photos.length > 0 && (
          <span className="inline-flex items-center gap-0.5 text-[10px] text-cream/30">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            {item.photos.length > 1 && item.photos.length}
          </span>
        )}
      </div>
    </div>
  )
}
