'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import type { MoodBoardComment } from '@/data/mood-boards'

const COMMENTS_PER_PAGE = 10
const MAX_COMMENT_LENGTH = 400

function truncateLabel(s: string, max = 40): string {
  return s.length > max ? s.slice(0, max).trimEnd() + '…' : s
}

interface Props {
  comments: MoodBoardComment[]
  onAddComment: (comment: {
    text: string
    authorName: string
    authorEmail: string
    refIdeaId?: string
    refIdeaLabel?: string
  }) => void
  readOnly: boolean
  onClose: () => void
  onOpenIdea?: (ideaId: string) => void
  draftRef?: { ideaId: string; ideaLabel: string } | null
  onClearDraftRef?: () => void
}

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

export function CommentsPanel({
  comments,
  onAddComment,
  readOnly,
  onClose,
  onOpenIdea,
  draftRef,
  onClearDraftRef,
}: Props) {
  const { data: session } = useSession()
  const [page, setPage] = useState(0)
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Focus input when panel opens or draftRef changes
  useEffect(() => {
    if (draftRef && inputRef.current) {
      inputRef.current.focus()
    }
  }, [draftRef])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const sorted = [...comments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  const totalPages = Math.max(1, Math.ceil(sorted.length / COMMENTS_PER_PAGE))
  const pageComments = sorted.slice(
    page * COMMENTS_PER_PAGE,
    (page + 1) * COMMENTS_PER_PAGE
  )

  const handleSubmit = () => {
    const trimmed = text.trim()
    if (!trimmed || !session?.user) return

    onAddComment({
      text: trimmed,
      authorName: session.user.name || 'Anonymous',
      authorEmail: session.user.email || '',
      ...(draftRef
        ? { refIdeaId: draftRef.ideaId, refIdeaLabel: draftRef.ideaLabel }
        : {}),
    })
    setText('')
    onClearDraftRef?.()
    setPage(0) // Jump to first page to see new comment
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const panelContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-cream/10">
        <h3 className="text-sm font-medium text-cream">
          Board Chat{' '}
          {comments.length > 0 && (
            <span className="text-cream/40">({comments.length})</span>
          )}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-full flex items-center justify-center text-cream/40 hover:text-cream/60 hover:bg-cream/5 transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Comment input */}
      {!readOnly && (
        <div className="p-4 border-b border-cream/10 space-y-2">
          {draftRef && (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-sandstone/10 text-sandstone/80">
                Re: {truncateLabel(draftRef.ideaLabel)}
                <button
                  type="button"
                  onClick={onClearDraftRef}
                  className="ml-0.5 text-sandstone/50 hover:text-sandstone"
                >
                  &times;
                </button>
              </span>
            </div>
          )}
          <div className="relative">
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) =>
                setText(e.target.value.slice(0, MAX_COMMENT_LENGTH))
              }
              onKeyDown={handleKeyDown}
              placeholder={
                draftRef
                  ? `Comment on ${truncateLabel(draftRef.ideaLabel)}...`
                  : 'Add a comment...'
              }
              rows={2}
              className="w-full px-3 py-2 bg-basalt border border-cream/20 text-cream text-sm rounded-lg placeholder:text-cream/30 focus:outline-none focus:border-sandstone resize-none"
            />
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[10px] text-cream/30">
                {text.length > 0 && `${text.length}/${MAX_COMMENT_LENGTH}`}
              </span>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!text.trim()}
                className="px-3 py-1 bg-sandstone text-basalt text-xs font-medium rounded-md hover:bg-sandstone-light transition-colors disabled:opacity-30"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {pageComments.length === 0 ? (
          <p className="text-center text-sm text-cream/40 py-8">
            No comments yet. Be the first!
          </p>
        ) : (
          pageComments.map((comment) => (
            <div key={comment.id} className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-cream/70">
                  {comment.authorName}
                </span>
                <span className="text-cream/20">&middot;</span>
                <span className="text-[11px] text-cream/30">
                  {relativeTime(comment.createdAt)}
                </span>
              </div>
              {comment.refIdeaId && comment.refIdeaLabel && (
                <button
                  type="button"
                  onClick={() => onOpenIdea?.(comment.refIdeaId!)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-sandstone/10 text-sandstone/80 hover:bg-sandstone/20 transition-colors"
                >
                  &uarr; Re: {truncateLabel(comment.refIdeaLabel)}
                </button>
              )}
              <p className="text-sm text-cream/80 whitespace-pre-wrap">
                {comment.text}
              </p>
            </div>
          ))
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="text-xs text-cream/40 hover:text-cream/60 disabled:opacity-30"
            >
              Newer
            </button>
            <span className="text-[10px] text-cream/30">
              {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="text-xs text-cream/40 hover:text-cream/60 disabled:opacity-30"
            >
              Older
            </button>
          </div>
        )}
      </div>
    </>
  )

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[55] bg-black/30"
        onClick={onClose}
      />

      {/* Desktop: right side panel */}
      <div className="hidden md:flex fixed right-0 top-0 bottom-0 z-[56] w-96 bg-basalt-50 border-l border-cream/10 flex-col shadow-2xl">
        {panelContent}
      </div>

      {/* Mobile: bottom sheet */}
      <div className="md:hidden fixed inset-x-0 bottom-0 z-[56] bg-basalt-50 border-t border-cream/10 rounded-t-xl flex flex-col max-h-[80vh] shadow-2xl">
        {panelContent}
      </div>
    </>
  )
}
