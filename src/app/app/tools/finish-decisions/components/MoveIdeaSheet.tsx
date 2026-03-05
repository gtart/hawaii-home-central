'use client'

import { useState, useEffect } from 'react'
import type { OptionV3, RoomV3, RoomTypeV3 } from '@/data/finish-decisions'
import { ROOM_EMOJI_MAP } from '@/data/finish-decisions'
import { ImageWithFallback } from '@/components/ui/ImageWithFallback'
import { isGlobalUnsorted, isUncategorized } from '@/lib/decisionHelpers'
import { getHeroImage, displayUrl } from '@/lib/finishDecisionsImages'

export function MoveIdeaSheet({
  options,
  sourceRoomId,
  sourceDecisionId,
  rooms,
  onMove,
  onCopy,
  onClose,
}: {
  options: OptionV3[]
  sourceRoomId: string
  sourceDecisionId: string
  rooms: RoomV3[]
  onMove: (targetRoomId: string, targetDecisionId: string | null, newTitle?: string) => void
  onCopy?: (targetRoomId: string, targetDecisionId: string | null, newTitle?: string) => void
  onClose: () => void
}) {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [selectionMode, setSelectionMode] = useState<'existing' | 'new'>('existing')
  const [action, setAction] = useState<'move' | 'copy'>('move')
  const [copyCount, setCopyCount] = useState(0)

  const isBulk = options.length > 1
  const firstOption = options[0]
  const hero = firstOption ? getHeroImage(firstOption) : undefined

  // Close on escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  // Filter out Global Unsorted from room picker, and exclude source room's source decision
  const availableRooms = rooms.filter((r) => !isGlobalUnsorted(r))
  const selectedRoom = availableRooms.find((r) => r.id === selectedRoomId)
  const availableDecisions = selectedRoom
    ? selectedRoom.decisions.filter((d) => !isUncategorized(d) && !(selectedRoomId === sourceRoomId && d.id === sourceDecisionId))
    : []

  const canAct = !!selectedRoomId && (selectionMode === 'new' ? !!newTitle.trim() : true)

  function handleAction() {
    if (!selectedRoomId) return
    const targetDecision = selectionMode === 'new' ? null : selectedDecisionId
    const title = selectionMode === 'new' && newTitle.trim() ? newTitle.trim() : undefined

    if (action === 'copy' && onCopy) {
      onCopy(selectedRoomId, targetDecision, title)
      const n = copyCount + 1
      setCopyCount(n)
      // Reset picker for copy-to-multiple
      setSelectedRoomId(null)
      setSelectedDecisionId(null)
      setNewTitle('')
      setSelectionMode('existing')
    } else {
      onMove(selectedRoomId, targetDecision, title)
    }
  }

  const headerTitle = copyCount > 0
    ? `Copied ${copyCount} — pick another or close`
    : isBulk
      ? `${action === 'copy' ? 'Copy' : 'Move'} ${options.length} options`
      : `${action === 'copy' ? 'Copy' : 'Move'} option`

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Sheet */}
      <div className="relative bg-basalt-50 border-t md:border border-cream/10 rounded-t-xl md:rounded-xl w-full md:max-w-md max-h-[85vh] overflow-y-auto">
        {/* Handle bar (mobile) */}
        <div className="md:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-cream/20 rounded-full" />
        </div>

        <div className="px-5 pt-3 pb-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-cream">{headerTitle}</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-cream/30 hover:text-cream/60 transition-colors p-1"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Move / Copy toggle */}
          {onCopy && (
            <div className="flex bg-cream/5 rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => { setAction('move'); setCopyCount(0) }}
                className={`flex-1 px-3 py-1.5 rounded-md font-medium transition-colors ${
                  action === 'move' ? 'bg-sandstone/20 text-sandstone' : 'text-cream/40 hover:text-cream/60'
                }`}
              >
                Move
              </button>
              <button
                type="button"
                onClick={() => setAction('copy')}
                className={`flex-1 px-3 py-1.5 rounded-md font-medium transition-colors ${
                  action === 'copy' ? 'bg-sandstone/20 text-sandstone' : 'text-cream/40 hover:text-cream/60'
                }`}
              >
                Copy to…
              </button>
            </div>
          )}

          {/* Idea preview (single mode only) */}
          {!isBulk && firstOption && copyCount === 0 && (
            <div className="flex items-center gap-3 bg-cream/5 rounded-lg p-2.5">
              {hero && (
                <ImageWithFallback
                  src={displayUrl(hero.thumbnailUrl || hero.url)}
                  alt=""
                  className="w-10 h-10 rounded object-cover shrink-0"
                  fallback={<div className="w-10 h-10 rounded bg-cream/5 shrink-0" />}
                />
              )}
              <div className="min-w-0">
                <p className="text-sm text-cream truncate">{firstOption.name || 'Untitled option'}</p>
                <p className="text-[10px] text-cream/30">
                  {firstOption.images?.length ?? 0} image{(firstOption.images?.length ?? 0) !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )}

          {/* Bulk preview */}
          {isBulk && copyCount === 0 && (
            <div className="bg-cream/5 rounded-lg p-2.5">
              <p className="text-sm text-cream">{options.length} options selected</p>
              <p className="text-[10px] text-cream/30 mt-0.5">
                {options.map((o) => o.name || 'Untitled').slice(0, 3).join(', ')}
                {options.length > 3 && ` +${options.length - 3} more`}
              </p>
            </div>
          )}

          {/* Step 1: Pick selection list (room) */}
          <div>
            <label className="block text-xs text-cream/50 mb-2">Selection list</label>
            <div className="grid grid-cols-2 gap-2">
              {availableRooms.map((room) => {
                const emoji = ROOM_EMOJI_MAP[room.type as RoomTypeV3] || '✏️'
                const isActive = selectedRoomId === room.id
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => {
                      setSelectedRoomId(room.id)
                      setSelectedDecisionId(null)
                      setSelectionMode('existing')
                      setNewTitle('')
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-left transition-all ${
                      isActive
                        ? 'border-sandstone bg-sandstone/10'
                        : 'border-cream/10 hover:border-cream/25 bg-basalt'
                    }`}
                  >
                    <span className="text-sm">{emoji}</span>
                    <span className={`text-sm truncate ${isActive ? 'text-sandstone font-medium' : 'text-cream'}`}>
                      {room.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Step 2: Pick selection (shown when list selected) */}
          {selectedRoom && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-xs text-cream/50">Selection</label>
                <div className="flex bg-cream/5 rounded p-0.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => { setSelectionMode('existing'); setNewTitle('') }}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      selectionMode === 'existing' ? 'bg-sandstone/20 text-sandstone' : 'text-cream/40'
                    }`}
                  >
                    Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectionMode('new'); setSelectedDecisionId(null) }}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      selectionMode === 'new' ? 'bg-sandstone/20 text-sandstone' : 'text-cream/40'
                    }`}
                  >
                    + New
                  </button>
                </div>
              </div>

              {selectionMode === 'existing' ? (
                <>
                  {availableDecisions.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {availableDecisions.map((d) => {
                        const isActive = selectedDecisionId === d.id
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => setSelectedDecisionId(isActive ? null : d.id)}
                            className={`px-3 py-2 rounded-lg border-2 text-left transition-all ${
                              isActive
                                ? 'border-sandstone bg-sandstone/10'
                                : 'border-cream/10 hover:border-cream/25 bg-basalt'
                            }`}
                          >
                            <p className={`text-sm truncate ${isActive ? 'text-sandstone font-medium' : 'text-cream'}`}>
                              {d.title}
                            </p>
                            <p className="text-[10px] text-cream/30">{d.options.length} options</p>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-[11px] text-cream/30">No selections in this list yet.</p>
                  )}
                  {!selectedDecisionId && (
                    <p className="text-[11px] text-cream/30 mt-1.5">
                      No selection chosen? Option will go to Unsorted in this list.
                    </p>
                  )}
                </>
              ) : (
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="New selection name..."
                  className="w-full px-3 py-2 bg-basalt border border-cream/20 text-cream text-sm rounded-lg placeholder:text-cream/30 focus:outline-none focus:border-sandstone"
                  autoFocus
                />
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-cream/60 hover:text-cream transition-colors"
            >
              {copyCount > 0 ? 'Done' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleAction}
              disabled={!canAct}
              className="px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {action === 'copy'
                ? (copyCount > 0 ? 'Copy again' : (isBulk ? `Copy ${options.length}` : 'Copy'))
                : (isBulk ? `Move ${options.length}` : 'Move')
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
