'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { STATUS_CONFIG_V3, type DecisionV3 } from '@/data/finish-decisions'

export function DecisionCard({
  decision,
  milestone,
  onDelete,
  readOnly = false,
}: {
  decision: DecisionV3
  milestone?: { label: string } | null
  onDelete: () => void
  readOnly?: boolean
}) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  const statusConfig = STATUS_CONFIG_V3[decision.status]

  const formatRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div
      className="bg-basalt-50 rounded-card p-4 cursor-pointer hover:bg-basalt-50/80 transition-colors"
      onClick={() => router.push(`/app/tools/finish-decisions/decision/${decision.id}`)}
    >
      {/* Top row: title + kebab */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-medium text-cream leading-tight">
          {decision.title || 'Untitled Decision'}
        </h3>
        {!readOnly && (
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen(!menuOpen)
              }}
              className="p-1 text-cream/30 hover:text-cream/60 transition-colors"
              aria-label="Decision options"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-basalt-50 border border-cream/15 rounded-lg shadow-lg py-1 min-w-[120px]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                    onDelete()
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-cream/5 transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status + due date row */}
      <div className="flex items-center gap-2 mb-1.5">
        <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
        {decision.dueDate ? (
          <span className="text-[11px] text-cream/50">
            Due{' '}
            {new Date(decision.dueDate + 'T00:00:00').toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        ) : (
          <span className="text-[11px] text-cream/20">No due date</span>
        )}
      </div>

      {/* Milestone badge */}
      {milestone && (
        <span className="inline-block text-[11px] text-sandstone/70 bg-sandstone/10 px-2 py-0.5 rounded-full mb-1.5">
          {milestone.label}
        </span>
      )}

      {/* Meta line */}
      <div className="flex items-center gap-2 text-[11px] text-cream/40">
        <span>
          {decision.options.length} option{decision.options.length !== 1 ? 's' : ''}
        </span>
        <span className="text-cream/15">·</span>
        <span>{formatRelativeDate(decision.updatedAt)}</span>
      </div>
    </div>
  )
}
