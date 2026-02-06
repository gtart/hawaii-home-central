'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import {
  OWNER_OPTIONS,
  type OwnerOption,
  type ResponsibilityItemData,
} from '@/data/responsibility-matrix'

interface ResponsibilityRowProps {
  item: ResponsibilityItemData
  selectedOwner: OwnerOption | ''
  notes: string
  onOwnerChange: (id: string, owner: OwnerOption | '') => void
  onNotesChange: (id: string, notes: string) => void
}

export function ResponsibilityRow({
  item,
  selectedOwner,
  notes,
  onOwnerChange,
  onNotesChange,
}: ResponsibilityRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="py-3 border-b border-cream/5 last:border-b-0">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium uppercase tracking-wider text-cream/80">
              {item.category}
            </span>
            {item.variance === 'high' && (
              <Badge variant="accent">High variance</Badge>
            )}
          </div>
          <p className="text-xs text-cream/40 mt-0.5">
            Often: {item.oftenOwner}
          </p>
          <select
            value={selectedOwner}
            onChange={(e) =>
              onOwnerChange(item.id, e.target.value as OwnerOption | '')
            }
            aria-label={`Owner for ${item.category}`}
            className={cn(
              'mt-1.5 px-3 py-1.5 rounded-input text-sm',
              'bg-basalt-50 border border-cream/20',
              'hover:border-cream/30',
              'focus:outline-none focus:border-sandstone focus:ring-1 focus:ring-sandstone',
              'appearance-none pr-7',
              selectedOwner ? 'text-cream' : 'text-cream/40'
            )}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23f5f0e8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' opacity='0.4'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.5rem center',
              backgroundSize: '0.75rem',
            }}
          >
            <option value="">-- Select owner --</option>
            {OWNER_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Collapse detail' : 'Expand detail'}
          className="shrink-0 p-1 mt-0.5 text-cream/40 hover:text-cream/70 transition-colors"
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
          isExpanded ? 'max-h-[40rem] opacity-100 mt-3' : 'max-h-0 opacity-0'
        )}
      >
        <div className="space-y-3">
          <div>
            <p className="text-sandstone text-xs font-medium uppercase tracking-wider mb-1">
              What ownership includes
            </p>
            <ul className="list-disc list-inside text-cream/60 text-sm leading-relaxed space-y-1">
              {item.includes.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sandstone text-xs font-medium uppercase tracking-wider mb-1">
              Clarify now
            </p>
            <p className="text-cream/60 text-sm leading-relaxed italic">
              &ldquo;{item.clarifyQuestion}&rdquo;
            </p>
          </div>
          <div>
            <p className="text-sandstone text-xs font-medium uppercase tracking-wider mb-1">
              Common mismatch
            </p>
            <p className="text-cream/60 text-sm leading-relaxed">
              {item.commonMismatch}
            </p>
          </div>
          <div>
            <p className="text-cream/50 text-xs font-medium uppercase tracking-wider mb-1">
              Notes
            </p>
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(item.id, e.target.value)}
              placeholder="Add private notes..."
              className={cn(
                'w-full px-4 py-3 rounded-input text-sm leading-relaxed',
                'bg-basalt-50 border border-cream/20 text-cream',
                'placeholder:text-cream/40',
                'hover:border-cream/30',
                'focus:outline-none focus:border-sandstone focus:ring-1 focus:ring-sandstone',
                'resize-y min-h-[4rem]'
              )}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
