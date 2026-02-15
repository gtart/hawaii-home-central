'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { StatusControl } from './StatusControl'
import type { BYSConfigItem, BYSAnswer, TriStatus } from '../types'

interface ItemRowProps {
  item: BYSConfigItem
  answer: BYSAnswer
  onStatusChange: (status: TriStatus) => void
  onNotesChange: (notes: string) => void
  /** Whether this is a custom user-added item (shows remove button) */
  isCustom?: boolean
  onRemove?: () => void
}

export function ItemRow({
  item,
  answer,
  onStatusChange,
  onNotesChange,
  isCustom,
  onRemove,
}: ItemRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="py-3 border-b border-cream/5 last:border-b-0">
      <div className="flex items-center gap-3">
        {/* Label + badges */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 min-w-0 text-left flex items-center gap-2 flex-wrap"
        >
          <span className="text-sm text-cream/80">{item.shortLabel}</span>
          {item.priority === 'essential' && (
            <Badge variant="accent" className="text-[10px]">
              Essential
            </Badge>
          )}
          {item.variance === 'high' && (
            <Badge variant="accent" className="text-[10px]">
              High variance
            </Badge>
          )}
        </button>

        {/* Status control */}
        <StatusControl status={answer.status} onChange={onStatusChange} />

        {/* Remove button for custom items */}
        {isCustom && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 p-1 text-cream/30 hover:text-red-400 transition-colors"
            aria-label="Remove item"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        {/* Expand chevron */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Collapse detail' : 'Expand detail'}
          className="shrink-0 p-1 text-cream/30 hover:text-cream/60 transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              'transition-transform duration-200',
              isExpanded && 'rotate-180'
            )}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Expanded detail */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-200 ease-out',
          isExpanded ? 'max-h-[40rem] opacity-100 mt-3' : 'max-h-0 opacity-0'
        )}
      >
        <div className="pl-0 space-y-3">
          {/* Full question / label */}
          {item.fullLabel !== item.shortLabel && (
            <p className="text-cream/70 text-sm leading-relaxed">
              {item.fullLabel}
            </p>
          )}

          {/* Detail explanation */}
          <p className="text-cream/50 text-sm leading-relaxed">{item.detail}</p>

          {/* Often owner (handoffs) */}
          {item.oftenOwner && (
            <p className="text-cream/40 text-xs">
              Often handled by: <span className="text-cream/60">{item.oftenOwner}</span>
            </p>
          )}

          {/* Includes list (handoffs) */}
          {item.includes && item.includes.length > 0 && (
            <div>
              <p className="text-sandstone text-xs font-medium uppercase tracking-wider mb-1">
                What ownership includes
              </p>
              <ul className="list-disc list-inside text-cream/50 text-xs space-y-0.5">
                {item.includes.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Hawaii callout */}
          {item.hawaiiCallout && (
            <div className="border-l-2 border-sandstone pl-3">
              <p className="text-sandstone text-xs font-medium mb-0.5">
                Hawai&#x02BB;i note
              </p>
              <p className="text-cream/50 text-xs leading-relaxed">
                {item.hawaiiCallout}
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <p className="text-cream/40 text-xs font-medium uppercase tracking-wider mb-1">
              Notes
            </p>
            <textarea
              value={answer.notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Add notes\u2026"
              className={cn(
                'w-full px-3 py-2 rounded-lg text-sm leading-relaxed',
                'bg-basalt border border-cream/15 text-cream',
                'placeholder:text-cream/30',
                'hover:border-cream/25',
                'focus:outline-none focus:border-sandstone focus:ring-1 focus:ring-sandstone',
                'resize-y min-h-[3rem]'
              )}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
