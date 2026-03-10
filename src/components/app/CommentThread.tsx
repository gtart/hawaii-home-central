'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import type { CommentRow } from '@/hooks/useComments'

function truncateLabel(s: string, max = 40): string {
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

export interface RefEntity {
  id: string
  label: string
}

interface Props {
  title: string
  comments: CommentRow[]
  isLoading: boolean
  readOnly: boolean
  onClose: () => void
  onAddComment: (params: {
    text: string
    refEntityType?: string
    refEntityId?: string
    refEntityLabel?: string
  }) => Promise<void>
  onDeleteComment: (commentId: string) => Promise<void>
  onEditComment?: (commentId: string, text: string) => Promise<void>
  /** Available entities the user can reference in a comment (e.g. decisions, ideas) */
  refEntities?: RefEntity[]
  /** The refEntityType to use when tagging a reference (e.g. 'decision', 'idea', 'option') */
  refEntityType?: string
  /** Label for the reference picker (e.g. "Tag an option") */
  refPickerLabel?: string
  /** Pre-selected reference (e.g. when user clicks "comment on this idea") */
  initialRef?: RefEntity | null
  /** Called when initial ref is consumed/cleared */
  onClearInitialRef?: () => void
  /** Called when user clicks a reference chip on a comment */
  onNavigateToRef?: (refEntityId: string) => void
  pageSize?: number
  /** 'overlay' = modal with backdrop (default). 'inline' = renders as flex column, no backdrop/scroll lock. */
  mode?: 'overlay' | 'inline'
  /** If set, only show comments matching this refEntityId. null = show all. */
  filterRefEntityId?: string | null
  /** Label for the active filter (e.g. option name) */
  filterRefEntityLabel?: string | null
  /** Called when user wants to clear the filter */
  onClearFilter?: () => void
  /** Current user ID for determining edit permissions */
  currentUserId?: string | null
}

const MAX_COMMENT_LENGTH = 400
const NEW_COMMENT_HIGHLIGHT_MS = 4000

export function CommentThread({
  title,
  comments,
  isLoading,
  readOnly,
  onClose,
  onAddComment,
  onDeleteComment,
  onEditComment,
  refEntities,
  refEntityType,
  refPickerLabel = 'Tag an option',
  initialRef,
  onClearInitialRef,
  onNavigateToRef,
  pageSize = 15,
  mode = 'overlay',
  filterRefEntityId,
  filterRefEntityLabel,
  onClearFilter,
  currentUserId,
}: Props) {
  const [page, setPage] = useState(0)
  const [draft, setDraft] = useState('')
  const [selectedRef, setSelectedRef] = useState<RefEntity | null>(initialRef || null)
  const [showPicker, setShowPicker] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const prevCountRef = useRef(comments.length)
  const [highlightIds, setHighlightIds] = useState<Set<string>>(new Set())

  // Sync initialRef prop
  useEffect(() => {
    if (initialRef) {
      setSelectedRef(initialRef)
      inputRef.current?.focus()
    }
  }, [initialRef])

  // Filter + sort newest-first
  const filtered = useMemo(() => {
    const base = filterRefEntityId
      ? comments.filter((c) => c.refEntityId === filterRefEntityId)
      : comments
    return [...base].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [comments, filterRefEntityId])
  const sorted = filtered
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const pageComments = sorted.slice(page * pageSize, (page + 1) * pageSize)

  // Reset page when filter changes
  useEffect(() => {
    setPage(0)
  }, [filterRefEntityId])

  // Auto-scroll + highlight when new comments arrive
  useEffect(() => {
    if (comments.length > prevCountRef.current && page === 0) {
      listRef.current?.scrollTo({ top: 0, behavior: 'smooth' })

      const newIds = new Set<string>()
      const now = Date.now()
      for (const c of comments) {
        if (now - new Date(c.createdAt).getTime() < NEW_COMMENT_HIGHLIGHT_MS) {
          newIds.add(c.id)
        }
      }
      if (newIds.size > 0) {
        setHighlightIds(newIds)
        setTimeout(() => setHighlightIds(new Set()), NEW_COMMENT_HIGHLIGHT_MS)
      }
    }
    prevCountRef.current = comments.length
  }, [comments, comments.length, page])

  // Overlay-only effects
  useEffect(() => {
    if (mode !== 'overlay') return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, mode])

  useEffect(() => {
    if (mode !== 'overlay') return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [mode])

  const handleSubmit = useCallback(async () => {
    const text = draft.trim()
    if (!text) return

    await onAddComment({
      text,
      ...(selectedRef && refEntityType
        ? {
            refEntityType,
            refEntityId: selectedRef.id,
            refEntityLabel: selectedRef.label,
          }
        : {}),
    })
    setDraft('')
    setSelectedRef(null)
    onClearInitialRef?.()
    setShowPicker(false)
    setPage(0)
  }, [draft, selectedRef, refEntityType, onAddComment, onClearInitialRef])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const commentInput = !readOnly && (
    <div className="border-t border-cream/12 p-4 space-y-2">
      {/* Reference chip */}
      {selectedRef && (
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sandstone/10 text-sandstone text-[10px] font-medium rounded-full">
            Re: {truncateLabel(selectedRef.label, 30)}
            <button
              type="button"
              onClick={() => {
                setSelectedRef(null)
                onClearInitialRef?.()
              }}
              className="ml-0.5 text-sandstone/50 hover:text-sandstone"
            >
              ×
            </button>
          </span>
        </div>
      )}

      <div className="relative">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
            placeholder={
              selectedRef
                ? `Comment on ${truncateLabel(selectedRef.label)}...`
                : 'Add a comment...'
            }
            rows={2}
            className="flex-1 bg-basalt border border-cream/12 rounded-lg px-3 py-2 text-sm text-cream placeholder:text-cream/35 focus:outline-none focus:border-sandstone/40 resize-none"
            onKeyDown={handleKeyDown}
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
            {refEntities && refEntities.length > 0 && (
              <button
                type="button"
                onClick={() => setShowPicker(!showPicker)}
                className={`px-2 py-1 text-[10px] rounded-lg transition-colors ${
                  showPicker ? 'bg-sandstone/20 text-sandstone' : 'text-cream/35 hover:text-cream/55 bg-cream/5'
                }`}
                title={refPickerLabel}
              >
                <svg className="w-3 h-3 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="7" y1="7" x2="7.01" y2="7" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reference picker dropdown */}
      {showPicker && refEntities && (
        <div className="bg-basalt border border-cream/12 rounded-lg p-2 max-h-32 overflow-y-auto space-y-0.5">
          <p className="text-[10px] text-cream/35 px-1 mb-1">{refPickerLabel}:</p>
          {refEntities.map((entity) => (
            <button
              key={entity.id}
              type="button"
              onClick={() => {
                setSelectedRef(entity)
                setShowPicker(false)
              }}
              className={`w-full text-left px-2 py-1 text-xs rounded transition-colors ${
                selectedRef?.id === entity.id
                  ? 'bg-sandstone/20 text-sandstone'
                  : 'text-cream/60 hover:text-cream/80 hover:bg-cream/5'
              }`}
            >
              {truncateLabel(entity.label, 50)}
            </button>
          ))}
        </div>
      )}

      <p className="text-[10px] text-cream/25 text-right">
        {draft.length > 0 && `${draft.length}/${MAX_COMMENT_LENGTH} · `}Ctrl+Enter to post
      </p>
    </div>
  )

  const commentList = (
    <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-sm text-cream/40">Loading comments...</p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-cream/40">No comments yet.</p>
          <p className="text-xs text-cream/30 mt-1">Be the first to leave a note.</p>
        </div>
      ) : (
        <>
          {pageComments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              highlight={highlightIds.has(comment.id)}
              onNavigateToRef={
                comment.refEntityId && onNavigateToRef
                  ? () => onNavigateToRef(comment.refEntityId!)
                  : undefined
              }
              onDelete={!readOnly ? () => onDeleteComment(comment.id) : undefined}
              onEdit={
                onEditComment && currentUserId && comment.authorUserId === currentUserId
                  ? (text: string) => onEditComment(comment.id, text)
                  : undefined
              }
              isOwnComment={!!currentUserId && comment.authorUserId === currentUserId}
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
              <span className="text-[10px] text-cream/35">
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

  const header = (
    <div className="shrink-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-cream/12">
        <h3 className="text-sm font-medium text-cream/80">
          {title}
          {sorted.length > 0 && (
            <span className="ml-1.5 text-cream/35 text-xs">({sorted.length})</span>
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
      {filterRefEntityLabel && onClearFilter && (
        <div className="px-4 py-2 border-b border-cream/8 bg-sandstone/5 flex items-center justify-between gap-2">
          <span className="text-[11px] text-cream/60 truncate">
            Showing: <span className="text-cream/75 font-medium">{truncateLabel(filterRefEntityLabel, 30)}</span>
          </span>
          <button
            type="button"
            onClick={onClearFilter}
            className="text-[11px] text-sandstone/70 hover:text-sandstone transition-colors whitespace-nowrap shrink-0"
          >
            Show all ({comments.length})
          </button>
        </div>
      )}
    </div>
  )

  // Inline mode: render as a simple flex column
  if (mode === 'inline') {
    return (
      <div className="flex flex-col h-full">
        {header}
        {commentList}
        {commentInput}
      </div>
    )
  }

  // Overlay mode (default): backdrop + fixed panels
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Desktop: right side panel */}
      <div className="hidden md:flex fixed right-0 top-0 bottom-0 z-[56] w-96 bg-basalt-50 border-l border-cream/15 flex-col shadow-2xl">
        {header}
        {commentList}
        {commentInput}
      </div>

      {/* Mobile: bottom sheet */}
      <div className="md:hidden fixed inset-x-0 bottom-0 z-[56] bg-basalt-50 border-t border-cream/15 rounded-t-xl flex flex-col max-h-[80vh] shadow-2xl">
        {/* Handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-cream/20" />
        </div>
        <div className="flex items-center justify-between px-4 py-2 border-b border-cream/12 shrink-0">
          <h3 className="text-sm font-medium text-cream/80">
            {title}
            {sorted.length > 0 && (
              <span className="ml-1.5 text-cream/35 text-xs">({sorted.length})</span>
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
    </>
  )
}

function CommentCard({
  comment,
  highlight,
  onNavigateToRef,
  onDelete,
  onEdit,
  isOwnComment,
}: {
  comment: CommentRow
  highlight?: boolean
  onNavigateToRef?: () => void
  onDelete?: () => void
  onEdit?: (text: string) => Promise<void>
  isOwnComment?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [editDraft, setEditDraft] = useState(comment.text)
  const [saving, setSaving] = useState(false)
  const editRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editing) {
      editRef.current?.focus()
      // Set cursor to end
      const len = editRef.current?.value.length ?? 0
      editRef.current?.setSelectionRange(len, len)
    }
  }, [editing])

  async function handleSaveEdit() {
    const text = editDraft.trim()
    if (!text || !onEdit) return
    if (text === comment.text) {
      setEditing(false)
      return
    }
    setSaving(true)
    try {
      await onEdit(text)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  function handleEditKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSaveEdit()
    }
    if (e.key === 'Escape') {
      setEditing(false)
      setEditDraft(comment.text)
    }
  }

  return (
    <div className={`border rounded-lg p-3 space-y-1.5 group transition-colors duration-1000 ${
      highlight
        ? 'bg-sandstone/10 border-sandstone/20'
        : 'bg-cream/[0.04] border-cream/12'
    }`}>
      {/* Reference chip */}
      {comment.refEntityLabel && onNavigateToRef && (
        <button
          type="button"
          onClick={onNavigateToRef}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] bg-sandstone/10 text-sandstone/80 hover:bg-sandstone/20 transition-colors"
        >
          Re: {truncateLabel(comment.refEntityLabel)} →
        </button>
      )}
      {comment.refEntityLabel && !onNavigateToRef && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-sandstone/10 text-sandstone/70">
          Re: {truncateLabel(comment.refEntityLabel)}
        </span>
      )}

      {/* Author + time + actions */}
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-sandstone/20 text-sandstone text-[10px] font-bold flex items-center justify-center flex-shrink-0">
          {comment.authorName.charAt(0).toUpperCase() || '?'}
        </span>
        <span className="text-xs font-medium text-cream/75">{comment.authorName || 'Unknown'}</span>
        <span className="text-[10px] text-cream/35">{relativeTime(comment.createdAt)}</span>
        {comment.edited && (
          <span className="text-[10px] text-cream/30 italic">(edited)</span>
        )}
        <span className="ml-auto flex items-center gap-1">
          {onEdit && isOwnComment && !editing && (
            <button
              type="button"
              onClick={() => { setEditDraft(comment.text); setEditing(true) }}
              className="text-cream/15 hover:text-cream/50 opacity-0 group-hover:opacity-100 transition-all"
              title="Edit"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="text-cream/15 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
              title="Delete"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </span>
      </div>

      {/* Comment text or edit mode */}
      {editing ? (
        <div className="pl-7 space-y-1.5">
          <textarea
            ref={editRef}
            value={editDraft}
            onChange={(e) => setEditDraft(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
            onKeyDown={handleEditKeyDown}
            rows={2}
            className="w-full bg-basalt border border-cream/15 rounded-lg px-3 py-2 text-sm text-cream placeholder:text-cream/35 focus:outline-none focus:border-sandstone/40 resize-none"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={saving || !editDraft.trim()}
              className="px-2.5 py-1 bg-sandstone text-basalt text-[11px] font-medium rounded-md hover:bg-sandstone-light transition-colors disabled:opacity-30"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => { setEditing(false); setEditDraft(comment.text) }}
              className="px-2.5 py-1 text-[11px] text-cream/40 hover:text-cream/60 transition-colors"
            >
              Cancel
            </button>
            <span className="text-[10px] text-cream/25 ml-auto">Esc to cancel</span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-cream/80 whitespace-pre-wrap line-clamp-5 pl-7">
          {comment.text}
        </p>
      )}
    </div>
  )
}
