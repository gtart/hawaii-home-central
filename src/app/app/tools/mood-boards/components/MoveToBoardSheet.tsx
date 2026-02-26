'use client'

import { useEffect, useRef } from 'react'
import type { Board } from '@/data/mood-boards'

interface Props {
  boards: Board[]
  currentBoardId: string
  onMove: (toBoardId: string) => void
  onClose: () => void
}

export function MoveToBoardSheet({ boards, currentBoardId, onMove, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const otherBoards = boards.filter((b) => b.id !== currentBoardId)

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        ref={dialogRef}
        className="relative bg-basalt-50 border border-cream/10 rounded-xl w-full max-w-sm p-5 space-y-3"
        role="dialog"
        aria-modal="true"
      >
        <h3 className="text-base font-medium text-cream">Move to Board</h3>

        {otherBoards.length === 0 ? (
          <p className="text-sm text-cream/50">
            No other boards available. Create a new board first.
          </p>
        ) : (
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {otherBoards.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  onMove(b.id)
                  onClose()
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg border border-cream/10 hover:border-sandstone/30 hover:bg-cream/5 transition-colors"
              >
                <p className="text-sm text-cream font-medium">{b.name}</p>
                <p className="text-[11px] text-cream/40">
                  {b.ideas.length} idea{b.ideas.length !== 1 ? 's' : ''}
                </p>
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full px-3 py-2 text-sm text-cream/60 hover:text-cream transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
