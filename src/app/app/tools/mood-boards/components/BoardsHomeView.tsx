'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ImageWithFallback } from '@/components/ui/ImageWithFallback'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { isDefaultBoard, resolveBoardAccess } from '@/data/mood-boards'
import type { Board, MoodBoardComment } from '@/data/mood-boards'
import type { MoodBoardStateAPI } from '../useMoodBoardState'
import { CommentsPanel } from './CommentsPanel'

interface Props {
  api: MoodBoardStateAPI
  readOnly: boolean
  toolAccess: string
}

function getCoverImage(board: Board): string | null {
  for (const idea of board.ideas) {
    if (idea.images.length > 0) {
      const heroId = idea.heroImageId
      const hero = heroId ? idea.images.find((img) => img.id === heroId) : null
      return hero?.url ?? idea.images[0].url
    }
  }
  return null
}

export function BoardsHomeView({ api, readOnly, toolAccess }: Props) {
  const router = useRouter()
  const { data: session } = useSession()
  const userEmail = session?.user?.email || ''
  const { payload, addBoard, renameBoard, deleteBoard } = api
  const [newBoardName, setNewBoardName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deletingBoard, setDeletingBoard] = useState<Board | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [commentsOpen, setCommentsOpen] = useState(false)

  // Filter boards based on user's board-level access
  const visibleBoards = useMemo(
    () =>
      payload.boards.filter(
        (b) => resolveBoardAccess(b, userEmail, toolAccess) !== null
      ),
    [payload.boards, userEmail, toolAccess]
  )

  // Aggregate all comments across visible boards
  const allComments: MoodBoardComment[] = visibleBoards.flatMap(
    (b) => (b.comments || []).map((c) => ({ ...c }))
  )
  const commentCount = allComments.length

  const handleCreate = () => {
    const trimmed = newBoardName.trim()
    if (!trimmed) return
    const id = addBoard(trimmed, userEmail)
    setNewBoardName('')
    setIsCreating(false)
    router.push(`/app/tools/mood-boards?board=${id}`)
  }

  const handleRename = (boardId: string) => {
    const trimmed = editName.trim()
    if (!trimmed) return
    renameBoard(boardId, trimmed)
    setEditingBoardId(null)
    setEditName('')
  }

  const handleDeleteConfirm = () => {
    if (deletingBoard) {
      deleteBoard(deletingBoard.id)
      setDeletingBoard(null)
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {visibleBoards.map((board, i) => {
          const cover = getCoverImage(board)
          const isEditing = editingBoardId === board.id

          return (
            <FadeInSection key={board.id} delay={i * 40}>
              <div className="group relative">
                <button
                  type="button"
                  data-testid="board-card"
                  onClick={() => {
                    if (!isEditing) {
                      router.push(`/app/tools/mood-boards?board=${board.id}`)
                    }
                  }}
                  className="w-full text-left rounded-xl border border-cream/10 overflow-hidden hover:border-cream/25 transition-colors bg-basalt-50"
                >
                  {/* Cover image */}
                  <div className="aspect-[4/3] bg-basalt relative">
                    {cover ? (
                      <ImageWithFallback
                        src={`/api/image-proxy?url=${encodeURIComponent(cover)}`}
                        alt={board.name}
                        className="w-full h-full object-cover"
                        fallback={
                          <div className="w-full h-full flex items-center justify-center bg-basalt-50">
                            <span className="text-3xl opacity-20">
                              {isDefaultBoard(board) ? '\u2764' : '\uD83C\uDFA8'}
                            </span>
                          </div>
                        }
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-basalt-50">
                        <span className="text-3xl opacity-20">
                          {isDefaultBoard(board) ? '\u2764' : '\uD83C\uDFA8'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(board.id)
                          if (e.key === 'Escape') {
                            setEditingBoardId(null)
                            setEditName('')
                          }
                        }}
                        onBlur={() => handleRename(board.id)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        className="w-full px-2 py-1 bg-basalt border border-cream/20 text-cream text-sm rounded focus:outline-none focus:border-sandstone"
                      />
                    ) : (
                      <p className="text-sm font-medium text-cream truncate">
                        {board.name}
                      </p>
                    )}
                    <p className="text-[11px] text-cream/40 mt-0.5">
                      {board.ideas.length} idea{board.ideas.length !== 1 ? 's' : ''}
                    </p>
                    {isDefaultBoard(board) && (
                      <p className="text-[10px] text-cream/25 mt-0.5 truncate">
                        Unsorted ideas from Save to HHC
                      </p>
                    )}
                    <BoardCardMeta board={board} />
                  </div>
                </button>

                {/* Context menu trigger */}
                {!readOnly && !isDefaultBoard(board) && (
                  <div className="absolute top-2 right-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuOpenId(menuOpenId === board.id ? null : board.id)
                      }}
                      className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                        <circle cx="12" cy="5" r="2" />
                        <circle cx="12" cy="12" r="2" />
                        <circle cx="12" cy="19" r="2" />
                      </svg>
                    </button>

                    {menuOpenId === board.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setMenuOpenId(null)}
                        />
                        <div className="absolute right-0 top-8 z-20 w-36 bg-basalt-50 border border-cream/15 rounded-lg shadow-xl py-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingBoardId(board.id)
                              setEditName(board.name)
                              setMenuOpenId(null)
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-cream/70 hover:bg-cream/5 transition-colors"
                          >
                            Rename
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeletingBoard(board)
                              setMenuOpenId(null)
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-cream/5 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </FadeInSection>
          )
        })}

        {/* New Board card */}
        {!readOnly && (
          <FadeInSection delay={visibleBoards.length * 40}>
            {isCreating ? (
              <div className="rounded-xl border border-sandstone/30 bg-basalt-50 p-4 flex flex-col gap-2">
                <input
                  type="text"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreate()
                    if (e.key === 'Escape') {
                      setIsCreating(false)
                      setNewBoardName('')
                    }
                  }}
                  placeholder="Board name..."
                  autoFocus
                  className="w-full px-3 py-2 bg-basalt border border-cream/20 text-cream text-sm rounded-lg placeholder:text-cream/30 focus:outline-none focus:border-sandstone"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={!newBoardName.trim()}
                    className="flex-1 px-3 py-1.5 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors disabled:opacity-30"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(false)
                      setNewBoardName('')
                    }}
                    className="px-3 py-1.5 text-sm text-cream/60 hover:text-cream transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                data-testid="new-board-btn"
                onClick={() => setIsCreating(true)}
                className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-cream/15 hover:border-sandstone/40 flex flex-col items-center justify-center gap-2 transition-colors bg-basalt-50/50"
              >
                <span className="w-10 h-10 rounded-full bg-sandstone/15 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-sandstone">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </span>
                <span className="text-sm text-cream/50">New Board</span>
              </button>
            )}
          </FadeInSection>
        )}
      </div>

      {/* Comments button */}
      {commentCount > 0 && (
        <div className="mt-6" data-testid="recent-activity">
          <button
            type="button"
            onClick={() => setCommentsOpen(true)}
            className="flex items-center gap-2 text-sm text-cream/50 hover:text-cream/70 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {commentCount} comment{commentCount !== 1 ? 's' : ''} across all boards
          </button>
        </div>
      )}

      {/* Comments panel */}
      {commentsOpen && (
        <CommentsPanel
          comments={allComments}
          onAddComment={() => {}}
          readOnly={true}
          onClose={() => setCommentsOpen(false)}
        />
      )}

      {deletingBoard && (
        <ConfirmDialog
          title={`Delete "${deletingBoard.name}"?`}
          message={`This will permanently delete this board and its ${deletingBoard.ideas.length} idea${deletingBoard.ideas.length !== 1 ? 's' : ''}. This can't be undone.`}
          confirmLabel="Delete Board"
          confirmVariant="danger"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingBoard(null)}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Board Card Meta
// ---------------------------------------------------------------------------

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

function truncateLabel(s: string, max = 40): string {
  return s.length > max ? s.slice(0, max).trimEnd() + '…' : s
}

function shortDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function BoardCardMeta({ board }: { board: Board }) {
  const lastComment = (board.comments || [])
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]

  return (
    <div className="mt-1.5 space-y-0.5">
      <p className="text-[10px] text-cream/25 truncate">
        Updated {relativeTime(board.updatedAt)}
      </p>
      {lastComment && (
        <p className="text-[10px] text-cream/25 truncate">
          {lastComment.authorName}: {truncateLabel(lastComment.text, 30)}
        </p>
      )}
      <p className="text-[10px] text-cream/20 truncate">
        Created {shortDate(board.createdAt)}
      </p>
    </div>
  )
}

