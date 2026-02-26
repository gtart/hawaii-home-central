'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isDefaultBoard } from '@/data/mood-boards'
import type { Board, Idea } from '@/data/mood-boards'
import type { MoodBoardStateAPI } from '../useMoodBoardState'
import { IdeaTile } from './IdeaTile'
import { IdeaDetailModal } from './IdeaDetailModal'
import { AddIdeaFromUrlPanel } from './AddIdeaFromUrlPanel'
import { BookmarkletButton } from '@/app/app/tools/finish-decisions/components/BookmarkletButton'

interface Props {
  board: Board
  api: MoodBoardStateAPI
  readOnly: boolean
}

export function BoardDetailView({ board, api, readOnly }: Props) {
  const router = useRouter()
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [boardName, setBoardName] = useState(board.name)
  const [showUrlImport, setShowUrlImport] = useState(false)

  const selectedIdea = selectedIdeaId
    ? board.ideas.find((i) => i.id === selectedIdeaId) ?? null
    : null

  const handleRename = () => {
    const trimmed = boardName.trim()
    if (trimmed && trimmed !== board.name) {
      api.renameBoard(board.id, trimmed)
    } else {
      setBoardName(board.name)
    }
    setEditingName(false)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => router.push('/app/tools/mood-boards')}
          className="text-cream/40 hover:text-cream/60 transition-colors shrink-0"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="flex-1 min-w-0">
          {editingName && !readOnly && !isDefaultBoard(board) ? (
            <input
              type="text"
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename()
                if (e.key === 'Escape') {
                  setBoardName(board.name)
                  setEditingName(false)
                }
              }}
              onBlur={handleRename}
              autoFocus
              className="w-full text-xl font-serif bg-transparent text-sandstone border-b border-sandstone/30 focus:outline-none focus:border-sandstone pb-0.5"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                if (!readOnly && !isDefaultBoard(board)) {
                  setEditingName(true)
                  setBoardName(board.name)
                }
              }}
              className="text-xl font-serif text-sandstone truncate block text-left"
              disabled={readOnly || isDefaultBoard(board)}
            >
              {board.name}
            </button>
          )}
          <p className="text-xs text-cream/40 mt-0.5">
            {board.ideas.length} idea{board.ideas.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Add Idea actions */}
        {!readOnly && (
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/app/save-from-web?from=mood-boards&boardId=${board.id}`}
              className="px-3 py-1.5 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors"
            >
              Save from Web
            </Link>
            <button
              type="button"
              onClick={() => setShowUrlImport(!showUrlImport)}
              className="px-3 py-1.5 text-sm text-cream/60 hover:text-cream border border-cream/20 rounded-lg transition-colors"
            >
              Paste a URL
            </button>
          </div>
        )}
      </div>

      {/* URL import panel */}
      {showUrlImport && !readOnly && (
        <div className="mb-6 bg-basalt-50 rounded-xl p-4 border border-cream/10">
          <AddIdeaFromUrlPanel
            boardId={board.id}
            api={api}
            onDone={() => setShowUrlImport(false)}
          />
        </div>
      )}

      {/* Masonry grid */}
      {board.ideas.length > 0 ? (
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 [column-fill:_balance]">
          {board.ideas.map((idea) => (
            <div key={idea.id} className="break-inside-avoid mb-3">
              <IdeaTile
                idea={idea}
                onClick={() => setSelectedIdeaId(idea.id)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-basalt-50 rounded-xl border border-cream/10">
          <p className="text-4xl mb-3 opacity-30">{isDefaultBoard(board) ? '\u2764' : '\uD83C\uDFA8'}</p>
          <h3 className="text-lg font-serif text-sandstone mb-2">
            No ideas yet
          </h3>
          <p className="text-cream/50 text-sm mb-6 max-w-sm mx-auto">
            Save ideas from any website using the bookmarklet, paste a link, or use Save from Web.
          </p>
          <div className="flex flex-col items-center gap-3">
            {!readOnly && (
              <>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/app/save-from-web?from=mood-boards&boardId=${board.id}`}
                    className="px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors"
                  >
                    Save from Web
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowUrlImport(true)}
                    className="px-4 py-2 text-sm text-cream/60 hover:text-cream border border-cream/20 rounded-lg transition-colors"
                  >
                    Paste a URL
                  </button>
                </div>
                <div className="mt-2">
                  <p className="text-[11px] text-cream/30 mb-1.5">Or drag this to your bookmarks bar:</p>
                  <BookmarkletButton />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Idea detail modal */}
      {selectedIdea && (
        <IdeaDetailModal
          idea={selectedIdea}
          board={board}
          boards={api.payload.boards}
          readOnly={readOnly}
          onClose={() => setSelectedIdeaId(null)}
          onUpdateIdea={(ideaId, updates) =>
            api.updateIdea(board.id, ideaId, updates)
          }
          onDeleteIdea={(ideaId) => {
            api.deleteIdea(board.id, ideaId)
            setSelectedIdeaId(null)
          }}
          onMoveIdea={(toBoardId, ideaId) => {
            api.moveIdea(board.id, toBoardId, ideaId)
            setSelectedIdeaId(null)
          }}
        />
      )}
    </div>
  )
}
