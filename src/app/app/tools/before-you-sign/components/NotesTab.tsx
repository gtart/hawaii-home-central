'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { useProject } from '@/contexts/ProjectContext'
import { cn } from '@/lib/utils'
import type { BYSContractor } from '../types'

interface Collaborator {
  id: string
  userId: string
  name: string | null
  email: string | null
  image: string | null
  level: 'VIEW' | 'EDIT'
}

interface NotesTabProps {
  contractors: BYSContractor[]
  onUpdate: (id: string, updates: Partial<BYSContractor>) => void
  toolKey?: string
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
    <div className="bg-basalt-50 rounded-lg border border-cream/10 p-4 flex flex-col">
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
          'resize-y min-h-[120px] flex-1'
        )}
        rows={5}
      />
    </div>
  )
}

function getInitials(name: string | null, email: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return parts[0].slice(0, 2).toUpperCase()
  }
  if (email) return email.slice(0, 2).toUpperCase()
  return '?'
}

function SharedWithBanner({ toolKey }: { toolKey: string }) {
  const { currentProject } = useProject()
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!currentProject?.id) return
    fetch(`/api/projects/${currentProject.id}/tools/${toolKey}/share`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.access) setCollaborators(data.access)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [currentProject?.id, toolKey])

  if (!loaded) return null

  return (
    <div className="bg-basalt-50 rounded-lg border border-cream/10 px-4 py-3 mb-4">
      <p className="text-xs text-cream/50 font-medium mb-2">Shared with the following:</p>
      {collaborators.length === 0 ? (
        <span className="text-xs text-cream/30">Only you</span>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {collaborators.map((c) => (
            <div
              key={c.id}
              className={cn(
                'inline-flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full text-xs font-medium',
                c.level === 'EDIT'
                  ? 'bg-sandstone/15 text-sandstone'
                  : 'bg-cream/10 text-cream/60'
              )}
            >
              {c.image ? (
                <Image
                  src={c.image}
                  alt=""
                  width={20}
                  height={20}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <span className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold',
                  c.level === 'EDIT'
                    ? 'bg-sandstone/25 text-sandstone'
                    : 'bg-cream/15 text-cream/50'
                )}>
                  {getInitials(c.name, c.email)}
                </span>
              )}
              <span className="leading-none">{c.name || c.email}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function NotesTab({ contractors, onUpdate, toolKey }: NotesTabProps) {
  if (contractors.length === 0) {
    return (
      <div className="text-center py-12 text-cream/40 text-sm">
        Select a contractor to add notes.
      </div>
    )
  }

  return (
    <div>
      {toolKey && <SharedWithBanner toolKey={toolKey} />}
      <div className={cn(
        'grid gap-4',
        contractors.length === 1 && 'grid-cols-1',
        contractors.length === 2 && 'grid-cols-1 md:grid-cols-2',
        contractors.length >= 3 && 'grid-cols-1 md:grid-cols-2',
      )}>
        {contractors.map((c) => (
          <ContractorNotes key={c.id} contractor={c} onUpdate={onUpdate} />
        ))}
      </div>
    </div>
  )
}
