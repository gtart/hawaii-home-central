'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useProject } from '@/contexts/ProjectContext'
import Link from 'next/link'
import { isDefaultBoard } from '@/data/mood-boards'
import type { Board, Idea, ReactionType } from '@/data/mood-boards'
import type { MoodBoardStateAPI } from '../useMoodBoardState'
import { uploadMoodBoardFile } from '../uploadMoodBoardFile'
import { IdeaTile } from './IdeaTile'
import { IdeaDetailModal } from './IdeaDetailModal'
import { CommentsPanel } from './CommentsPanel'
import { ExportBoardModal } from './ExportBoardModal'
import { BoardSettingsSheet } from './BoardSettingsSheet'

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
  board: Board
  api: MoodBoardStateAPI
  readOnly: boolean
  toolAccess: string
}

export function BoardDetailView({ board, api, readOnly, toolAccess }: Props) {
  const router = useRouter()
  const { data: session } = useSession()
  const { currentProject } = useProject()
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
  const [showExport, setShowExport] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Search + filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set())

  // Undo delete state
  const [undoToast, setUndoToast] = useState<{ idea: Idea; boardId: string } | null>(null)
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Unread comments
  const [hasUnread, setHasUnread] = useState(false)
  const [lastActivity, setLastActivity] = useState<string | null>(null)

  // Batch upload notification
  const [uploadedCount, setUploadedCount] = useState(0)
  const uploadedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // Lazy-load tool members for board settings
  const [toolMembers, setToolMembers] = useState<string[]>([])
  const loadedMembersRef = useRef(false)

  const loadToolMembers = useCallback(async () => {
    if (loadedMembersRef.current || !currentProject?.id) return
    loadedMembersRef.current = true
    try {
      const res = await fetch(`/api/projects/${currentProject.id}/tools/mood_boards/share`)
      if (!res.ok) return
      const data = await res.json()
      const emails: string[] = (data.access || [])
        .map((a: { email?: string | null }) => a.email)
        .filter(Boolean)
      setToolMembers(emails)
    } catch {
      // fail gracefully — settings sheet will show "no members"
    }
  }, [currentProject?.id])

  useEffect(() => {
    loadToolMembers()
  }, [loadToolMembers])

  // Share link count (owners only) — for the status chip
  const [shareLinkCount, setShareLinkCount] = useState(0)
  const loadedShareCountRef = useRef(false)

  useEffect(() => {
    if (toolAccess !== 'OWNER' || !currentProject?.id || loadedShareCountRef.current) return
    loadedShareCountRef.current = true
    fetch(`/api/tools/mood_boards/share-token?projectId=${currentProject.id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return
        const count = (data.tokens as { boardId: string | null }[]).filter(
          (t) => t.boardId === board.id
        ).length
        setShareLinkCount(count)
      })
      .catch(() => {})
  }, [toolAccess, currentProject?.id, board.id])

  // Unread comments detection (localStorage-based)
  useEffect(() => {
    const comments = board.comments || []
    if (comments.length === 0) {
      setHasUnread(false)
      setLastActivity(null)
      return
    }
    const latest = comments.reduce(
      (max, c) => (c.createdAt > max ? c.createdAt : max),
      comments[0].createdAt
    )
    setLastActivity(latest)
    try {
      const stored = localStorage.getItem(`hhc_mb_seen_${board.id}`)
      setHasUnread(!stored || latest > stored)
    } catch {
      setHasUnread(false)
    }
  }, [board.comments, board.id])

  // Mark comments as seen when panel opens
  useEffect(() => {
    if (!commentsOpen) return
    const comments = board.comments || []
    if (comments.length === 0) return
    const latest = comments.reduce(
      (max, c) => (c.createdAt > max ? c.createdAt : max),
      comments[0].createdAt
    )
    try {
      localStorage.setItem(`hhc_mb_seen_${board.id}`, latest)
    } catch {}
    setHasUnread(false)
  }, [commentsOpen, board.comments, board.id])

  // Cleanup undo timer on unmount
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    }
  }, [])

  // ESC to close + Add dropdown
  useEffect(() => {
    if (!showAddMenu) return
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowAddMenu(false)
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [showAddMenu])

  // Board collaborators for membership display
  const boardCollaborators = useMemo(() => {
    if (board.visibility === 'invite-only') {
      const emails = new Set<string>()
      if (board.createdBy) emails.add(board.createdBy)
      for (const a of board.access || []) emails.add(a.email)
      return Array.from(emails).filter((e) => e !== userEmail)
    }
    return toolMembers.filter((e) => e !== userEmail)
  }, [board.visibility, board.access, board.createdBy, toolMembers, userEmail])

  // Search + filter computation
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    for (const idea of board.ideas) {
      for (const tag of idea.tags) tags.add(tag)
    }
    return Array.from(tags).sort()
  }, [board.ideas])

  const filteredIdeas = useMemo(() => {
    let ideas = board.ideas
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      ideas = ideas.filter((i) => i.name.toLowerCase().includes(q))
    }
    if (activeFilters.has('loved')) {
      ideas = ideas.filter((i) => (i.reactions || []).some((r) => r.reaction === 'love'))
    }
    if (activeFilters.has('liked')) {
      ideas = ideas.filter((i) => (i.reactions || []).some((r) => r.reaction === 'like'))
    }
    if (activeFilters.has('has-comments')) {
      ideas = ideas.filter((i) =>
        (board.comments || []).some((c) => c.refIdeaId === i.id)
      )
    }
    for (const f of activeFilters) {
      if (f.startsWith('tag:')) {
        ideas = ideas.filter((i) => i.tags.includes(f.slice(4)))
      }
    }
    return ideas
  }, [board.ideas, board.comments, searchQuery, activeFilters])

  const isFiltering = searchQuery.trim() !== '' || activeFilters.size > 0

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
    let successCount = 0

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
            sourceUrl: null,
            sourceTitle: null,
            tags: [],
          })
          successCount++
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

    // Show batch notification for multi-uploads
    if (successCount > 1) {
      if (uploadedTimerRef.current) clearTimeout(uploadedTimerRef.current)
      setUploadedCount(successCount)
      uploadedTimerRef.current = setTimeout(() => setUploadedCount(0), 5000)
    }
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

  const handleDeleteWithUndo = (ideaId: string) => {
    const idea = board.ideas.find((i) => i.id === ideaId)
    if (!idea) return
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    api.deleteIdea(board.id, ideaId)
    setSelectedIdeaId(null)
    setUndoToast({ idea, boardId: board.id })
    undoTimerRef.current = setTimeout(() => setUndoToast(null), 10_000)
  }

  const handleUndo = () => {
    if (!undoToast) return
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    api.restoreIdea(undoToast.boardId, undoToast.idea)
    setUndoToast(null)
  }

  const handleQuickRename = (ideaId: string, newName: string) => {
    api.updateIdea(board.id, ideaId, { name: newName })
  }

  const toggleFilter = (key: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const isOwner = toolAccess === 'OWNER'
  const canManageBoard = !readOnly && !isDefaultBoard(board) && (board.createdBy === userEmail || isOwner)

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
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-cream/40">
              {board.ideas.length} idea{board.ideas.length !== 1 ? 's' : ''}
            </p>
            {/* Share status chip — actionable for owners, informational for others */}
            {!isDefaultBoard(board) && (
              isOwner ? (
                <button
                  type="button"
                  onClick={() => setShowSettings(true)}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-cream/5 text-cream/35 hover:text-cream/50 hover:bg-cream/8 transition-colors"
                >
                  {shareLinkCount > 0
                    ? `${shareLinkCount} public link${shareLinkCount !== 1 ? 's' : ''}`
                    : 'Not shared'}
                </button>
              ) : board.visibility === 'invite-only' ? (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-cream/5 text-cream/25">
                  Invite-only
                </span>
              ) : null
            )}
          </div>
          {isDefaultBoard(board) && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-[11px] text-cream/30">
                Ideas saved from the web land here. Sort them into boards when you&apos;re ready.
              </p>
              <span className="relative group/tip">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cream/20 cursor-help">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2.5 py-1.5 rounded-lg bg-basalt border border-cream/15 text-[10px] text-cream/60 whitespace-nowrap opacity-0 pointer-events-none group-hover/tip:opacity-100 transition-opacity z-20 shadow-lg">
                  This is your default board for unsorted ideas.
                </span>
              </span>
            </div>
          )}
          {/* Collaborator row + last activity */}
          {(boardCollaborators.length > 0 || board.visibility === 'invite-only' || lastActivity) && (
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {boardCollaborators.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="flex -space-x-1.5">
                    {boardCollaborators.slice(0, 4).map((email) => (
                      <span
                        key={email}
                        className="w-5 h-5 rounded-full bg-sandstone/20 text-sandstone text-[9px] font-bold flex items-center justify-center ring-1 ring-basalt"
                        title={email}
                      >
                        {email.charAt(0).toUpperCase()}
                      </span>
                    ))}
                    {boardCollaborators.length > 4 && (
                      <span className="w-5 h-5 rounded-full bg-cream/10 text-cream/40 text-[9px] font-bold flex items-center justify-center ring-1 ring-basalt">
                        +{boardCollaborators.length - 4}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-cream/30">
                    Shared with {boardCollaborators.length}
                  </span>
                </div>
              )}
              {board.visibility === 'invite-only' && (
                <span className="text-[11px] text-cream/25 flex items-center gap-0.5" title="Invite-only board">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  Invite-only
                </span>
              )}
              {lastActivity && (
                <span className="text-[11px] text-cream/20">
                  Last comment {relativeTime(lastActivity)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Settings button — visible to board creator on non-default boards */}
        {canManageBoard && (
          <span className="relative group/tip shrink-0">
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-cream/40 hover:text-cream/60 hover:bg-cream/5 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className="hidden sm:block absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 rounded bg-basalt border border-cream/15 text-[10px] text-cream/60 whitespace-nowrap opacity-0 pointer-events-none group-hover/tip:opacity-100 transition-opacity z-20 shadow-lg">
              Settings
            </span>
          </span>
        )}

        {/* Export button */}
        {board.ideas.length > 0 && (
          <span className="relative group/tip shrink-0">
            <button
              type="button"
              onClick={() => setShowExport(true)}
              className="h-9 rounded-lg flex items-center gap-1.5 px-2 text-cream/40 hover:text-cream/60 hover:bg-cream/5 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="7 10 12 15 17 10" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="hidden sm:inline text-xs">Export</span>
            </button>
            <span className="sm:hidden absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 rounded bg-basalt border border-cream/15 text-[10px] text-cream/60 whitespace-nowrap opacity-0 pointer-events-none group-hover/tip:opacity-100 transition-opacity z-20 shadow-lg">
              Export PDF
            </span>
          </span>
        )}

        {/* Comments button */}
        <span className="relative group/tip shrink-0">
          <button
            type="button"
            data-testid="comments-btn"
            onClick={() => setCommentsOpen(!commentsOpen)}
            className="relative w-9 h-9 rounded-lg flex items-center justify-center text-cream/40 hover:text-cream/60 hover:bg-cream/5 transition-colors"
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
          {hasUnread ? (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-400 ring-2 ring-basalt" />
          ) : commentCount > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-sandstone text-basalt text-[10px] font-bold flex items-center justify-center">
              {commentCount}
            </span>
          ) : null}
          </button>
          <span className="hidden sm:block absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 rounded bg-basalt border border-cream/15 text-[10px] text-cream/60 whitespace-nowrap opacity-0 pointer-events-none group-hover/tip:opacity-100 transition-opacity z-20 shadow-lg">
            Comments
          </span>
        </span>

        {/* Unified "+ Add" dropdown — same on desktop and mobile */}
        {!readOnly && (
          <div className="relative shrink-0">
            <button
              type="button"
              data-testid="add-idea-btn"
              onClick={() => setShowAddMenu(!showAddMenu)}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors disabled:opacity-40"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span className="hidden sm:inline">{uploading ? 'Uploading...' : 'Add'}</span>
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
                    className="w-full text-left px-3 py-2.5 text-sm text-cream/70 hover:bg-cream/5 transition-colors disabled:opacity-40 flex items-center gap-2.5"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cream/40 shrink-0">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    Upload Photos
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddMenu(false)
                      cameraRef.current?.click()
                    }}
                    disabled={uploading}
                    className="w-full text-left px-3 py-2.5 text-sm text-cream/70 hover:bg-cream/5 transition-colors disabled:opacity-40 flex items-center gap-2.5 sm:hidden"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cream/40 shrink-0">
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    Take Photo
                  </button>
                  <button
                    type="button"
                    data-testid="text-note-btn"
                    onClick={() => {
                      setShowAddMenu(false)
                      setShowTextForm(true)
                    }}
                    className="w-full text-left px-3 py-2.5 text-sm text-cream/70 hover:bg-cream/5 transition-colors flex items-center gap-2.5"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cream/40 shrink-0">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Text Note
                  </button>
                  <div className="border-t border-cream/10 mt-1 pt-1">
                    <Link
                      href={`/app/save-from-web?from=mood-boards&boardId=${board.id}`}
                      data-testid="save-from-web-link"
                      className="w-full text-left px-3 py-2.5 text-sm text-cream/70 hover:bg-cream/5 transition-colors flex items-center gap-2.5"
                      onClick={() => setShowAddMenu(false)}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cream/40 shrink-0">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                      </svg>
                      Save from Web
                    </Link>
                  </div>
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

      {/* Search + filter controls */}
      {board.ideas.length > 0 && (
        <div className="mb-4 space-y-2">
          {/* Search input */}
          <div className="relative">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-cream/30">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ideas..."
              className="w-full pl-9 pr-3 py-2 bg-basalt border border-cream/15 text-cream text-sm rounded-lg placeholder:text-cream/25 focus:outline-none focus:border-sandstone/40"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-cream/30 hover:text-cream/50"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
          {/* Filter chips — scrollable on mobile */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            <button
              type="button"
              onClick={() => toggleFilter('loved')}
              className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                activeFilters.has('loved')
                  ? 'bg-sandstone/15 border-sandstone/40 text-sandstone'
                  : 'border-cream/15 text-cream/40 hover:border-cream/25'
              }`}
            >
              {'\u2764\uFE0F'} Loved
            </button>
            <button
              type="button"
              onClick={() => toggleFilter('liked')}
              className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                activeFilters.has('liked')
                  ? 'bg-sandstone/15 border-sandstone/40 text-sandstone'
                  : 'border-cream/15 text-cream/40 hover:border-cream/25'
              }`}
            >
              {'\uD83D\uDC4D'} Liked
            </button>
            <button
              type="button"
              onClick={() => toggleFilter('has-comments')}
              className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                activeFilters.has('has-comments')
                  ? 'bg-sandstone/15 border-sandstone/40 text-sandstone'
                  : 'border-cream/15 text-cream/40 hover:border-cream/25'
              }`}
            >
              {'\uD83D\uDCAC'} Has comments
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleFilter(`tag:${tag}`)}
                className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                  activeFilters.has(`tag:${tag}`)
                    ? 'bg-sandstone/15 border-sandstone/40 text-sandstone'
                    : 'border-cream/15 text-cream/40 hover:border-cream/25'
                }`}
              >
                {tag}
              </button>
            ))}
            {isFiltering && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setActiveFilters(new Set())
                }}
                className="shrink-0 text-[11px] px-2.5 py-1 text-cream/30 hover:text-cream/50 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
          {/* Filter results count */}
          {isFiltering && (
            <p className="text-[11px] text-cream/30">
              Showing {filteredIdeas.length} of {board.ideas.length} idea{board.ideas.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {/* Masonry grid */}
      {board.ideas.length > 0 ? (
        filteredIdeas.length > 0 ? (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 [column-fill:_balance]">
            {filteredIdeas.map((idea) => (
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
                  onQuickRename={readOnly ? undefined : handleQuickRename}
                  onQuickDelete={readOnly ? undefined : (ideaId) => handleDeleteWithUndo(ideaId)}
                  readOnly={readOnly}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-cream/40 text-sm">No ideas match your filters.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setActiveFilters(new Set())
              }}
              className="mt-2 text-sm text-sandstone/60 hover:text-sandstone transition-colors"
            >
              Clear filters
            </button>
          </div>
        )
      ) : (
        <div data-testid="board-empty-state" className="text-center py-16 bg-basalt-50 rounded-xl border border-cream/10">
          <p className="text-4xl mb-3 opacity-30">
            {isDefaultBoard(board) ? '\u2764' : '\uD83C\uDFA8'}
          </p>
          <h3 className="text-lg font-serif text-sandstone mb-2">
            No ideas yet
          </h3>
          <p className="text-cream/50 text-sm mb-6 max-w-sm mx-auto">
            Start collecting inspiration for this board.
          </p>
          {!readOnly && (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2.5 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors inline-flex items-center gap-2 disabled:opacity-40"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                Upload photos
              </button>
              <Link
                href={`/app/save-from-web?from=mood-boards&boardId=${board.id}`}
                className="px-4 py-2.5 border border-cream/20 text-cream/70 text-sm font-medium rounded-lg hover:border-cream/40 hover:text-cream transition-colors inline-flex items-center gap-2"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                </svg>
                Save from web
              </Link>
              <button
                type="button"
                onClick={() => setShowTextForm(true)}
                className="px-4 py-2.5 border border-cream/20 text-cream/70 text-sm font-medium rounded-lg hover:border-cream/40 hover:text-cream transition-colors inline-flex items-center gap-2"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Add a note
              </button>
            </div>
          )}
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
          onDeleteIdea={(ideaId) => handleDeleteWithUndo(ideaId)}
          onMoveIdea={(toBoardId, ideaId) => {
            api.moveIdea(board.id, toBoardId, ideaId)
            setSelectedIdeaId(null)
          }}
          onCopyIdea={(toBoardId, ideaId) => {
            api.copyIdea(board.id, toBoardId, ideaId)
          }}
          onToggleReaction={(ideaId, reaction) =>
            api.toggleReaction(board.id, ideaId, userEmail, userName, reaction)
          }
          onCommentOnIdea={handleCommentOnIdea}
          onAddComment={(comment) => api.addComment(board.id, comment)}
          boardComments={board.comments || []}
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

      {/* Export modal */}
      {showExport && (
        <ExportBoardModal
          boardId={board.id}
          boardName={board.name}
          onClose={() => setShowExport(false)}
        />
      )}

      {/* Board settings sheet (includes sharing) */}
      {showSettings && (
        <BoardSettingsSheet
          board={board}
          toolMembers={toolMembers}
          currentUserEmail={userEmail}
          projectId={currentProject?.id || ''}
          isOwner={isOwner}
          onUpdate={(visibility, accessList) =>
            api.updateBoardAccess(board.id, visibility, accessList)
          }
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Batch upload notification */}
      {uploadedCount > 1 && !undoToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-3 px-4 py-3 bg-basalt-50 border border-cream/15 rounded-lg shadow-2xl">
          <p className="text-sm text-cream/70">
            Added {uploadedCount} ideas
          </p>
          <button
            type="button"
            onClick={() => setUploadedCount(0)}
            className="text-cream/30 hover:text-cream/50 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Undo delete toast */}
      {undoToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-3 px-4 py-3 bg-basalt-50 border border-cream/15 rounded-lg shadow-2xl">
          <p className="text-sm text-cream/70">Idea deleted</p>
          <button
            type="button"
            onClick={handleUndo}
            className="text-sm font-medium text-sandstone hover:text-sandstone-light transition-colors"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={() => {
              if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
              setUndoToast(null)
            }}
            className="text-cream/30 hover:text-cream/50 transition-colors ml-1"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
