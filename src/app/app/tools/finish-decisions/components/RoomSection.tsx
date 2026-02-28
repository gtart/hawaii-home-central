'use client'

import { useState, useRef, useEffect } from 'react'
import {
  ROOM_EMOJI_MAP,
  type RoomV3,
  type RoomTypeV3,
  type DecisionV3,
  type StatusV3,
} from '@/data/finish-decisions'
import { DecisionsTable } from './DecisionsTable'
import { SelectionsBoardView } from './SelectionsBoardView'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { TextConfirmDialog } from '@/components/ui/TextConfirmDialog'

const SEL_VIEW_KEY = 'hhc_finish_selection_view_mode_v2'

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
  defaultDecisions = {} as Record<RoomTypeV3, string[]>,
  emojiMap = {},
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
  defaultDecisions?: Record<RoomTypeV3, string[]>
  emojiMap?: Record<string, string>
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleteStep, setDeleteStep] = useState<'none' | 'confirm' | 'type'>('none')
  const [confirmDeleteDecisionId, setConfirmDeleteDecisionId] = useState<string | null>(null)
  const [undoDecision, setUndoDecision] = useState<{ decision: DecisionV3; timer: ReturnType<typeof setTimeout> } | null>(null)
  const [populateBanner, setPopulateBanner] = useState<string | null>(null)
  const [selViewMode, setSelViewMode] = useState<'table' | 'tile'>(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(SEL_VIEW_KEY) : null
      return stored === 'table' ? 'table' : 'tile'
    } catch { return 'tile' }
  })
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try { localStorage.setItem(SEL_VIEW_KEY, selViewMode) } catch { /* ignore */ }
  }, [selViewMode])

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
  const uncatDecision = room.decisions.find((d) => d.systemKey === 'uncategorized')
  const uncatCount = uncatDecision ? uncatDecision.options.length : 0
  const regularDecisions = room.decisions.filter((d) => d.systemKey !== 'uncategorized')

  const stats = {
    total: regularDecisions.length,
    selected: regularDecisions.filter((d) => d.status === 'selected').length,
    ordered: regularDecisions.filter((d) => d.status === 'ordered').length,
    done: regularDecisions.filter((d) => d.status === 'done').length,
  }

  // Desktop: full format
  const summaryParts: string[] = []
  summaryParts.push(`${stats.total} decision${stats.total !== 1 ? 's' : ''}`)
  if (stats.selected > 0) summaryParts.push(`${stats.selected} selected`)
  if (stats.ordered > 0) summaryParts.push(`${stats.ordered} ordered`)
  if (stats.done > 0) summaryParts.push(`${stats.done} done`)
  if (uncatCount > 0) summaryParts.push(`${uncatCount} unsorted`)

  // Mobile: compact format
  const mobileParts: string[] = [`${stats.total}`]
  if (stats.selected > 0) mobileParts.push(`${stats.selected} sel`)
  if (stats.ordered > 0) mobileParts.push(`${stats.ordered} ord`)
  if (stats.done > 0) mobileParts.push(`${stats.done} done`)
  if (uncatCount > 0) mobileParts.push(`${uncatCount} unsorted`)

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
    // Filter out any existing entry with this ID first to prevent duplicates
    const withoutDupe = room.decisions.filter((d) => d.id !== undoDecision.decision.id)
    onUpdateRoom({
      decisions: [...withoutDupe, undoDecision.decision],
      updatedAt: new Date().toISOString(),
    })
    setUndoDecision(null)
  }

  function handleAutoPopulate() {
    const standardTitles = defaultDecisions[room.type as RoomTypeV3] || []
    const existingTitles = new Set(room.decisions.map((d) => d.title.toLowerCase().trim()))
    const missing = standardTitles.filter((t) => !existingTitles.has(t.toLowerCase().trim()))

    if (missing.length === 0) {
      setPopulateBanner('All standard decisions are already included.')
      setTimeout(() => setPopulateBanner(null), 4000)
      return
    }

    const now = new Date().toISOString()
    const newDecisions: DecisionV3[] = missing.map((title) => ({
      id: crypto.randomUUID(),
      title,
      status: 'deciding' as StatusV3,
      notes: '',
      options: [],
      createdAt: now,
      updatedAt: now,
    }))

    onUpdateRoom({
      decisions: [...room.decisions, ...newDecisions],
      updatedAt: now,
    })

    setPopulateBanner(`Added ${missing.length} decision${missing.length !== 1 ? 's' : ''}.`)
    setTimeout(() => setPopulateBanner(null), 4000)
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
              + Decision
            </button>
            <span className="text-cream/15 select-none">·</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleAutoPopulate() }}
              className="px-2 py-1 text-[11px] text-cream/40 hover:text-cream/70 transition-colors"
              title="Pre-fill with the typical decisions Hawaii homeowners make for this type of room"
            >
              Add common decisions
            </button>
            <span className="text-cream/15 select-none">·</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onAddIdeasPack() }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] text-purple-300/60 hover:text-purple-300 bg-purple-400/5 hover:bg-purple-400/10 rounded-full transition-all"
            >
              <span>✨</span> Decision Packs
            </button>
            <span className="text-cream/15 select-none">·</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setDeleteStep('confirm') }}
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
                  Add decision
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                    handleAutoPopulate()
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-cream/5 transition-colors"
                >
                  <span className="text-sm text-cream/80">Add common decisions</span>
                  <span className="block text-[11px] text-cream/35 mt-0.5">Typical decisions for this room type</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                    onAddIdeasPack()
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-cream/5 transition-colors"
                >
                  <span className="text-sm text-purple-300/80 flex items-center gap-1.5">
                    <span>✨</span> Decision Packs
                  </span>
                  <span className="block text-[11px] text-cream/35 mt-0.5 ml-5">Curated starter ideas for this room</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                    setDeleteStep('confirm')
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
          <span className="text-cream/50">Decision deleted.</span>
          <button
            type="button"
            onClick={handleUndo}
            className="text-sandstone font-medium hover:text-sandstone-light transition-colors"
          >
            Undo
          </button>
        </div>
      )}

      {/* Auto-populate banner */}
      {populateBanner && (
        <div className="flex items-center justify-between px-4 py-2 bg-sandstone/5 border-t border-cream/10 text-xs">
          <span className="text-cream/60">{populateBanner}</span>
          <button
            type="button"
            onClick={() => setPopulateBanner(null)}
            className="text-cream/30 hover:text-cream/50 transition-colors"
          >
            Dismiss
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
            Apply a Decision Pack
          </button>
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-cream/10 px-4 py-4">
          {/* View mode selector — small dropdown, defaults to tiles */}
          <div className="flex justify-end mb-3">
            <select
              value={selViewMode}
              onChange={(e) => setSelViewMode(e.target.value as 'table' | 'tile')}
              className="bg-basalt-50 text-cream/50 text-[11px] rounded-lg border border-cream/10 px-2 py-1 focus:outline-none focus:border-sandstone/40"
            >
              <option value="tile">Tiles</option>
              <option value="table">Table</option>
            </select>
          </div>

          {selViewMode === 'tile' ? (
            <SelectionsBoardView
              decisions={room.decisions}
              roomType={room.type}
              onDeleteDecision={requestDeleteDecision}
              onAddSelection={readOnly ? undefined : onQuickAdd}
              readOnly={readOnly}
              emojiMap={emojiMap}
            />
          ) : (
            <DecisionsTable
              decisions={room.decisions}
              roomType={room.type}
              onDeleteDecision={requestDeleteDecision}
              readOnly={readOnly}
              emojiMap={emojiMap}
            />
          )}
        </div>
      )}

      {/* Delete room — step 1: confirm intent */}
      {deleteStep === 'confirm' && (
        <ConfirmDialog
          title="Delete room?"
          message={`"${room.name}" and all its decisions and ideas will be permanently deleted. This cannot be undone.`}
          onConfirm={() => setDeleteStep('type')}
          onCancel={() => setDeleteStep('none')}
        />
      )}

      {/* Delete room — step 2: type room name to confirm */}
      {deleteStep === 'type' && (
        <TextConfirmDialog
          title="Confirm delete"
          message={`Type "${room.name}" to permanently delete this room.`}
          confirmText={room.name}
          onConfirm={() => { setDeleteStep('none'); onDeleteRoom() }}
          onCancel={() => setDeleteStep('none')}
        />
      )}

      {/* Confirm delete selection dialog */}
      {confirmDeleteDecisionId && (
        <ConfirmDialog
          title="Delete decision"
          message="This will also delete all its options."
          onConfirm={() => executeDeleteDecision(confirmDeleteDecisionId)}
          onCancel={() => setConfirmDeleteDecisionId(null)}
        />
      )}
    </div>
  )
}
