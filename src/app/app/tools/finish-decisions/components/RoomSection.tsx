'use client'

import { useState, useRef, useEffect } from 'react'
import {
  ROOM_EMOJI_MAP,
  type RoomV3,
  type RoomTypeV3,
  type DecisionV3,
} from '@/data/finish-decisions'
import { DecisionsTable } from './DecisionsTable'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { TextConfirmDialog } from '@/components/ui/TextConfirmDialog'

export function RoomSection({
  room,
  isExpanded,
  onToggleExpand,
  onUpdateRoom,
  onDeleteRoom,
  onQuickAdd,
  onAddIdeasPack,
  readOnly = false,
  hasAvailableKits = false,
}: {
  room: RoomV3
  isExpanded: boolean
  onToggleExpand: () => void
  onUpdateRoom: (updates: Partial<RoomV3>) => void
  onDeleteRoom: () => void
  onQuickAdd: () => void
  onAddIdeasPack: () => void
  readOnly?: boolean
  hasAvailableKits?: boolean
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDeleteRoom, setConfirmDeleteRoom] = useState(false)
  const [confirmDeleteDecisionId, setConfirmDeleteDecisionId] = useState<string | null>(null)
  const [undoDecision, setUndoDecision] = useState<{ decision: DecisionV3; timer: ReturnType<typeof setTimeout> } | null>(null)
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

  // Clean up undo timer on unmount
  useEffect(() => {
    return () => {
      if (undoDecision) clearTimeout(undoDecision.timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const totalOptions = room.decisions.reduce((sum, d) => sum + d.options.length, 0)

  const stats = {
    total: room.decisions.length,
    selected: room.decisions.filter((d) => d.status === 'selected').length,
    ordered: room.decisions.filter((d) => d.status === 'ordered').length,
    done: room.decisions.filter((d) => d.status === 'done').length,
  }

  // Desktop: full format
  const summaryParts: string[] = []
  summaryParts.push(`${stats.total} total`)
  if (stats.selected > 0) summaryParts.push(`${stats.selected} selected`)
  if (stats.ordered > 0) summaryParts.push(`${stats.ordered} ordered`)
  if (stats.done > 0) summaryParts.push(`${stats.done} done`)

  // Mobile: compact format
  const mobileParts: string[] = [`${stats.total}`]
  if (stats.selected > 0) mobileParts.push(`${stats.selected} sel`)
  if (stats.ordered > 0) mobileParts.push(`${stats.ordered} ord`)
  if (stats.done > 0) mobileParts.push(`${stats.done} done`)

  function requestDeleteDecision(decisionId: string) {
    setConfirmDeleteDecisionId(decisionId)
  }

  function executeDeleteDecision(decisionId: string) {
    const deleted = room.decisions.find((d) => d.id === decisionId)
    onUpdateRoom({
      decisions: room.decisions.filter((d) => d.id !== decisionId),
      updatedAt: new Date().toISOString(),
    })
    setConfirmDeleteDecisionId(null)

    // Set up undo
    if (deleted) {
      if (undoDecision) clearTimeout(undoDecision.timer)
      const timer = setTimeout(() => setUndoDecision(null), 8000)
      setUndoDecision({ decision: deleted, timer })
    }
  }

  function handleUndo() {
    if (!undoDecision) return
    clearTimeout(undoDecision.timer)
    onUpdateRoom({
      decisions: [...room.decisions, undoDecision.decision],
      updatedAt: new Date().toISOString(),
    })
    setUndoDecision(null)
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

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 flex items-center justify-center shrink-0 text-sm leading-none">
              {roomEmoji}
            </span>
            <span className="text-cream font-medium text-lg">{room.name}</span>
            <span className="hidden md:inline text-xs text-cream/50 ml-1">
              {summaryParts.join(', ')}
            </span>
          </div>
          <div className="md:hidden text-[11px] text-cream/40 mt-0.5 ml-7">
            {mobileParts.join(' · ')}
          </div>
        </div>

        {/* Desktop inline actions */}
        {!readOnly && (
          <div className="hidden md:flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onQuickAdd() }}
              className="px-2 py-1 text-[11px] text-sandstone hover:text-sandstone-light transition-colors font-medium"
            >
              + Selection
            </button>
            <span className="text-cream/15 select-none">·</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onAddIdeasPack() }}
              className="px-2 py-1 text-[11px] text-cream/40 hover:text-cream/70 transition-colors"
            >
              Import ideas
            </button>
            <span className="text-cream/15 select-none">·</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setConfirmDeleteRoom(true) }}
              className="px-2 py-1 text-[11px] text-red-400/40 hover:text-red-400 transition-colors"
            >
              Delete
            </button>
          </div>
        )}

        {/* Mobile kebab menu */}
        {!readOnly && (
          <div className="md:hidden relative shrink-0" ref={menuRef}>
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
                    onAddIdeasPack()
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-cream/80 hover:bg-cream/5 transition-colors"
                >
                  Import ideas
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                    setConfirmDeleteRoom(true)
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

      {/* Undo banner */}
      {undoDecision && (
        <div className="flex items-center justify-between px-4 py-2 bg-cream/5 border-t border-cream/10 text-xs">
          <span className="text-cream/50">Selection deleted.</span>
          <button
            type="button"
            onClick={handleUndo}
            className="text-sandstone font-medium hover:text-sandstone-light transition-colors"
          >
            Undo
          </button>
        </div>
      )}

      {/* Ideas Pack nudge — show when room has decisions but few options */}
      {isExpanded && !readOnly && hasAvailableKits && room.decisions.length > 0 && totalOptions <= 1 && (
        <div className="mx-4 mt-1 mb-2 px-3 py-2 bg-sandstone/5 border border-sandstone/15 rounded-lg flex items-center justify-between">
          <span className="text-xs text-cream/50">
            Add starter ideas from a curated pack
          </span>
          <button
            type="button"
            onClick={onAddIdeasPack}
            className="text-xs text-sandstone font-medium hover:text-sandstone-light transition-colors"
          >
            Browse packs
          </button>
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-cream/10 px-4 py-4">
          <DecisionsTable
            decisions={room.decisions}
            roomType={room.type}
            onDeleteDecision={requestDeleteDecision}
            readOnly={readOnly}
          />
        </div>
      )}

      {/* Confirm delete room dialog — type room name to confirm */}
      {confirmDeleteRoom && (
        <TextConfirmDialog
          title="Delete room"
          message={`This will permanently delete "${room.name}" and all its selections and ideas. Type the room name to confirm.`}
          confirmText={room.name}
          onConfirm={() => { setConfirmDeleteRoom(false); onDeleteRoom() }}
          onCancel={() => setConfirmDeleteRoom(false)}
        />
      )}

      {/* Confirm delete selection dialog */}
      {confirmDeleteDecisionId && (
        <ConfirmDialog
          title="Delete selection"
          message="This will also delete all its options."
          onConfirm={() => executeDeleteDecision(confirmDeleteDecisionId)}
          onCancel={() => setConfirmDeleteDecisionId(null)}
        />
      )}
    </div>
  )
}
