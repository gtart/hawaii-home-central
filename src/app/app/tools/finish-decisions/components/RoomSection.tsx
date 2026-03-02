'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { relativeTime } from '@/lib/relativeTime'
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
  availableKitCount = 0,
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
  availableKitCount?: number
  defaultDecisions?: Record<RoomTypeV3, string[]>
  emojiMap?: Record<string, string>
}) {
  const [expandedMenuOpen, setExpandedMenuOpen] = useState(false)
  const [deleteStep, setDeleteStep] = useState<'none' | 'confirm' | 'type'>('none')
  const [confirmDeleteDecisionId, setConfirmDeleteDecisionId] = useState<string | null>(null)
  const [undoDecision, setUndoDecision] = useState<{ decision: DecisionV3; timer: ReturnType<typeof setTimeout> } | null>(null)
  const [populateBanner, setPopulateBanner] = useState<string | null>(null)
  const [selViewMode, setSelViewMode] = useState<'table' | 'tile'>(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(SEL_VIEW_KEY) : null
      return stored === 'tile' ? 'tile' : 'table'
    } catch { return 'table' }
  })
  const expandedMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try { localStorage.setItem(SEL_VIEW_KEY, selViewMode) } catch { /* ignore */ }
  }, [selViewMode])

  useEffect(() => {
    if (!expandedMenuOpen) return
    function handleClick(e: MouseEvent) {
      if (expandedMenuRef.current && !expandedMenuRef.current.contains(e.target as Node)) {
        setExpandedMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [expandedMenuOpen])

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
  const remaining = stats.total - stats.ordered - stats.done

  // Last updated across room + all decisions
  const lastUpdated = (() => {
    let latest = room.updatedAt
    for (const d of room.decisions) {
      if (d.updatedAt > latest) latest = d.updatedAt
    }
    return latest
  })()

  // Recent comment (within 3 days)
  const recentComment = (() => {
    const threeDays = 3 * 24 * 60 * 60 * 1000
    let latest: { authorName: string; createdAt: string } | null = null
    for (const d of room.decisions) {
      for (const c of d.comments || []) {
        if (c.authorEmail === '') continue
        const age = Date.now() - new Date(c.createdAt).getTime()
        if (age > threeDays) continue
        if (!latest || c.createdAt > latest.createdAt) {
          latest = { authorName: c.authorName, createdAt: c.createdAt }
        }
      }
    }
    return latest
  })()

  // Common decisions gating
  const standardTitles = defaultDecisions[room.type as RoomTypeV3] || []
  const existingTitles = new Set(room.decisions.map(d => d.title.toLowerCase().trim()))
  const missingDefaults = standardTitles.filter(t => !existingTitles.has(t.toLowerCase().trim()))
  const showCommonDecisions = !readOnly && regularDecisions.length < 5 && missingDefaults.length > 0

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
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 flex items-center justify-center shrink-0 text-sm leading-none">
              {roomEmoji}
            </span>
            <span className="text-cream font-medium text-base">{room.name}</span>
            {!isExpanded && (
              <div className="hidden md:flex items-center gap-2 ml-1 text-[11px] text-cream/40">
                {remaining > 0 && <span>{remaining} remaining</span>}
                {stats.ordered > 0 && <span>{stats.ordered} ordered</span>}
                {stats.done > 0 && <span>{stats.done} done</span>}
                {remaining === 0 && stats.ordered === 0 && stats.done === 0 && stats.total === 0 && (
                  <span>No decisions</span>
                )}
                {recentComment && (
                  <span className="text-cream/30">💬 {relativeTime(recentComment.createdAt)} by {recentComment.authorName.split(' ')[0]}</span>
                )}
              </div>
            )}
          </div>
          {!isExpanded && (
            <div className="md:hidden flex items-center gap-2 mt-1 ml-7 text-[11px] text-cream/40 flex-wrap">
              {remaining > 0 && <span>{remaining} remaining</span>}
              {stats.ordered > 0 && <span>{stats.ordered} ordered</span>}
              {stats.done > 0 && <span>{stats.done} done</span>}
              {remaining === 0 && stats.ordered === 0 && stats.done === 0 && stats.total === 0 && (
                <span>No decisions</span>
              )}
              {recentComment && (
                <span className="text-cream/30">💬 {relativeTime(recentComment.createdAt)} by {recentComment.authorName.split(' ')[0]}</span>
              )}
            </div>
          )}
        </div>

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
      {isExpanded && !readOnly && availableKitCount > 0 && room.decisions.length > 0 && totalOptions <= 1 && (
        <div className="mx-4 mt-1 mb-2 px-3 py-2 bg-sandstone/5 border border-sandstone/15 rounded-lg flex items-center justify-between">
          <span className="text-xs text-cream/50">
            Add starter options from a curated pack
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

      {/* Expanded Content — workspace header + decisions */}
      {isExpanded && (
        <div className="border-t border-cream/10 px-4 py-4">
          {/* Desktop workspace header */}
          <div className="hidden md:flex items-center gap-2 mb-3">
            <div className="flex items-center gap-2 text-xs text-cream/50 flex-1 min-w-0">
              <span className="font-medium text-cream/70">{room.name}</span>
              <span className="text-cream/20">&middot;</span>
              <span>{stats.total} decision{stats.total !== 1 ? 's' : ''}</span>
              <span className="text-cream/20">&middot;</span>
              <span>Updated {relativeTime(lastUpdated)}</span>
            </div>
            {!readOnly && (
              <button
                type="button"
                onClick={onQuickAdd}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-basalt bg-sandstone hover:bg-sandstone-light rounded-lg transition-colors"
              >
                + Add decision
              </button>
            )}
            {!readOnly && availableKitCount > 0 && (
              <button
                type="button"
                onClick={onAddIdeasPack}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-purple-300/70 hover:text-purple-300 bg-purple-400/5 hover:bg-purple-400/10 rounded-lg transition-all"
              >
                <span>✨</span> Import Decision Pack
              </button>
            )}
            {showCommonDecisions && (
              <button
                type="button"
                onClick={handleAutoPopulate}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-cream/50 hover:text-cream/70 bg-cream/5 hover:bg-cream/10 rounded-lg transition-colors"
              >
                + Common ({missingDefaults.length})
              </button>
            )}
            <select
              value={selViewMode}
              onChange={(e) => setSelViewMode(e.target.value as 'table' | 'tile')}
              className="bg-basalt-50 text-cream/50 text-[11px] rounded-lg border border-cream/10 px-2 py-1 focus:outline-none focus:border-sandstone/40"
            >
              <option value="table">List</option>
              <option value="tile">Tiles</option>
            </select>
            <Link
              href={`/app/tools/finish-decisions/room/${room.id}`}
              className="text-xs text-cream/40 hover:text-cream/70 transition-colors"
            >
              Open area
            </Link>
            {!readOnly && (
              <button
                type="button"
                onClick={() => setDeleteStep('confirm')}
                className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
              >
                Delete area
              </button>
            )}
          </div>

          {/* Mobile workspace header */}
          <div className="md:hidden mb-3 space-y-2">
            <div className="flex items-center gap-2 text-xs text-cream/50">
              <span className="font-medium text-cream/70">{room.name}</span>
              <span className="text-cream/20">&middot;</span>
              <span>{stats.total} decision{stats.total !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {!readOnly && (
                <button
                  type="button"
                  onClick={onQuickAdd}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-basalt bg-sandstone hover:bg-sandstone-light rounded-lg transition-colors"
                >
                  + Add
                </button>
              )}
              {!readOnly && availableKitCount > 0 && (
                <button
                  type="button"
                  onClick={onAddIdeasPack}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-purple-300/70 hover:text-purple-300 bg-purple-400/5 hover:bg-purple-400/10 rounded-lg transition-all"
                >
                  <span>✨</span> Import Decision Pack
                </button>
              )}
              {showCommonDecisions && (
                <button
                  type="button"
                  onClick={handleAutoPopulate}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-cream/50 hover:text-cream/70 bg-cream/5 hover:bg-cream/10 rounded-lg transition-colors"
                >
                  + Common ({missingDefaults.length})
                </button>
              )}
              <select
                value={selViewMode}
                onChange={(e) => setSelViewMode(e.target.value as 'table' | 'tile')}
                className="bg-basalt-50 text-cream/50 text-[11px] rounded-lg border border-cream/10 px-2 py-1 focus:outline-none focus:border-sandstone/40"
              >
                <option value="table">List</option>
                <option value="tile">Tiles</option>
              </select>
              <div className="flex-1" />
              <div className="relative" ref={expandedMenuRef}>
                <button
                  type="button"
                  onClick={() => setExpandedMenuOpen(!expandedMenuOpen)}
                  className="p-1.5 text-cream/30 hover:text-cream/60 transition-colors"
                  aria-label="More actions"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="5" cy="12" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="19" cy="12" r="2" />
                  </svg>
                </button>
                {expandedMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 z-50 bg-basalt-50 border border-cream/15 rounded-lg shadow-lg py-1 min-w-[160px]">
                    <Link
                      href={`/app/tools/finish-decisions/room/${room.id}`}
                      onClick={() => setExpandedMenuOpen(false)}
                      className="block w-full text-left px-3 py-2 text-sm text-cream/80 hover:bg-cream/5 transition-colors"
                    >
                      Open area
                    </Link>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => { setExpandedMenuOpen(false); setDeleteStep('confirm') }}
                        className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-cream/5 transition-colors"
                      >
                        Delete area
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Decisions content */}
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

      {/* Delete area — step 1: confirm intent */}
      {deleteStep === 'confirm' && (
        <ConfirmDialog
          title="Delete area?"
          message={`"${room.name}" and all its decisions and options will be permanently deleted. This cannot be undone.`}
          onConfirm={() => setDeleteStep('type')}
          onCancel={() => setDeleteStep('none')}
        />
      )}

      {/* Delete area — step 2: type name to confirm */}
      {deleteStep === 'type' && (
        <TextConfirmDialog
          title="Confirm delete"
          message={`Type "${room.name}" to permanently delete this area.`}
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
