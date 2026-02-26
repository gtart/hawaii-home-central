'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ImageWithFallback } from '@/components/ui/ImageWithFallback'
import { FadeInSection } from '@/components/effects/FadeInSection'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import Link from 'next/link'
import { isDefaultBoard } from '@/data/mood-boards'
import type { Board } from '@/data/mood-boards'
import type { MoodBoardStateAPI } from '../useMoodBoardState'

interface Props {
  api: MoodBoardStateAPI
  readOnly: boolean
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

export function BoardsHomeView({ api, readOnly }: Props) {
  const router = useRouter()
  const { payload, addBoard, renameBoard, deleteBoard } = api
  const [newBoardName, setNewBoardName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deletingBoard, setDeletingBoard] = useState<Board | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  const handleCreate = () => {
    const trimmed = newBoardName.trim()
    if (!trimmed) return
    const id = addBoard(trimmed)
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
        {payload.boards.map((board, i) => {
          const cover = getCoverImage(board)
          const isEditing = editingBoardId === board.id

          return (
            <FadeInSection key={board.id} delay={i * 40}>
              <div className="group relative">
                <button
                  type="button"
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
          <FadeInSection delay={payload.boards.length * 40}>
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

      {/* Recent Activity feed */}
      <RecentActivity boards={payload.boards} />

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
// Recent Activity
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

interface ActivityComment {
  id: string
  text: string
  authorName: string
  createdAt: string
  refIdeaId?: string
  refIdeaLabel?: string
  boardId: string
  boardName: string
}

function RecentActivity({ boards }: { boards: Board[] }) {
  const allComments: ActivityComment[] = boards
    .flatMap((board) =>
      (board.comments || []).map((c) => ({
        ...c,
        boardId: board.id,
        boardName: board.name,
      }))
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10)

  if (allComments.length === 0) return null

  return (
    <div className="mt-8">
      <h3 className="text-sm font-medium text-cream/60 mb-3">
        Recent Activity
      </h3>
      <div className="space-y-3">
        {allComments.map((comment) => (
          <div
            key={comment.id}
            className="bg-basalt-50 border border-cream/10 rounded-lg p-3"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-cream/70">
                {comment.authorName}
              </span>
              <span className="text-cream/20">&middot;</span>
              <span className="text-[11px] text-cream/30">
                {relativeTime(comment.createdAt)}
              </span>
              <span className="text-cream/20">&middot;</span>
              <Link
                href={`/app/tools/mood-boards?board=${comment.boardId}`}
                className="text-[11px] text-sandstone/60 hover:text-sandstone transition-colors"
              >
                {comment.boardName}
              </Link>
            </div>
            {comment.refIdeaId && comment.refIdeaLabel && (
              <Link
                href={`/app/tools/mood-boards?board=${comment.boardId}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-sandstone/10 text-sandstone/80 hover:bg-sandstone/20 transition-colors mb-1"
              >
                Re: {truncateLabel(comment.refIdeaLabel)}
              </Link>
            )}
            <p className="text-sm text-cream/70 line-clamp-2">
              {comment.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
