'use client'

import { useState, useEffect, useCallback } from 'react'
import { CommentThread, type RefEntity } from './CommentThread'
import type { CommentRow } from '@/hooks/useComments'

interface Props {
  title: string
  storageKey: string
  comments: CommentRow[]
  isLoading: boolean
  readOnly: boolean
  onAddComment: (params: {
    text: string
    refEntityType?: string
    refEntityId?: string
    refEntityLabel?: string
  }) => Promise<void>
  onDeleteComment: (commentId: string) => Promise<void>
  onEditComment?: (commentId: string, text: string) => Promise<void>
  refEntities?: RefEntity[]
  refEntityType?: string
  refPickerLabel?: string
  initialRef?: RefEntity | null
  onClearInitialRef?: () => void
  onNavigateToRef?: (refEntityId: string) => void
  /** Force expand (e.g. when user triggers comment from outside) */
  forceExpand?: boolean
  /** Filter to show only comments for a specific entity */
  filterRefEntityId?: string | null
  filterRefEntityLabel?: string | null
  onClearFilter?: () => void
  /** Current user ID for edit permissions */
  currentUserId?: string | null
}

export function CollapsibleCommentSidebar({
  title,
  storageKey,
  comments,
  isLoading,
  readOnly,
  onAddComment,
  onDeleteComment,
  onEditComment,
  refEntities,
  refEntityType,
  refPickerLabel,
  initialRef,
  onClearInitialRef,
  onNavigateToRef,
  forceExpand,
  filterRefEntityId,
  filterRefEntityLabel,
  onClearFilter,
  currentUserId,
}: Props) {
  // Default expanded on first visit
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    const stored = localStorage.getItem(storageKey)
    return stored === 'true'
  })
  const [mobileOpen, setMobileOpen] = useState(false)

  // Track unseen count for badge
  const [lastSeenCount, setLastSeenCount] = useState(comments.length)
  const unseenCount = collapsed ? Math.max(0, comments.length - lastSeenCount) : 0

  // Force expand from parent
  useEffect(() => {
    if (forceExpand) {
      setCollapsed(false)
      setMobileOpen(true)
    }
  }, [forceExpand])

  // Reset unseen when expanded
  useEffect(() => {
    if (!collapsed) {
      setLastSeenCount(comments.length)
    }
  }, [collapsed, comments.length])

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(storageKey, String(next))
      if (!next) setLastSeenCount(comments.length)
      return next
    })
  }, [storageKey, comments.length])

  const commentCount = comments.length

  const threadProps = {
    mode: 'inline' as const,
    title,
    comments,
    isLoading,
    readOnly,
    onAddComment,
    onDeleteComment,
    onEditComment,
    refEntities,
    refEntityType,
    refPickerLabel,
    initialRef,
    onClearInitialRef,
    onNavigateToRef,
    filterRefEntityId,
    filterRefEntityLabel,
    onClearFilter,
    currentUserId,
  }

  return (
    <>
      {/* ===== Desktop ===== */}
      {collapsed ? (
        /* Collapsed tab */
        <div className="hidden md:flex shrink-0 w-10">
          <button
            type="button"
            onClick={toggle}
            className="sticky top-24 self-start w-10 h-auto flex flex-col items-center gap-2 py-3 bg-basalt-50 border border-cream/12 rounded-card hover:border-cream/20 transition-colors"
            title="Open comments"
          >
            <svg className="w-4 h-4 text-cream/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {(commentCount > 0 || unseenCount > 0) && (
              <span className={`text-[10px] font-medium rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center ${
                unseenCount > 0
                  ? 'bg-sandstone/20 text-sandstone'
                  : 'bg-cream/10 text-cream/40'
              }`}>
                {commentCount}
              </span>
            )}
          </button>
        </div>
      ) : (
        /* Expanded sidebar */
        <aside className="hidden md:block w-80 shrink-0 sticky top-24 self-start max-h-[calc(100vh-7rem)]">
          <div className="bg-basalt-50 border border-cream/15 rounded-card h-full flex flex-col max-h-[calc(100vh-7rem)]">
            <CommentThread {...threadProps} onClose={toggle} />
          </div>
        </aside>
      )}

      {/* ===== Mobile: floating button ===== */}
      {!mobileOpen && (
        <button
          type="button"
          onClick={() => { setMobileOpen(true); setLastSeenCount(comments.length) }}
          className="md:hidden fixed bottom-20 left-4 right-4 z-40 bg-basalt-50 border border-cream/15 rounded-xl shadow-lg px-4 py-3 flex items-center justify-between active:scale-[0.98] transition-transform"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-cream">
            <svg className="w-4 h-4 text-sandstone/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {title}
            {commentCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 bg-sandstone/20 text-sandstone text-xs font-medium rounded-full">
                {commentCount}
              </span>
            )}
          </span>
          <svg className="w-4 h-4 text-cream/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 15l-6-6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* ===== Mobile: bottom sheet ===== */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative bg-basalt-50 border-t border-cream/15 rounded-t-xl w-full max-h-[80vh] flex flex-col shadow-2xl">
            <CommentThread {...threadProps} onClose={() => setMobileOpen(false)} />
            <div className="pb-[env(safe-area-inset-bottom)]" />
          </div>
        </div>
      )}
    </>
  )
}
