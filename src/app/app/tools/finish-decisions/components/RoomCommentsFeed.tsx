'use client'

import { useState, useRef, useEffect } from 'react'
import type { DecisionV3, RoomComment } from '@/data/finish-decisions'

function truncate(s: string, max = 40): string {
  return s.length > max ? s.slice(0, max).trimEnd() + '…' : s
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

interface Props {
  comments: RoomComment[]
  decisions: DecisionV3[]
  roomType: string
  readOnly: boolean
  onClose: () => void
  onAddComment: (text: string, refDecisionId?: string) => void
  onDeleteComment: (commentId: string) => void
  onNavigateToDecision: (decisionId: string) => void
}

const PAGE_SIZE = 15
const MAX_COMMENT_LENGTH = 400

export function RoomCommentsFeed({
  comments,
  decisions,
  readOnly,
  onClose,
  onAddComment,
  onDeleteComment,
  onNavigateToDecision,
}: Props) {
  const [page, setPage] = useState(0)
  const [draft, setDraft] = useState('')
  const [refDecisionId, setRefDecisionId] = useState<string | null>(null)
  const [showDecisionPicker, setShowDecisionPicker] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Sort comments newest-first
  const sorted = [...comments].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const pageComments = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  // Non-system decisions for the reference picker
  const pickableDecisions = decisions.filter((d) => d.systemKey !== 'uncategorized')

  function handleSubmit() {
    const text = draft.trim()
    if (!text) return
    onAddComment(text, refDecisionId || undefined)
    setDraft('')
    setRefDecisionId(null)
    setShowDecisionPicker(false)
    setPage(0)
  }

  // Auto-focus input when panel opens
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 200)
    return () => clearTimeout(timer)
  }, [])

  const commentInput = !readOnly && (
    <div className="border-t border-cream/10 p-4 space-y-2">
      {/* Decision reference chip */}
      {refDecisionId && (
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sandstone/10 text-sandstone text-[10px] font-medium rounded-full">
            Re: {truncate(pickableDecisions.find((d) => d.id === refDecisionId)?.title || '', 30)}
            <button
              type="button"
              onClick={() => setRefDecisionId(null)}
              className="ml-0.5 text-sandstone/50 hover:text-sandstone"
            >
              ×
            </button>
          </span>
        </div>
      )}

      <div className="flex gap-2">
        <textarea
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
          placeholder="Add a comment..."
          rows={2}
          className="flex-1 bg-basalt border border-cream/10 rounded-lg px-3 py-2 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/40 resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              handleSubmit()
            }
          }}
        />
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!draft.trim()}
            className="px-3 py-1.5 bg-sandstone text-basalt text-xs font-medium rounded-lg hover:bg-sandstone-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Post
          </button>
          {pickableDecisions.length > 0 && (
            <button
              type="button"
              onClick={() => setShowDecisionPicker(!showDecisionPicker)}
              className={`px-2 py-1 text-[10px] rounded-lg transition-colors ${
                showDecisionPicker ? 'bg-sandstone/20 text-sandstone' : 'text-cream/30 hover:text-cream/50 bg-cream/5'
              }`}
              title="Tag a decision"
            >
              📋
            </button>
          )}
        </div>
      </div>

      {/* Decision picker dropdown */}
      {showDecisionPicker && (
        <div className="bg-basalt border border-cream/10 rounded-lg p-2 max-h-32 overflow-y-auto space-y-0.5">
          <p className="text-[10px] text-cream/30 px-1 mb-1">Tag a decision:</p>
          {pickableDecisions.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => {
                setRefDecisionId(d.id)
                setShowDecisionPicker(false)
              }}
              className={`w-full text-left px-2 py-1 text-xs rounded transition-colors ${
                refDecisionId === d.id
                  ? 'bg-sandstone/20 text-sandstone'
                  : 'text-cream/60 hover:text-cream/80 hover:bg-cream/5'
              }`}
            >
              {truncate(d.title, 50)}
            </button>
          ))}
        </div>
      )}

      <p className="text-[10px] text-cream/20 text-right">
        {draft.length}/{MAX_COMMENT_LENGTH} · Ctrl+Enter to post
      </p>
    </div>
  )

  const commentList = (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {sorted.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-cream/30">No comments yet.</p>
          <p className="text-xs text-cream/20 mt-1">
            Leave a note about this room or tag a specific decision.
          </p>
        </div>
      ) : (
        <>
          {pageComments.map((comment) => (
            <RoomCommentCard
              key={comment.id}
              comment={comment}
              onNavigate={comment.refDecisionId ? () => onNavigateToDecision(comment.refDecisionId!) : undefined}
              onDelete={!readOnly ? () => onDeleteComment(comment.id) : undefined}
            />
          ))}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="text-xs text-cream/40 hover:text-cream/60 disabled:opacity-30 transition-colors"
              >
                ← Newer
              </button>
              <span className="text-[10px] text-cream/25">
                {page + 1} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="text-xs text-cream/40 hover:text-cream/60 disabled:opacity-30 transition-colors"
              >
                Older →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop side panel */}
      <div className="hidden md:flex fixed right-0 top-0 bottom-0 w-[384px] bg-basalt-50 border-l border-cream/10 z-50 flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-cream/10">
          <h3 className="text-sm font-medium text-cream/80">
            Room Comments
            {sorted.length > 0 && (
              <span className="ml-1.5 text-cream/30 text-xs">({sorted.length})</span>
            )}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-cream/40 hover:text-cream/60 hover:bg-cream/5 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {commentList}
        {commentInput}
      </div>

      {/* Mobile bottom sheet */}
      <div className="md:hidden fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="absolute bottom-0 left-0 right-0 bg-basalt-50 rounded-t-xl max-h-[80vh] flex flex-col border-t border-cream/10">
          {/* Handle */}
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 rounded-full bg-cream/20" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-cream/10">
            <h3 className="text-sm font-medium text-cream/80">
              Room Comments
              {sorted.length > 0 && (
                <span className="ml-1.5 text-cream/30 text-xs">({sorted.length})</span>
              )}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-cream/40 hover:text-cream/60 transition-colors"
            >
              Close
            </button>
          </div>

          {commentList}
          {commentInput}
        </div>
      </div>
    </>
  )
}

function RoomCommentCard({
  comment,
  onNavigate,
  onDelete,
}: {
  comment: RoomComment
  onNavigate?: () => void
  onDelete?: () => void
}) {
  return (
    <div className="bg-basalt/50 border border-cream/8 rounded-lg p-3 space-y-1.5 group">
      {/* Decision reference chip */}
      {comment.refDecisionTitle && onNavigate && (
        <button
          type="button"
          onClick={onNavigate}
          className="text-[11px] text-sandstone/70 hover:text-sandstone transition-colors font-medium"
        >
          📋 {truncate(comment.refDecisionTitle)} →
        </button>
      )}

      {/* Author + time + delete */}
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-sandstone/20 text-sandstone text-[10px] font-bold flex items-center justify-center flex-shrink-0">
          {comment.authorName.charAt(0).toUpperCase()}
        </span>
        <span className="text-xs font-medium text-cream/70">{comment.authorName}</span>
        <span className="text-[10px] text-cream/25">{relativeTime(comment.createdAt)}</span>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="ml-auto text-cream/15 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
            title="Delete"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Comment text */}
      <p className="text-sm text-cream/70 whitespace-pre-wrap line-clamp-5 pl-7">
        {comment.text}
      </p>
    </div>
  )
}
