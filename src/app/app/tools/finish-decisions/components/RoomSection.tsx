'use client'

import { useState, useRef, useEffect } from 'react'
import {
  ROOM_EMOJI_MAP,
  type RoomV3,
  type RoomTypeV3,
} from '@/data/finish-decisions'
import { DecisionsTable } from './DecisionsTable'

export function RoomSection({
  room,
  isExpanded,
  onToggleExpand,
  onUpdateRoom,
  onDeleteRoom,
  onQuickAdd,
  readOnly = false,
}: {
  room: RoomV3
  isExpanded: boolean
  onToggleExpand: () => void
  onUpdateRoom: (updates: Partial<RoomV3>) => void
  onDeleteRoom: () => void
  onQuickAdd: () => void
  readOnly?: boolean
}) {
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

  const stats = {
    total: room.decisions.length,
    selected: room.decisions.filter((d) => d.status === 'selected').length,
    ordered: room.decisions.filter((d) => d.status === 'ordered').length,
    done: room.decisions.filter((d) => d.status === 'done').length,
  }

  const summaryParts: string[] = []
  summaryParts.push(`${stats.total} total`)
  if (stats.selected > 0) summaryParts.push(`${stats.selected} selected`)
  if (stats.ordered > 0) summaryParts.push(`${stats.ordered} ordered`)
  if (stats.done > 0) summaryParts.push(`${stats.done} done`)

  const deleteDecision = (decisionId: string) => {
    if (confirm(`Delete this decision? This will also delete all its options.`)) {
      onUpdateRoom({
        decisions: room.decisions.filter((d) => d.id !== decisionId),
        updatedAt: new Date().toISOString(),
      })
    }
  }

  const roomEmoji = ROOM_EMOJI_MAP[room.type as RoomTypeV3] || '✏️'

  return (
    <div className="bg-basalt-50 rounded-card overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-basalt-50/80 transition-colors"
        onClick={onToggleExpand}
      >
        <span className="text-cream/50 text-sm select-none">
          {isExpanded ? '▼' : '▶'}
        </span>

        <h3 className="text-cream font-medium text-lg flex-1">
          <span className="mr-1.5">{roomEmoji}</span>
          {room.name}
        </h3>

        <span className="text-xs text-cream/50">
          {summaryParts.join(', ')}
        </span>

        {/* Kebab menu */}
        {!readOnly && (
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen(!menuOpen)
              }}
              className="p-1.5 text-cream/30 hover:text-cream/60 transition-colors"
              aria-label="Room options"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-basalt-50 border border-cream/15 rounded-lg shadow-lg py-1 min-w-[150px]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                    onQuickAdd()
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-cream/80 hover:bg-cream/5 transition-colors"
                >
                  Add selection
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                    if (confirm(`Delete ${room.name}? This will also delete all decisions and options.`)) {
                      onDeleteRoom()
                    }
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-cream/5 transition-colors"
                >
                  Delete room
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-cream/10 px-4 py-4">
          <DecisionsTable
            decisions={room.decisions}
            roomType={room.type}
            onDeleteDecision={deleteDecision}
            readOnly={readOnly}
          />
        </div>
      )}
    </div>
  )
}
