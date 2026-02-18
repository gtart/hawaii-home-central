'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import type { BYSContractor } from '../types'

interface NotesTabProps {
  contractors: BYSContractor[]
  onUpdate: (id: string, updates: Partial<BYSContractor>) => void
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function ContractorNotes({
  contractor,
  onUpdate,
}: {
  contractor: BYSContractor
  onUpdate: (id: string, updates: Partial<BYSContractor>) => void
}) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current)
    }
  }, [])

  const handleNotesChange = useCallback(
    (value: string) => {
      setSaveStatus('saving')

      // Clear previous debounce timer
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current)

      // Debounce the actual save
      saveTimerRef.current = setTimeout(() => {
        onUpdate(contractor.id, {
          notes: value,
          notesUpdatedAt: new Date().toISOString(),
        })
        setSaveStatus('saved')

        // Clear "Saved" after 3 seconds
        statusTimerRef.current = setTimeout(() => {
          setSaveStatus('idle')
        }, 3000)
      }, 500)
    },
    [contractor.id, onUpdate]
  )

  return (
    <div className="bg-basalt-50 rounded-lg border border-cream/10 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-cream">{contractor.name}</h3>
        <div className="flex items-center gap-3">
          {/* Save status */}
          {saveStatus === 'saving' && (
            <span className="text-xs text-cream/40 animate-pulse">Saving...</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs text-sandstone/70">Saved</span>
          )}
          {/* Last updated */}
          {contractor.notesUpdatedAt && saveStatus === 'idle' && (
            <span className="text-xs text-cream/30">
              Updated {formatTimestamp(contractor.notesUpdatedAt)}
            </span>
          )}
        </div>
      </div>
      <textarea
        defaultValue={contractor.notes}
        onChange={(e) => handleNotesChange(e.target.value)}
        placeholder="Add notes about this contractor... meetings, impressions, questions to ask, red flags, things you liked..."
        className={cn(
          'w-full px-3 py-3 rounded-lg text-sm leading-relaxed',
          'bg-basalt border border-cream/15 text-cream',
          'placeholder:text-cream/25',
          'hover:border-cream/25',
          'focus:outline-none focus:border-sandstone focus:ring-1 focus:ring-sandstone',
          'resize-y min-h-[120px]'
        )}
        rows={5}
      />
    </div>
  )
}

export function NotesTab({ contractors, onUpdate }: NotesTabProps) {
  if (contractors.length === 0) {
    return (
      <div className="text-center py-12 text-cream/40 text-sm">
        Select a contractor to add notes.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {contractors.map((c) => (
        <ContractorNotes key={c.id} contractor={c} onUpdate={onUpdate} />
      ))}
    </div>
  )
}
