'use client'

import { useState } from 'react'

interface SectionHeaderProps {
  title: string
  count?: number
  defaultOpen?: boolean
  onAdd?: () => void
  addLabel?: string
  readOnly?: boolean
  extraActions?: React.ReactNode
  children: React.ReactNode
}

export function SectionHeader({
  title,
  count,
  defaultOpen = true,
  onAdd,
  addLabel = 'Add',
  readOnly,
  extraActions,
  children,
}: SectionHeaderProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="rounded-xl border border-cream/[0.06] bg-cream/[0.02]">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full px-5 py-4 text-left"
      >
        <svg
          className={`w-4 h-4 text-cream/30 transition-transform ${isOpen ? 'rotate-90' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="9 18 15 12 9 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h2 className="text-sm font-semibold text-cream/80 flex-1">{title}</h2>
        {typeof count === 'number' && (
          <span className="text-[11px] text-cream/30 tabular-nums">{count}</span>
        )}
        {!readOnly && onAdd && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onAdd() }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onAdd() } }}
            className="inline-flex items-center gap-1 text-[11px] text-sandstone/60 hover:text-sandstone transition-colors"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            {addLabel}
          </span>
        )}
        {extraActions && (
          <span onClick={(e) => e.stopPropagation()} className="flex items-center">
            {extraActions}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="px-5 pb-5">
          {children}
        </div>
      )}
    </div>
  )
}
