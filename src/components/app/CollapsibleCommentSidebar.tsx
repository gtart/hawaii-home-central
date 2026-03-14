'use client'

import { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react'
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
  /** Comment ID to auto-scroll to and highlight (deep link) */
  highlightCommentId?: string | null
  /** Whether there are unread comments (from real source of truth) */
  hasUnread?: boolean
  /** Render inline (full-width, non-sticky) instead of as a fixed-width sidebar */
  inline?: boolean
  /** Hide the collapsed tab — parent controls open/close via ref.toggle() */
  hideCollapsedTab?: boolean
  /** Default collapsed state when no stored preference exists (default: false = expanded) */
  defaultCollapsed?: boolean
  /** Collection ID for @mention picker */
  collectionId?: string
}

export interface CommentSidebarHandle {
  openMobileSheet: () => void
  toggle: () => void
}

export const CollapsibleCommentSidebar = forwardRef<CommentSidebarHandle, Props>(function CollapsibleCommentSidebar({
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
  highlightCommentId,
  hasUnread: hasUnreadProp,
  inline,
  hideCollapsedTab,
  defaultCollapsed = false,
  collectionId,
}: Props, ref: React.Ref<CommentSidebarHandle>) {
  // Use stored preference if available, otherwise respect defaultCollapsed prop
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return defaultCollapsed
    const stored = localStorage.getItem(storageKey)
    return stored === null ? defaultCollapsed : stored === 'true'
  })
  const [mobileOpen, setMobileOpen] = useState(false)

  // Force expand from parent
  useEffect(() => {
    if (forceExpand) {
      setCollapsed(false)
      setMobileOpen(true)
    }
  }, [forceExpand])

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(storageKey, String(next))
      return next
    })
  }, [storageKey])

  const openMobileSheet = useCallback(() => {
    setMobileOpen(true)
  }, [])

  useImperativeHandle(ref, () => ({ openMobileSheet, toggle }), [openMobileSheet, toggle])

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
    highlightCommentId,
    collectionId,
  }

  return (
    <>
      {/* ===== Desktop ===== */}
      {collapsed && !inline && !hideCollapsedTab && (
        /* Collapsed tab (standalone sidebar mode only) */
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
            {(commentCount > 0 || hasUnreadProp) && (
              <span className={`text-[10px] font-medium rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center ${
                hasUnreadProp
                  ? 'bg-sandstone/20 text-sandstone'
                  : 'bg-cream/10 text-cream/40'
              }`}>
                {commentCount}
              </span>
            )}
          </button>
        </div>
      )}
      {!collapsed && !hideCollapsedTab && (
        /* Expanded sidebar — in-flow (used by Selection detail) */
        <aside className={`hidden md:block shrink-0 ${
          inline
            ? 'w-full'
            : 'w-80 sticky top-24 self-start max-h-[calc(100vh-7rem)]'
        }`}>
          <div className={`bg-basalt-50 border border-cream/15 rounded-card flex flex-col ${
            inline ? 'max-h-[60vh]' : 'h-full max-h-[calc(100vh-7rem)]'
          }`}>
            <CommentThread {...threadProps} onClose={toggle} />
          </div>
        </aside>
      )}
      {/* Desktop overlay panel — slides from right, doesn't push content */}
      {!collapsed && hideCollapsedTab && (
        <div className="hidden md:block fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={toggle} />
          <aside className="absolute right-0 top-0 h-full w-96 bg-basalt-50 border-l border-cream/15 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <CommentThread {...threadProps} onClose={toggle} />
          </aside>
        </div>
      )}

      {/* ===== Mobile: bottom sheet (no floating bar — trigger is rendered by parent in header) ===== */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative bg-basalt-50 border-t border-cream/15 rounded-t-xl w-full max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex justify-center pt-2 pb-1" onClick={() => setMobileOpen(false)}>
              <div className="w-10 h-1 bg-cream/20 rounded-full" />
            </div>
            <CommentThread {...threadProps} onClose={() => setMobileOpen(false)} />
            <div className="pb-[env(safe-area-inset-bottom)]" />
          </div>
        </div>
      )}
    </>
  )
})

/**
 * Inline comment trigger button for use in page headers (mobile + desktop).
 * Renders a compact chat icon with count badge and optional unread dot.
 */
export function CommentTriggerButton({
  commentCount,
  hasUnread,
  onClick,
  className = '',
}: {
  commentCount: number
  hasUnread?: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg transition-colors shrink-0 ${
        hasUnread
          ? 'bg-sandstone/15 text-sandstone border border-sandstone/25 hover:bg-sandstone/25'
          : 'bg-cream/5 text-cream/50 hover:text-cream/70 hover:bg-cream/10'
      } ${className}`}
      title="Comments"
    >
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {commentCount > 0 && (
        <span className={`text-[10px] font-medium ${hasUnread ? 'text-sandstone' : 'text-cream/40'}`}>
          {commentCount}
        </span>
      )}
      {hasUnread && (
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-sandstone rounded-full" />
      )}
    </button>
  )
}
