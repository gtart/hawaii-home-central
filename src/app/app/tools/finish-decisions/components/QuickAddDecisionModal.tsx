'use client'

import { useState, useEffect, useRef } from 'react'
import {
  ROOM_EMOJI_MAP,
  type RoomV3,
  type DecisionV3,
  type RoomTypeV3,
} from '@/data/finish-decisions'

const LS_KEY = 'hhc_finish_quick_add_last_room'

interface Props {
  rooms: RoomV3[]
  preselectedRoomId?: string | null
  onAdd: (roomId: string, decision: DecisionV3) => void
  onClose: () => void
  triggerRef?: React.RefObject<HTMLElement | null>
}

export function QuickAddDecisionModal({ rooms, preselectedRoomId, onAdd, onClose, triggerRef }: Props) {
  const [title, setTitle] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState<string>(() => {
    if (preselectedRoomId) return preselectedRoomId
    try {
      const saved = localStorage.getItem(LS_KEY)
      if (saved && rooms.some((r) => r.id === saved)) return saved
    } catch {}
    return rooms[0]?.id ?? ''
  })
  const [roomPickerOpen, setRoomPickerOpen] = useState(!preselectedRoomId)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Auto-focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  function handleClose() {
    onClose()
    // Return focus to trigger element
    setTimeout(() => triggerRef?.current?.focus(), 0)
  }

  function handleAdd() {
    const t = title.trim()
    if (!t) {
      setError('Enter a title for the decision')
      return
    }
    if (!selectedRoomId) {
      setError('Pick a room')
      return
    }

    const decision: DecisionV3 = {
      id: crypto.randomUUID(),
      title: t,
      status: 'deciding',
      notes: '',
      options: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    try {
      localStorage.setItem(LS_KEY, selectedRoomId)
    } catch {}

    onAdd(selectedRoomId, decision)
    handleClose()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
    if (e.key === 'Escape') {
      handleClose()
    }
  }

  // Focus trap (FS-UI-008)
  function handleModalKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Tab') {
      const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (!focusable || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onKeyDown={handleModalKeyDown}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative bg-basalt-50 border-t sm:border border-cream/10 rounded-t-xl sm:rounded-xl w-full sm:max-w-md"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h2 className="text-lg font-medium text-cream">Add Selection</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-cream/40 hover:text-cream transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* Room picker — collapsed when preselected, expandable */}
          <div>
            {selectedRoomId && !roomPickerOpen ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-cream/5 rounded-lg">
                <span className="text-xs leading-none">
                  {ROOM_EMOJI_MAP[(rooms.find((r) => r.id === selectedRoomId)?.type || '') as RoomTypeV3] || '✏️'}
                </span>
                <span className="text-sm text-cream/80 font-medium">
                  Adding to {rooms.find((r) => r.id === selectedRoomId)?.name || 'room'}
                </span>
                {rooms.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setRoomPickerOpen(true)}
                    className="text-[11px] text-sandstone hover:text-sandstone-light transition-colors ml-auto"
                  >
                    Change room
                  </button>
                )}
              </div>
            ) : (
              <>
                <label className="block text-sm text-cream/70 mb-2">Room</label>
                <div className="flex flex-wrap gap-2">
                  {rooms.map((room) => {
                    const emoji = ROOM_EMOJI_MAP[room.type as RoomTypeV3] || '✏️'
                    const isActive = selectedRoomId === room.id
                    return (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => { setSelectedRoomId(room.id); setError(''); if (preselectedRoomId) setRoomPickerOpen(false) }}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-sandstone/20 text-sandstone ring-1 ring-sandstone/40'
                            : 'bg-cream/10 text-cream/60 hover:text-cream/80'
                        }`}
                      >
                        <span className="w-4 h-4 inline-flex items-center justify-center text-xs leading-none">
                          {emoji}
                        </span>
                        {room.name}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {/* Title input */}
          <div>
            <label className="block text-sm text-cream/70 mb-1.5">Selection name</label>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError('') }}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Countertop, Faucet, Tile..."
              className="w-full bg-basalt border border-cream/20 rounded-lg px-3 py-2.5 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50"
            />
          </div>

          {/* Error */}
          {error && <p className="text-sm text-red-400">{error}</p>}

          {/* Actions */}
          <button
            type="button"
            onClick={handleAdd}
            className="w-full py-3 bg-sandstone text-basalt font-medium rounded-lg hover:bg-sandstone-light transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
