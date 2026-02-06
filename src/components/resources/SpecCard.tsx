'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import type { HoldPointItemData } from '@/data/hold-points'

interface SpecCardProps {
  item: HoldPointItemData
  isChecked: boolean
  onToggle: (id: string) => void
}

export function SpecCard({ item, isChecked, onToggle }: SpecCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="py-3 border-b border-cream/5 last:border-b-0">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id={item.id}
          checked={isChecked}
          onChange={() => onToggle(item.id)}
          className="mt-1 h-4 w-4 shrink-0 rounded border-cream/30 bg-basalt-50 accent-sandstone cursor-pointer"
        />
        <label
          htmlFor={item.id}
          className={cn(
            'flex-1 text-sm leading-relaxed cursor-pointer transition-colors',
            isChecked ? 'line-through text-cream/40' : 'text-cream/80'
          )}
        >
          {item.label}
          {item.hawaiiCallout && (
            <Badge variant="accent" className="ml-2 relative -top-px">HI</Badge>
          )}
        </label>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Collapse detail' : 'Expand detail'}
          className="shrink-0 p-1 text-cream/40 hover:text-cream/70 transition-colors"
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

      <div
        className={cn(
          'overflow-hidden transition-all duration-200 ease-out',
          isExpanded ? 'max-h-[32rem] opacity-100 mt-3' : 'max-h-0 opacity-0'
        )}
      >
        <div className="pl-7 space-y-3">
          <div>
            <p className="text-sandstone text-xs font-medium uppercase tracking-wider mb-1">
              Why this matters
            </p>
            <p className="text-cream/60 text-sm leading-relaxed">
              {item.whyItMatters}
            </p>
          </div>
          <div>
            <p className="text-sandstone text-xs font-medium uppercase tracking-wider mb-1">
              What to confirm
            </p>
            <p className="text-cream/60 text-sm leading-relaxed">
              {item.whatToConfirm}
            </p>
          </div>
          {item.hawaiiCallout && (
            <div className="border-l-2 border-sandstone pl-4">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="accent">Hawai&#x02BB;i Note</Badge>
              </div>
              <p className="text-cream/60 text-sm leading-relaxed">
                {item.hawaiiCallout}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
