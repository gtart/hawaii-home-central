'use client'

import { useRef, useEffect } from 'react'
import type { CollectionMember } from '@/hooks/useCollectionMembers'

interface MentionPickerProps {
  members: CollectionMember[]
  filter: string
  onSelect: (member: CollectionMember) => void
  onClose: () => void
  /** Position relative to the textarea */
  position?: { top: number; left: number }
}

/**
 * Floating popover that shows collection members for @mention selection.
 * Appears when user types @ in a comment textarea.
 */
export function MentionPicker({ members, filter, onSelect, onClose, position }: MentionPickerProps) {
  const ref = useRef<HTMLDivElement>(null)

  // Filter members by the typed text after @
  const filtered = members.filter((m) => {
    if (!filter) return true
    const name = (m.name || '').toLowerCase()
    return name.includes(filter.toLowerCase())
  })

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  // Close on escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  if (filtered.length === 0) return null

  return (
    <div
      ref={ref}
      className="absolute z-50 w-56 max-h-40 overflow-y-auto rounded-lg border border-cream/10 bg-[#1a1a1a] shadow-xl"
      style={position ? { top: position.top, left: position.left } : { bottom: '100%', left: 0, marginBottom: 4 }}
    >
      <div className="py-1">
        <p className="px-3 py-1 text-[10px] text-cream/30 uppercase tracking-wider">Mention someone</p>
        {filtered.map((member) => (
          <button
            key={member.id}
            type="button"
            onClick={() => onSelect(member)}
            className="flex items-center gap-2 w-full px-3 py-2 text-left text-xs text-cream/70 hover:bg-cream/5 transition-colors"
          >
            <span className="w-5 h-5 rounded-full bg-sandstone/20 text-sandstone text-[10px] font-bold flex items-center justify-center flex-shrink-0">
              {(member.name || '?').charAt(0).toUpperCase()}
            </span>
            <span className="truncate">{member.name || 'Unknown'}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
