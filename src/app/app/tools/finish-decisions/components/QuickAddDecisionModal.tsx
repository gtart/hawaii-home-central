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
}

export function QuickAddDecisionModal({ rooms, preselectedRoomId, onAdd, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState<string>(() => {
    if (preselectedRoomId) return preselectedRoomId
    try {
      const saved = localStorage.getItem(LS_KEY)
      if (saved && rooms.some((r) => r.id === saved)) return saved
    } catch {}
    return rooms[0]?.id ?? ''
  })
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  function handleAdd() {
    const t = title.trim()
    if (!t) {
      setError('Enter a title for the selection')
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
    onClose()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-basalt-50 border-t sm:border border-cream/10 rounded-t-xl sm:rounded-xl w-full sm:max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h2 className="text-lg font-medium text-cream">Add Selection</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-cream/40 hover:text-cream transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* Room picker */}
          <div>
            <label className="block text-sm text-cream/70 mb-2">Room</label>
            <div className="flex flex-wrap gap-2">
              {rooms.map((room) => {
                const emoji = ROOM_EMOJI_MAP[room.type as RoomTypeV3] || '✏️'
                const isActive = selectedRoomId === room.id
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => { setSelectedRoomId(room.id); setError('') }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-sandstone/20 text-sandstone ring-1 ring-sandstone/40'
                        : 'bg-cream/10 text-cream/60 hover:text-cream/80'
                    }`}
                  >
                    {emoji} {room.name}
                  </button>
                )
              })}
            </div>
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
