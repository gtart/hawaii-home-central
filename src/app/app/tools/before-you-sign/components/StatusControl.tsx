'use client'

import { cn } from '@/lib/utils'
import type { TriStatus } from '../types'

interface StatusControlProps {
  status: TriStatus
  onChange: (status: TriStatus) => void
  compact?: boolean
}

const CYCLE: TriStatus[] = ['unknown', 'yes', 'no']

function nextStatus(current: TriStatus): TriStatus {
  const idx = CYCLE.indexOf(current)
  return CYCLE[(idx + 1) % CYCLE.length]
}

export function StatusControl({ status, onChange, compact }: StatusControlProps) {
  if (compact) {
    return (
      <button
        type="button"
        onClick={() => onChange(nextStatus(status))}
        className={cn(
          'w-7 h-7 rounded-md flex items-center justify-center text-xs font-medium transition-colors shrink-0',
          status === 'yes' && 'bg-emerald-500/20 text-emerald-400',
          status === 'no' && 'bg-red-400/20 text-red-400',
          status === 'unknown' && 'bg-cream/5 text-cream/30'
        )}
        aria-label={`Status: ${status}. Click to change.`}
      >
        {status === 'yes' && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
        {status === 'no' && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        )}
        {status === 'unknown' && (
          <span className="text-[11px]">?</span>
        )}
      </button>
    )
  }

  return (
    <div className="inline-flex rounded-lg border border-cream/10 overflow-hidden shrink-0">
      {(['yes', 'no', 'unknown'] as TriStatus[]).map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={cn(
            'px-2.5 py-1.5 text-xs font-medium transition-colors flex items-center gap-1',
            status === s && s === 'yes' && 'bg-emerald-500/20 text-emerald-400',
            status === s && s === 'no' && 'bg-red-400/20 text-red-400',
            status === s && s === 'unknown' && 'bg-cream/10 text-cream/50',
            status !== s && 'text-cream/25 hover:text-cream/50 hover:bg-cream/5'
          )}
          aria-label={s === 'yes' ? 'Yes' : s === 'no' ? 'No' : 'Unknown'}
        >
          {s === 'yes' && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          {s === 'no' && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
          {s === 'unknown' && <span>?</span>}
          <span className="hidden sm:inline">
            {s === 'yes' ? 'Yes' : s === 'no' ? 'No' : '\u2014'}
          </span>
        </button>
      ))}
    </div>
  )
}
