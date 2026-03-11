'use client'

import type { AlignmentItem } from '@/data/alignment'
import { STATUS_CONFIG, TYPE_CONFIG, COST_IMPACT_CONFIG, WAITING_ON_CONFIG } from '../constants'

interface Props {
  item: AlignmentItem
  commentCount: number
  isSelected: boolean
  onClick: () => void
}

export function AlignmentItemRow({ item, commentCount, isSelected, onClick }: Props) {
  const statusCfg = STATUS_CONFIG[item.status]
  const typeCfg = TYPE_CONFIG[item.type]
  const costCfg = COST_IMPACT_CONFIG[item.cost_impact_status]
  const waitingCfg = WAITING_ON_CONFIG[item.waiting_on_role]

  const updatedAgo = formatRelative(item.updated_at)

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-colors ${
        isSelected
          ? 'border-sandstone/30 bg-sandstone/5'
          : 'border-cream/8 bg-basalt-50 hover:border-cream/15 hover:bg-cream/[0.02]'
      }`}
    >
      {/* Top row: number, title, status */}
      <div className="flex items-start gap-3 mb-2">
        <span className="text-xs text-cream/30 font-mono mt-0.5 shrink-0">#{item.itemNumber}</span>
        <h4 className="flex-1 text-sm font-medium text-cream leading-snug line-clamp-2">{item.title}</h4>
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${statusCfg.bg} ${statusCfg.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
          {statusCfg.label}
        </span>
      </div>

      {/* Current agreed answer preview */}
      {item.current_agreed_answer && (
        <div className="mb-2 ml-7 px-2.5 py-1.5 rounded-lg bg-emerald-400/5 border border-emerald-400/10">
          <p className="text-xs text-emerald-400/80 line-clamp-1">
            <span className="font-medium">Agreed:</span> {item.current_agreed_answer}
          </p>
        </div>
      )}

      {/* Meta row */}
      <div className="flex items-center gap-3 ml-7 flex-wrap">
        <span className="text-[11px] text-cream/40">{typeCfg.short}</span>
        {item.area_label && (
          <span className="text-[11px] text-cream/30">{item.area_label}</span>
        )}
        {item.waiting_on_role !== 'none' && (
          <span className="text-[11px] text-cream/40">
            Waiting: <span className="text-cream/60">{waitingCfg.label}</span>
          </span>
        )}
        {item.cost_impact_status !== 'none' && item.cost_impact_status !== 'unknown' && (
          <span className={`text-[11px] ${costCfg.className}`}>
            Cost: {costCfg.label}
            {item.cost_impact_amount_text && ` (${item.cost_impact_amount_text})`}
          </span>
        )}
        {commentCount > 0 && (
          <span className="text-[11px] text-cream/30 flex items-center gap-1">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {commentCount}
          </span>
        )}
        {item.guest_responses.length > 0 && (
          <span className="text-[11px] text-cream/30">
            {item.guest_responses.length} response{item.guest_responses.length !== 1 ? 's' : ''}
          </span>
        )}
        <span className="text-[11px] text-cream/20 ml-auto">{updatedAgo}</span>
      </div>
    </button>
  )
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
