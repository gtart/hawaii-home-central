'use client'

import { useState } from 'react'
import type { DecisionV3, SelectionComment } from '@/data/finish-decisions'

interface AggregatedComment extends SelectionComment {
  decisionId: string
  decisionTitle: string
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
  decisions: DecisionV3[]
  roomType: string
  onClose: () => void
  onNavigateToDecision: (decisionId: string) => void
}

const PAGE_SIZE = 15

export function RoomCommentsFeed({ decisions, onClose, onNavigateToDecision }: Props) {
  const [page, setPage] = useState(0)

  // Aggregate all comments across decisions
  const allComments: AggregatedComment[] = decisions
    .flatMap((d) =>
      (d.comments || []).map((c) => ({
        ...c,
        decisionId: d.id,
        decisionTitle: d.title,
      }))
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const totalPages = Math.ceil(allComments.length / PAGE_SIZE)
  const pageComments = allComments.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <>
      {/* Desktop side panel */}
      <div className="hidden md:block fixed right-0 top-0 bottom-0 w-[384px] bg-basalt-50 border-l border-cream/10 z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-cream/10">
          <h3 className="text-sm font-medium text-cream/80">
            Comments Feed
            {allComments.length > 0 && (
              <span className="ml-1.5 text-cream/30 text-xs">({allComments.length})</span>
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

        {/* Comment list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {allComments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-cream/30">No comments yet across any selections.</p>
            </div>
          ) : (
            <>
              {pageComments.map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  onNavigate={() => onNavigateToDecision(comment.decisionId)}
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
              Comments Feed
              {allComments.length > 0 && (
                <span className="ml-1.5 text-cream/30 text-xs">({allComments.length})</span>
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

          {/* Comment list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {allComments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-cream/30">No comments yet.</p>
              </div>
            ) : (
              <>
                {pageComments.map((comment) => (
                  <CommentCard
                    key={comment.id}
                    comment={comment}
                    onNavigate={() => onNavigateToDecision(comment.decisionId)}
                  />
                ))}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 pt-2 pb-4">
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
        </div>
      </div>
    </>
  )
}

function CommentCard({
  comment,
  onNavigate,
}: {
  comment: AggregatedComment
  onNavigate: () => void
}) {
  return (
    <div className="bg-basalt/50 border border-cream/8 rounded-lg p-3 space-y-1.5">
      {/* Selection context */}
      <button
        type="button"
        onClick={onNavigate}
        className="text-[11px] text-sandstone/70 hover:text-sandstone transition-colors font-medium"
      >
        📋 {comment.decisionTitle} →
      </button>

      {/* If it references a specific option */}
      {comment.refOptionLabel && (
        <p className="text-[10px] text-cream/35">
          Re: <span className="text-cream/50">{comment.refOptionLabel}</span>
        </p>
      )}

      {/* Author + time */}
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-sandstone/20 text-sandstone text-[10px] font-bold flex items-center justify-center flex-shrink-0">
          {comment.authorName.charAt(0).toUpperCase()}
        </span>
        <span className="text-xs font-medium text-cream/70">{comment.authorName}</span>
        <span className="text-[10px] text-cream/25">{relativeTime(comment.createdAt)}</span>
      </div>

      {/* Comment text */}
      <p className="text-sm text-cream/70 whitespace-pre-wrap line-clamp-3 pl-7">
        {comment.text}
      </p>
    </div>
  )
}
