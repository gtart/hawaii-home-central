'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useToolState } from '@/hooks/useToolState'
import {
  ROOM_EMOJI_MAP,
  type FinishDecisionsPayloadV3,
  type RoomV3,
  type RoomTypeV3,
  type DecisionV3,
  type StatusV3,
} from '@/data/finish-decisions'
import type { FinishDecisionKit } from '@/data/finish-decision-kits'
import { findKitsForRoomType, applyKitToRoom, removeKitFromRoom } from '@/lib/finish-decision-kits'
import { isGlobalUnsorted, findUncategorizedDecision } from '@/lib/decisionHelpers'
import { SelectionsBoardView } from '../../components/SelectionsBoardView'
import { DecisionsTable } from '../../components/DecisionsTable'
import { QuickAddDecisionModal } from '../../components/QuickAddDecisionModal'
import { IdeasPackModal } from '../../components/IdeasPackModal'
import { RoomCommentsFeed } from '../../components/RoomCommentsFeed'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { TextConfirmDialog } from '@/components/ui/TextConfirmDialog'

const DEFAULT_PAYLOAD: FinishDecisionsPayloadV3 = { version: 3, rooms: [] }
const SEL_VIEW_KEY = 'hhc_finish_selection_view_mode_v2'

export function RoomDetailContent({
  kits = [],
  defaultDecisions = {} as Record<RoomTypeV3, string[]>,
  emojiMap = {},
}: {
  kits?: FinishDecisionKit[]
  defaultDecisions?: Record<RoomTypeV3, string[]>
  emojiMap?: Record<string, string>
}) {
  const params = useParams()
  const router = useRouter()
  const roomId = params.roomId as string

  const { state, setState, isLoaded, readOnly } = useToolState<FinishDecisionsPayloadV3>({
    toolKey: 'finish_decisions',
    localStorageKey: 'hhc_finish_decisions_v2',
    defaultValue: DEFAULT_PAYLOAD,
  })

  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [ideasModalOpen, setIdeasModalOpen] = useState(false)
  const [deleteStep, setDeleteStep] = useState<'none' | 'confirm' | 'type'>('none')
  const [confirmDeleteDecisionId, setConfirmDeleteDecisionId] = useState<string | null>(null)
  const [undoDecision, setUndoDecision] = useState<{ decision: DecisionV3; timer: ReturnType<typeof setTimeout> } | null>(null)
  const [populateBanner, setPopulateBanner] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; kitId: string } | null>(null)
  const [commentsFeedOpen, setCommentsFeedOpen] = useState(false)
  const [selViewMode, setSelViewMode] = useState<'table' | 'tile'>(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(SEL_VIEW_KEY) : null
      return stored === 'table' ? 'table' : 'tile'
    } catch { return 'tile' }
  })

  useEffect(() => {
    try { localStorage.setItem(SEL_VIEW_KEY, selViewMode) } catch { /* ignore */ }
  }, [selViewMode])

  // Clean up undo timer on unmount
  useEffect(() => {
    return () => {
      if (undoDecision) clearTimeout(undoDecision.timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const rooms = (state as FinishDecisionsPayloadV3).rooms || []
  const room = rooms.find((r) => r.id === roomId)

  // --- Room mutations ---

  function updateRoom(updates: Partial<RoomV3>) {
    setState((prev) => ({
      ...prev,
      rooms: (prev as FinishDecisionsPayloadV3).rooms.map((r) =>
        r.id === roomId ? { ...r, ...updates } : r
      ),
    }))
  }

  function deleteRoom() {
    setState((prev) => ({
      ...prev,
      rooms: (prev as FinishDecisionsPayloadV3).rooms.filter((r) => r.id !== roomId),
    }))
    router.push('/app/tools/finish-decisions')
  }

  function handleQuickAddDecision(_roomId: string, decision: DecisionV3) {
    if (!room) return
    updateRoom({
      decisions: [...room.decisions, decision],
      updatedAt: new Date().toISOString(),
    })
  }

  function handleDeleteDecision(decisionId: string) {
    if (!room) return
    const deleted = room.decisions.find((d) => d.id === decisionId)
    updateRoom({
      decisions: room.decisions.filter((d) => d.id !== decisionId),
      updatedAt: new Date().toISOString(),
    })
    setConfirmDeleteDecisionId(null)

    if (deleted) {
      if (undoDecision) clearTimeout(undoDecision.timer)
      const timer = setTimeout(() => setUndoDecision(null), 8000)
      setUndoDecision({ decision: deleted, timer })
    }
  }

  function handleUndo() {
    if (!undoDecision || !room) return
    clearTimeout(undoDecision.timer)
    // Filter out any existing entry with this ID first to prevent duplicates
    const withoutDupe = room.decisions.filter((d) => d.id !== undoDecision.decision.id)
    updateRoom({
      decisions: [...withoutDupe, undoDecision.decision],
      updatedAt: new Date().toISOString(),
    })
    setUndoDecision(null)
  }

  function handleAutoPopulate() {
    if (!room) return
    const standardTitles = defaultDecisions[room.type as RoomTypeV3] || []
    const existingTitles = new Set(room.decisions.map((d) => d.title.toLowerCase().trim()))
    const missing = standardTitles.filter((t) => !existingTitles.has(t.toLowerCase().trim()))

    if (missing.length === 0) {
      setPopulateBanner('All standard selections are already included.')
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

    updateRoom({
      decisions: [...room.decisions, ...newDecisions],
      updatedAt: now,
    })

    setPopulateBanner(`Added ${missing.length} selection${missing.length !== 1 ? 's' : ''}.`)
    setTimeout(() => setPopulateBanner(null), 4000)
  }

  function handleApplyKit(kit: FinishDecisionKit) {
    if (!room) return
    const result = applyKitToRoom(room, kit)
    updateRoom(result.room)
    setToast({ message: `Added "${kit.label}" — ${result.addedOptionCount} ideas`, kitId: kit.id })
    setTimeout(() => setToast(null), 8000)
  }

  function handleUndoKit() {
    if (!toast || !room) return
    const updated = removeKitFromRoom(room, toast.kitId)
    updateRoom(updated)
    setToast(null)
  }

  // --- Loading / not found ---

  if (!isLoaded) {
    return (
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center py-12 text-cream/50">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-cream/50 mb-4">Room not found.</p>
          <button
            type="button"
            onClick={() => router.push('/app/tools/finish-decisions')}
            className="text-sandstone hover:text-sandstone-light text-sm transition-colors"
          >
            &larr; Back to Selection Boards
          </button>
        </div>
      </div>
    )
  }

  const isUnsortedRoom = isGlobalUnsorted(room)
  const roomEmoji = isUnsortedRoom ? '📦' : (ROOM_EMOJI_MAP[room.type as RoomTypeV3] || '✏️')
  const totalOptions = room.decisions.reduce((sum, d) => sum + d.options.length, 0)
  const availableKitsCount = !isUnsortedRoom ? findKitsForRoomType(kits, room.type as RoomTypeV3).length : 0
  const hasAvailableKits = availableKitsCount > 0
  const regularDecisions = room.decisions.filter((d) => d.systemKey !== 'uncategorized')
  const unsortedDecision = findUncategorizedDecision(room)
  const unsortedCount = unsortedDecision ? unsortedDecision.options.length : 0

  const stats = {
    total: regularDecisions.length,
    deciding: regularDecisions.filter((d) => d.status === 'deciding').length,
    selected: regularDecisions.filter((d) => d.status === 'selected').length,
    ordered: regularDecisions.filter((d) => d.status === 'ordered').length,
    done: regularDecisions.filter((d) => d.status === 'done').length,
  }

  const totalCommentCount = room.decisions.reduce(
    (sum, d) => sum + (d.comments?.length ?? 0),
    0
  )

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <button
          type="button"
          onClick={() => router.push('/app/tools/finish-decisions')}
          className="text-sm text-cream/40 hover:text-cream/60 transition-colors mb-4 inline-block"
        >
          &larr; Selection Boards
        </button>

        {/* Room header */}
        <div className="flex items-start gap-3 mb-6">
          <span className="text-3xl mt-0.5">{roomEmoji}</span>
          <div className="flex-1 min-w-0">
            <h1 className={`font-serif text-2xl md:text-3xl truncate ${isUnsortedRoom ? 'text-amber-300' : 'text-sandstone'}`}>
              {room.name}
            </h1>
            {isUnsortedRoom ? (
              <p className="text-xs text-cream/40 mt-1">
                {unsortedCount} idea{unsortedCount !== 1 ? 's' : ''} waiting to be sorted into rooms
              </p>
            ) : (
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-cream/50 mt-1">
                <span>{stats.total} selection{stats.total !== 1 ? 's' : ''}</span>
                {stats.deciding > 0 && <span>{stats.deciding} deciding</span>}
                {stats.selected > 0 && <span>{stats.selected} selected</span>}
                {stats.ordered > 0 && <span>{stats.ordered} ordered</span>}
                {stats.done > 0 && <span>{stats.done} done</span>}
              </div>
            )}
          </div>
        </div>

        {/* Action bar — hide most actions for Global Unsorted */}
        {!readOnly && !isUnsortedRoom && (
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <button
              type="button"
              onClick={() => setQuickAddOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-sandstone font-medium bg-sandstone/10 hover:bg-sandstone/20 rounded-lg transition-colors"
            >
              + Selection
            </button>
            <button
              type="button"
              onClick={handleAutoPopulate}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-cream/60 hover:text-cream/80 bg-cream/5 hover:bg-cream/10 rounded-lg transition-colors"
            >
              Add common selections
            </button>
            {hasAvailableKits && (
              <button
                type="button"
                onClick={() => setIdeasModalOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-purple-300/70 hover:text-purple-300 bg-purple-400/5 hover:bg-purple-400/10 rounded-lg transition-all"
              >
                <span>✨</span> Idea Packs ({availableKitsCount})
              </button>
            )}

            <div className="flex-1" />

            {/* Comments feed */}
            <button
              type="button"
              onClick={() => setCommentsFeedOpen(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                totalCommentCount > 0
                  ? 'text-sandstone bg-sandstone/10 hover:bg-sandstone/20 font-medium'
                  : 'text-cream/40 hover:text-cream/60 bg-cream/5 hover:bg-cream/10'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              {totalCommentCount > 0 ? totalCommentCount : 'Comments'}
            </button>

            {/* View mode selector */}
            <select
              value={selViewMode}
              onChange={(e) => setSelViewMode(e.target.value as 'table' | 'tile')}
              className="bg-basalt-50 text-cream/50 text-[11px] rounded-lg border border-cream/10 px-2 py-1 focus:outline-none focus:border-sandstone/40"
            >
              <option value="tile">Tiles</option>
              <option value="table">Table</option>
            </select>

            <button
              type="button"
              onClick={() => setDeleteStep('confirm')}
              className="px-3 py-1.5 text-xs text-red-400/40 hover:text-red-400 transition-colors"
            >
              Delete room
            </button>
          </div>
        )}

        {/* Read-only action bar */}
        {readOnly && (
          <div className="flex items-center justify-end gap-2 mb-5">
            {/* Comments feed */}
            <button
              type="button"
              onClick={() => setCommentsFeedOpen(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                totalCommentCount > 0
                  ? 'text-sandstone bg-sandstone/10 hover:bg-sandstone/20 font-medium'
                  : 'text-cream/40 hover:text-cream/60 bg-cream/5 hover:bg-cream/10'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              {totalCommentCount > 0 ? totalCommentCount : 'Comments'}
            </button>

            <select
              value={selViewMode}
              onChange={(e) => setSelViewMode(e.target.value as 'table' | 'tile')}
              className="bg-basalt-50 text-cream/50 text-[11px] rounded-lg border border-cream/10 px-2 py-1 focus:outline-none focus:border-sandstone/40"
            >
              <option value="tile">Tiles</option>
              <option value="table">Table</option>
            </select>
          </div>
        )}

        {/* Banners */}
        {populateBanner && (
          <div className="flex items-center justify-between px-4 py-2 mb-4 bg-sandstone/5 border border-cream/10 rounded-lg text-xs">
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

        {undoDecision && (
          <div className="flex items-center justify-between px-4 py-2 mb-4 bg-cream/5 border border-cream/10 rounded-lg text-xs">
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

        {/* Ideas Pack nudge */}
        {!readOnly && hasAvailableKits && room.decisions.length > 0 && totalOptions <= 1 && (
          <div className="px-3 py-2 mb-4 bg-sandstone/5 border border-sandstone/15 rounded-lg flex items-center justify-between">
            <span className="text-xs text-cream/50">
              Add starter ideas from a curated pack
            </span>
            <button
              type="button"
              onClick={() => setIdeasModalOpen(true)}
              className="text-xs text-sandstone font-medium hover:text-sandstone-light transition-colors"
            >
              Import Idea Pack
            </button>
          </div>
        )}

        {/* Selections content */}
        {room.decisions.length === 0 ? (
          <div data-testid="empty-state-room" className="bg-basalt-50 rounded-card p-8 text-center">
            <p className="text-cream/50 mb-3">No selections yet.</p>
            {!readOnly && (
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuickAddOpen(true)}
                  className="text-sandstone text-sm hover:text-sandstone-light transition-colors"
                >
                  + Add a selection
                </button>
                <span className="text-cream/15">or</span>
                <button
                  type="button"
                  onClick={handleAutoPopulate}
                  className="text-cream/50 text-sm hover:text-cream/70 transition-colors"
                >
                  Add common selections
                </button>
              </div>
            )}
          </div>
        ) : selViewMode === 'tile' ? (
          <SelectionsBoardView
            decisions={room.decisions}
            roomType={room.type}
            onDeleteDecision={(id) => setConfirmDeleteDecisionId(id)}
            onAddSelection={readOnly ? undefined : () => setQuickAddOpen(true)}
            readOnly={readOnly}
            emojiMap={emojiMap}
          />
        ) : (
          <DecisionsTable
            decisions={room.decisions}
            roomType={room.type}
            onDeleteDecision={(id) => setConfirmDeleteDecisionId(id)}
            readOnly={readOnly}
            emojiMap={emojiMap}
          />
        )}
      </div>

      {/* Quick Add Selection Modal */}
      {quickAddOpen && (
        <QuickAddDecisionModal
          rooms={rooms}
          preselectedRoomId={roomId}
          onAdd={handleQuickAddDecision}
          onClose={() => setQuickAddOpen(false)}
        />
      )}

      {/* Ideas Pack Modal */}
      {ideasModalOpen && (
        <IdeasPackModal
          roomType={room.type as RoomTypeV3}
          roomName={room.name}
          appliedKitIds={room.appliedKitIds || []}
          onApply={handleApplyKit}
          onClose={() => setIdeasModalOpen(false)}
          kits={kits}
        />
      )}

      {/* Delete room — step 1 */}
      {deleteStep === 'confirm' && (
        <ConfirmDialog
          title="Delete room?"
          message={`"${room.name}" and all its selections and ideas will be permanently deleted. This cannot be undone.`}
          onConfirm={() => setDeleteStep('type')}
          onCancel={() => setDeleteStep('none')}
        />
      )}

      {/* Delete room — step 2 */}
      {deleteStep === 'type' && (
        <TextConfirmDialog
          title="Confirm delete"
          message={`Type "${room.name}" to permanently delete this room.`}
          confirmText={room.name}
          onConfirm={() => { setDeleteStep('none'); deleteRoom() }}
          onCancel={() => setDeleteStep('none')}
        />
      )}

      {/* Confirm delete selection dialog */}
      {confirmDeleteDecisionId && (
        <ConfirmDialog
          title="Delete selection"
          message="This will also delete all its options."
          onConfirm={() => handleDeleteDecision(confirmDeleteDecisionId)}
          onCancel={() => setConfirmDeleteDecisionId(null)}
        />
      )}

      {/* Kit toast with undo */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-basalt-50 border border-cream/15 rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 max-w-sm">
          <span className="text-sm text-cream/70">{toast.message}</span>
          <button
            type="button"
            onClick={handleUndoKit}
            className="text-sm text-sandstone font-medium hover:text-sandstone-light transition-colors shrink-0"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-cream/30 hover:text-cream/60 transition-colors"
          >
            ×
          </button>
        </div>
      )}

      {/* Room comment feed panel */}
      {commentsFeedOpen && room && (
        <RoomCommentsFeed
          decisions={room.decisions}
          roomType={room.type}
          onClose={() => setCommentsFeedOpen(false)}
          onNavigateToDecision={(decisionId) => {
            setCommentsFeedOpen(false)
            router.push(`/app/tools/finish-decisions/decision/${decisionId}`)
          }}
        />
      )}
    </div>
  )
}
