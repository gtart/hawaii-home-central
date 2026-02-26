'use client'

import { useEffect, useRef } from 'react'
import type { Board } from '@/data/mood-boards'

interface Props {
  boards: Board[]
  currentBoardId: string
  onMove: (toBoardId: string) => void
  onCopy?: (toBoardId: string) => void
  onClose: () => void
}

export function MoveToBoardSheet({ boards, currentBoardId, onMove, onCopy, onClose }: Props) {
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
        <h3 className="text-base font-medium text-cream">
          {onCopy ? 'Move or Copy to Board' : 'Move to Board'}
        </h3>

        {otherBoards.length === 0 ? (
          <p className="text-sm text-cream/50">
            No other boards available. Create a new board first.
          </p>
        ) : (
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {otherBoards.map((b) => (
              <div
                key={b.id}
                className="px-3 py-2.5 rounded-lg border border-cream/10"
              >
                <p className="text-sm text-cream font-medium">{b.name}</p>
                <p className="text-[11px] text-cream/40 mb-2">
                  {b.ideas.length} idea{b.ideas.length !== 1 ? 's' : ''}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onMove(b.id)
                      onClose()
                    }}
                    className="flex-1 px-2.5 py-1.5 text-xs font-medium text-cream border border-cream/20 rounded-md hover:bg-cream/5 transition-colors"
                  >
                    Move
                  </button>
                  {onCopy && (
                    <button
                      type="button"
                      onClick={() => {
                        onCopy(b.id)
                        onClose()
                      }}
                      className="flex-1 px-2.5 py-1.5 text-xs font-medium text-sandstone border border-sandstone/30 rounded-md hover:bg-sandstone/10 transition-colors"
                    >
                      Copy
                    </button>
                  )}
                </div>
              </div>
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
