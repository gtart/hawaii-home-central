'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { isDefaultBoard } from '@/data/mood-boards'
import type { Board, Idea, ReactionType } from '@/data/mood-boards'
import type { MoodBoardStateAPI } from '../useMoodBoardState'
import { uploadMoodBoardFile } from '../uploadMoodBoardFile'
import { IdeaTile } from './IdeaTile'
import { IdeaDetailModal } from './IdeaDetailModal'
import { CommentsPanel } from './CommentsPanel'
import { BookmarkletButton } from '@/app/app/tools/finish-decisions/components/BookmarkletButton'

interface Props {
  board: Board
  api: MoodBoardStateAPI
  readOnly: boolean
}

export function BoardDetailView({ board, api, readOnly }: Props) {
  const router = useRouter()
  const { data: session } = useSession()
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [boardName, setBoardName] = useState(board.name)
  const [showTextForm, setShowTextForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [draftRef, setDraftRef] = useState<{
    ideaId: string
    ideaLabel: string
  } | null>(null)
  const [showAddMenu, setShowAddMenu] = useState(false)

  // Text idea form state
  const [textIdeaName, setTextIdeaName] = useState('')
  const [textIdeaNotes, setTextIdeaNotes] = useState('')

  const galleryRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const selectedIdea = selectedIdeaId
    ? board.ideas.find((i) => i.id === selectedIdeaId) ?? null
    : null

  const commentCount = (board.comments || []).length
  const userEmail = session?.user?.email || ''
  const userName = session?.user?.name || ''

  const handleRename = () => {
    const trimmed = boardName.trim()
    if (trimmed && trimmed !== board.name) {
      api.renameBoard(board.id, trimmed)
    } else {
      setBoardName(board.name)
    }
    setEditingName(false)
  }

  const handlePhotoFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    setUploadError('')

    const fileArray = Array.from(files)

    // Upload in batches of 3
    for (let i = 0; i < fileArray.length; i += 3) {
      const batch = fileArray.slice(i, i + 3)
      const results = await Promise.allSettled(
        batch.map((f) => uploadMoodBoardFile(f))
      )

      for (let j = 0; j < results.length; j++) {
        const result = results[j]
        if (result.status === 'fulfilled') {
          const { url, thumbnailUrl, id } = result.value
          const fileName = batch[j].name.replace(/\.[^.]+$/, '')
          api.addIdea(board.id, {
            name: fileName,
            notes: '',
            images: [{ id, url, thumbnailUrl }],
            heroImageId: null,
            sourceUrl: '',
            sourceTitle: '',
            tags: [],
          })
        } else {
          setUploadError(
            result.reason?.message || 'One or more uploads failed'
          )
        }
      }
    }

    setUploading(false)
    if (galleryRef.current) galleryRef.current.value = ''
    if (cameraRef.current) cameraRef.current.value = ''
  }

  const handleAddTextIdea = () => {
    const trimmedName = textIdeaName.trim()
    if (!trimmedName) return
    api.addIdea(board.id, {
      name: trimmedName,
      notes: textIdeaNotes.trim(),
      images: [],
      heroImageId: null,
      sourceUrl: '',
      sourceTitle: '',
      tags: [],
    })
    setTextIdeaName('')
    setTextIdeaNotes('')
    setShowTextForm(false)
  }

  const handleCommentOnIdea = (ideaId: string, ideaName: string) => {
    setDraftRef({ ideaId, ideaLabel: ideaName })
    setCommentsOpen(true)
  }

  return (
    <div>
      {/* Hidden file inputs */}
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handlePhotoFiles(e.target.files)}
        className="hidden"
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handlePhotoFiles(e.target.files)}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => router.push('/app/tools/mood-boards')}
          className="text-cream/40 hover:text-cream/60 transition-colors shrink-0"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
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

        {/* Comments button */}
        <button
          type="button"
          onClick={() => setCommentsOpen(!commentsOpen)}
          className="relative shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-cream/40 hover:text-cream/60 hover:bg-cream/5 transition-colors"
          title="Comments"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {commentCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-sandstone text-basalt text-[10px] font-bold flex items-center justify-center">
              {commentCount}
            </span>
          )}
        </button>

        {/* Add Idea actions — Desktop */}
        {!readOnly && (
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              disabled={uploading}
              className="px-3 py-1.5 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors disabled:opacity-40"
            >
              {uploading ? 'Uploading...' : 'From Photo'}
            </button>
            <button
              type="button"
              onClick={() => setShowTextForm(!showTextForm)}
              className="px-3 py-1.5 text-sm text-cream/60 hover:text-cream border border-cream/20 rounded-lg transition-colors"
            >
              Text Note
            </button>
            <Link
              href={`/app/save-from-web?from=mood-boards&boardId=${board.id}`}
              className="px-3 py-1.5 text-sm text-cream/60 hover:text-cream border border-cream/20 rounded-lg transition-colors"
            >
              Save to HHC
            </Link>
          </div>
        )}

        {/* Add Idea actions — Mobile "+" menu */}
        {!readOnly && (
          <div className="relative sm:hidden shrink-0">
            <button
              type="button"
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="w-9 h-9 rounded-lg bg-sandstone text-basalt flex items-center justify-center"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            {showAddMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowAddMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-basalt-50 border border-cream/15 rounded-lg shadow-xl py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddMenu(false)
                      galleryRef.current?.click()
                    }}
                    disabled={uploading}
                    className="w-full text-left px-3 py-2.5 text-sm text-cream/70 hover:bg-cream/5 transition-colors disabled:opacity-40"
                  >
                    Upload Photos
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddMenu(false)
                      cameraRef.current?.click()
                    }}
                    disabled={uploading}
                    className="w-full text-left px-3 py-2.5 text-sm text-cream/70 hover:bg-cream/5 transition-colors disabled:opacity-40"
                  >
                    Take Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddMenu(false)
                      setShowTextForm(true)
                    }}
                    className="w-full text-left px-3 py-2.5 text-sm text-cream/70 hover:bg-cream/5 transition-colors"
                  >
                    Text Note
                  </button>
                  <Link
                    href={`/app/save-from-web?from=mood-boards&boardId=${board.id}`}
                    className="block w-full text-left px-3 py-2.5 text-sm text-cream/70 hover:bg-cream/5 transition-colors border-t border-cream/10 mt-1 pt-2.5"
                    onClick={() => setShowAddMenu(false)}
                  >
                    Save to HHC
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Upload error */}
      {uploadError && (
        <div className="mb-4 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
          {uploadError}
          <button
            type="button"
            onClick={() => setUploadError('')}
            className="ml-2 text-red-400/60 hover:text-red-400"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Uploading indicator */}
      {uploading && (
        <div className="mb-4 flex items-center gap-2 text-xs text-cream/40">
          <div className="w-3 h-3 border border-cream/20 border-t-cream/50 rounded-full animate-spin" />
          Uploading photos...
        </div>
      )}

      {/* Text idea form */}
      {showTextForm && !readOnly && (
        <div className="mb-6 bg-basalt-50 rounded-xl p-4 border border-cream/10 space-y-3">
          <h4 className="text-sm font-medium text-cream/70">Add a text note</h4>
          <input
            type="text"
            value={textIdeaName}
            onChange={(e) => setTextIdeaName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && textIdeaName.trim()) handleAddTextIdea()
              if (e.key === 'Escape') {
                setShowTextForm(false)
                setTextIdeaName('')
                setTextIdeaNotes('')
              }
            }}
            placeholder="Idea name..."
            autoFocus
            className="w-full px-3 py-2 bg-basalt border border-cream/20 text-cream text-sm rounded-lg placeholder:text-cream/30 focus:outline-none focus:border-sandstone"
          />
          <textarea
            value={textIdeaNotes}
            onChange={(e) => setTextIdeaNotes(e.target.value)}
            placeholder="Notes (optional) — price, dimensions, color, where you saw it..."
            rows={2}
            className="w-full px-3 py-2 bg-basalt border border-cream/20 text-cream text-sm rounded-lg placeholder:text-cream/30 focus:outline-none focus:border-sandstone resize-none"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddTextIdea}
              disabled={!textIdeaName.trim()}
              className="px-4 py-1.5 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors disabled:opacity-30"
            >
              Add Idea
            </button>
            <button
              type="button"
              onClick={() => {
                setShowTextForm(false)
                setTextIdeaName('')
                setTextIdeaNotes('')
              }}
              className="px-4 py-1.5 text-sm text-cream/60 hover:text-cream transition-colors"
            >
              Cancel
            </button>
          </div>
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
                commentCount={
                  (board.comments || []).filter(
                    (c) => c.refIdeaId === idea.id
                  ).length
                }
                reactions={idea.reactions}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-basalt-50 rounded-xl border border-cream/10">
          <p className="text-4xl mb-3 opacity-30">
            {isDefaultBoard(board) ? '\u2764' : '\uD83C\uDFA8'}
          </p>
          <h3 className="text-lg font-serif text-sandstone mb-2">
            No ideas yet
          </h3>
          <p className="text-cream/50 text-sm mb-6 max-w-sm mx-auto">
            Add ideas from photos, jot down a text note, or save from the web with the bookmarklet.
          </p>
          <div className="flex flex-col items-center gap-3">
            {!readOnly && (
              <>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => galleryRef.current?.click()}
                    disabled={uploading}
                    className="px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors disabled:opacity-40"
                  >
                    From Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTextForm(true)}
                    className="px-4 py-2 text-sm text-cream/60 hover:text-cream border border-cream/20 rounded-lg transition-colors"
                  >
                    Text Note
                  </button>
                  <Link
                    href={`/app/save-from-web?from=mood-boards&boardId=${board.id}`}
                    className="px-4 py-2 text-sm text-cream/60 hover:text-cream border border-cream/20 rounded-lg transition-colors"
                  >
                    Save to HHC
                  </Link>
                </div>
                <div className="mt-2">
                  <p className="text-[11px] text-cream/30 mb-1.5">
                    Or drag this to your bookmarks bar:
                  </p>
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
          onToggleReaction={(ideaId, reaction) =>
            api.toggleReaction(board.id, ideaId, userEmail, userName, reaction)
          }
          onCommentOnIdea={handleCommentOnIdea}
          currentUserEmail={userEmail}
        />
      )}

      {/* Comments panel */}
      {commentsOpen && (
        <CommentsPanel
          comments={board.comments || []}
          onAddComment={(comment) => api.addComment(board.id, comment)}
          readOnly={readOnly}
          onClose={() => {
            setCommentsOpen(false)
            setDraftRef(null)
          }}
          onOpenIdea={(ideaId) => {
            setSelectedIdeaId(ideaId)
          }}
          draftRef={draftRef}
          onClearDraftRef={() => setDraftRef(null)}
        />
      )}
    </div>
  )
}
