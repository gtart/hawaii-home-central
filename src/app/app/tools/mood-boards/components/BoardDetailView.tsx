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
import { CommentThread, type RefEntity } from '@/components/app/CommentThread'
import { useComments } from '@/hooks/useComments'
import { BoardSettingsSheet } from './BoardSettingsSheet'
import { ShareExportModal } from '@/components/app/ShareExportModal'

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
  collectionId?: string
}

export function BoardDetailView({ board, api, readOnly, toolAccess, collectionId }: Props) {
  const router = useRouter()
  const { data: session } = useSession()
  const { currentProject } = useProject()
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [boardName, setBoardName] = useState(board.name)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [draftRef, setDraftRef] = useState<{
    ideaId: string
    ideaLabel: string
  } | null>(null)
  // +Add tile / empty state mode: closed → menu → url/text
  const [addTileMode, setAddTileMode] = useState<'closed' | 'menu' | 'url' | 'text'>('closed')
  const [showShareExportForBoard, setShowShareExportForBoard] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [inlineCommentText, setInlineCommentText] = useState('')

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

  // DB-backed comments
  const boardComments = useComments({
    collectionId: collectionId || null,
    targetType: 'board',
    targetId: board.id,
  })
  const ideaRefEntities: RefEntity[] = useMemo(
    () => board.ideas.map((idea) => ({ id: idea.id, label: idea.name || 'Untitled' })),
    [board.ideas]
  )

  // Quick URL add state
  const [quickUrl, setQuickUrl] = useState('')
  const [quickUrlError, setQuickUrlError] = useState('')

  const galleryRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const selectedIdea = selectedIdeaId
    ? board.ideas.find((i) => i.id === selectedIdeaId) ?? null
    : null

  const commentCount = boardComments.comments.length
  const userEmail = session?.user?.email || ''
  const userName = session?.user?.name || ''

  // Lazy-load tool members for board settings
  const [toolMembers, setToolMembers] = useState<Array<{ email: string; name: string | null; image: string | null }>>([])
  const loadedMembersRef = useRef(false)

  const loadToolMembers = useCallback(async () => {
    if (loadedMembersRef.current || !currentProject?.id) return
    loadedMembersRef.current = true
    try {
      const res = await fetch(`/api/projects/${currentProject.id}/tools/mood_boards/share`)
      if (!res.ok) return
      const data = await res.json()
      const members = (data.access || [])
        .filter((a: { email?: string | null }) => a.email)
        .map((a: { email?: string | null; name?: string | null; image?: string | null }) => ({
          email: a.email as string,
          name: a.name ?? null,
          image: a.image ?? null,
        }))
      setToolMembers(members)
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

  // Comments are visible inline — mark as seen on page load
  useEffect(() => {
    const dbComments = boardComments.comments
    if (dbComments.length === 0) {
      setHasUnread(false)
      setLastActivity(null)
      return
    }
    const latest = dbComments.reduce(
      (max, c) => (c.createdAt > max ? c.createdAt : max),
      dbComments[0].createdAt
    )
    setLastActivity(latest)
    setHasUnread(false)
    try {
      localStorage.setItem(`hhc_mb_seen_${board.id}`, latest)
    } catch {}
  }, [boardComments.comments, board.id])

  // Cleanup undo timer on unmount
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    }
  }, [])

  // ESC to close +Add tile
  useEffect(() => {
    if (addTileMode === 'closed') return
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAddTileMode('closed')
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [addTileMode])

  // Board collaborators for membership display
  const boardCollaborators = useMemo(() => {
    if (board.visibility === 'invite-only') {
      const emails = new Set<string>()
      if (board.createdBy) emails.add(board.createdBy)
      for (const a of board.access || []) emails.add(a.email)
      return Array.from(emails).filter((e) => e !== userEmail)
    }
    return toolMembers.map((m) => m.email).filter((e) => e !== userEmail)
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
        boardComments.comments.some((c) => c.refEntityId === i.id)
      )
    }
    for (const f of activeFilters) {
      if (f.startsWith('tag:')) {
        ideas = ideas.filter((i) => i.tags.includes(f.slice(4)))
      }
    }
    return ideas
  }, [board.ideas, boardComments.comments, searchQuery, activeFilters])

  const isFiltering = searchQuery.trim() !== '' || activeFilters.size > 0

  const recentComments = useMemo(() => {
    return [...boardComments.comments]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 2)
  }, [boardComments.comments])

  const getIdeaThumbnail = useCallback((ideaId: string): string | null => {
    const idea = board.ideas.find((i) => i.id === ideaId)
    if (!idea || idea.images.length === 0) return null
    const heroImg = idea.heroImageId ? idea.images.find((img) => img.id === idea.heroImageId) : null
    const target = heroImg || idea.images[0]
    return target.thumbnailUrl || target.url
  }, [board.ideas])

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
    setAddTileMode('closed')
  }

  const handleQuickUrlAdd = () => {
    const trimmed = quickUrl.trim()
    if (!trimmed) return
    try {
      const parsed = new URL(trimmed)
      if (!parsed.protocol.startsWith('http')) throw new Error('invalid')
    } catch {
      setQuickUrlError('Please enter a valid image URL')
      return
    }
    setQuickUrlError('')
    const imageId = crypto.randomUUID()
    api.addIdea(board.id, {
      name: '',
      notes: '',
      images: [{ id: imageId, url: trimmed }],
      heroImageId: null,
      sourceUrl: trimmed,
      sourceTitle: null,
      tags: [],
    })
    setQuickUrl('')
    setAddTileMode('closed')
  }

  const handleCommentOnIdea = (ideaId: string, ideaName: string) => {
    setDraftRef({ ideaId, ideaLabel: ideaName })
    setCommentsOpen(true)
  }

  const handleInlineComment = () => {
    const trimmed = inlineCommentText.trim()
    if (!trimmed) return
    boardComments.addComment({ text: trimmed })
    setInlineCommentText('')
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
            {/* Share status chip — legacy only (hidden in collection mode where privacy is managed at collection level) */}
            {!isDefaultBoard(board) && !collectionId && (
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
          {isDefaultBoard(board) && !collectionId && (
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

        {/* Uploading indicator in header */}
        {uploading && !readOnly && (
          <span className="text-xs text-cream/40 shrink-0">Uploading...</span>
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

      {/* Text form and URL input moved into +Add tile and empty state below */}

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
                    boardComments.comments.filter(
                      (c) => c.refEntityId === idea.id
                    ).length
                  }
                  reactions={idea.reactions}
                  onQuickRename={readOnly ? undefined : handleQuickRename}
                  onQuickDelete={readOnly ? undefined : (ideaId) => handleDeleteWithUndo(ideaId)}
                  readOnly={readOnly}
                />
              </div>
            ))}

            {/* +Add tile — last item in masonry grid */}
            {!readOnly && (
              <div className="break-inside-avoid mb-3">
                <div className="rounded-xl border-2 border-dashed border-cream/15 hover:border-sandstone/40 overflow-hidden bg-basalt-50 transition-colors">
                  {addTileMode === 'closed' && (
                    <button
                      type="button"
                      onClick={() => setAddTileMode('menu')}
                      className="w-full aspect-[4/3] flex flex-col items-center justify-center gap-2 text-cream/30 hover:text-sandstone transition-colors"
                    >
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      <span className="text-sm font-medium">Add</span>
                    </button>
                  )}

                  {addTileMode === 'menu' && (
                    <div className="p-3 space-y-1">
                      <button
                        type="button"
                        onClick={() => { setAddTileMode('closed'); galleryRef.current?.click() }}
                        disabled={uploading}
                        className="w-full text-left px-3 py-2.5 text-sm text-cream/70 hover:bg-cream/5 rounded-lg transition-colors flex items-center gap-2.5 disabled:opacity-40"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cream/40 shrink-0">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                        Upload photo
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAddTileMode('closed'); cameraRef.current?.click() }}
                        disabled={uploading}
                        className="w-full text-left px-3 py-2.5 text-sm text-cream/70 hover:bg-cream/5 rounded-lg transition-colors flex items-center gap-2.5 disabled:opacity-40 sm:hidden"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cream/40 shrink-0">
                          <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                          <circle cx="12" cy="13" r="4" />
                        </svg>
                        Take photo
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddTileMode('url')}
                        className="w-full text-left px-3 py-2.5 text-sm text-cream/70 hover:bg-cream/5 rounded-lg transition-colors flex items-center gap-2.5"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cream/40 shrink-0">
                          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                        </svg>
                        From image URL
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddTileMode('text')}
                        className="w-full text-left px-3 py-2.5 text-sm text-cream/70 hover:bg-cream/5 rounded-lg transition-colors flex items-center gap-2.5"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cream/40 shrink-0">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Text note
                      </button>
                      {/* Desktop: functional link */}
                      <Link
                        href={`/app/save-from-web?from=mood-boards&boardId=${board.id}`}
                        onClick={() => setAddTileMode('closed')}
                        className="hidden sm:flex w-full text-left px-3 py-2.5 text-sm text-cream/70 hover:bg-cream/5 rounded-lg transition-colors items-center gap-2.5"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cream/40 shrink-0">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="2" y1="12" x2="22" y2="12" />
                          <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                        </svg>
                        Save from web
                      </Link>
                      {/* Mobile: desktop-only note */}
                      <div className="sm:hidden px-3 py-2.5">
                        <div className="flex items-center gap-2.5 text-sm text-cream/35">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cream/25 shrink-0">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="2" y1="12" x2="22" y2="12" />
                            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                          </svg>
                          Save from web
                        </div>
                        <p className="text-[11px] text-cream/25 mt-1 ml-[27px]">
                          Web import is available on desktop via the bookmarklet.{' '}
                          <a href="/app/save-from-web" className="text-sandstone/60 hover:text-sandstone underline">Learn how</a>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAddTileMode('closed')}
                        className="w-full text-center px-3 py-1.5 text-xs text-cream/30 hover:text-cream/50 transition-colors mt-1"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {addTileMode === 'url' && (
                    <div className="p-3 space-y-2">
                      <h4 className="text-xs font-medium text-cream/50">Add from image URL</h4>
                      <input
                        type="text"
                        autoFocus
                        value={quickUrl}
                        onChange={(e) => { setQuickUrl(e.target.value); setQuickUrlError('') }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleQuickUrlAdd()
                          if (e.key === 'Escape') { setAddTileMode('menu'); setQuickUrl(''); setQuickUrlError('') }
                        }}
                        placeholder="https://..."
                        className="w-full px-3 py-2 bg-basalt border border-cream/15 text-cream text-sm rounded-lg placeholder:text-cream/25 focus:outline-none focus:border-sandstone/40"
                      />
                      {quickUrlError && <p className="text-xs text-red-400">{quickUrlError}</p>}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleQuickUrlAdd}
                          disabled={!quickUrl.trim()}
                          className="px-3 py-1.5 bg-sandstone text-basalt text-xs font-medium rounded-lg hover:bg-sandstone-light transition-colors disabled:opacity-30"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAddTileMode('menu'); setQuickUrl(''); setQuickUrlError('') }}
                          className="px-3 py-1.5 text-xs text-cream/50 hover:text-cream transition-colors"
                        >
                          Back
                        </button>
                      </div>
                    </div>
                  )}

                  {addTileMode === 'text' && (
                    <div className="p-3 space-y-2">
                      <h4 className="text-xs font-medium text-cream/50">Add a text note</h4>
                      <input
                        type="text"
                        autoFocus
                        value={textIdeaName}
                        onChange={(e) => setTextIdeaName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && textIdeaName.trim()) handleAddTextIdea()
                          if (e.key === 'Escape') { setAddTileMode('menu'); setTextIdeaName(''); setTextIdeaNotes('') }
                        }}
                        placeholder="Idea name..."
                        className="w-full px-3 py-2 bg-basalt border border-cream/15 text-cream text-sm rounded-lg placeholder:text-cream/25 focus:outline-none focus:border-sandstone/40"
                      />
                      <textarea
                        value={textIdeaNotes}
                        onChange={(e) => setTextIdeaNotes(e.target.value)}
                        placeholder="Notes (optional)"
                        rows={2}
                        className="w-full px-3 py-2 bg-basalt border border-cream/15 text-cream text-sm rounded-lg placeholder:text-cream/25 focus:outline-none focus:border-sandstone/40 resize-none"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleAddTextIdea}
                          disabled={!textIdeaName.trim()}
                          className="px-3 py-1.5 bg-sandstone text-basalt text-xs font-medium rounded-lg hover:bg-sandstone-light transition-colors disabled:opacity-30"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAddTileMode('menu'); setTextIdeaName(''); setTextIdeaNotes('') }}
                          className="px-3 py-1.5 text-xs text-cream/50 hover:text-cream transition-colors"
                        >
                          Back
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
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
        /* Empty state */
        <div data-testid="board-empty-state" className="py-12 bg-basalt-50 rounded-xl border border-cream/10">
          <div className="text-center mb-6">
            <p className="text-4xl mb-3 opacity-30">
              {isDefaultBoard(board) ? '\u2764' : '\uD83C\uDFA8'}
            </p>
            <h3 className="text-lg font-serif text-sandstone mb-2">
              No ideas yet
            </h3>
            <p className="text-cream/50 text-sm max-w-sm mx-auto">
              Start collecting inspiration for this board.
            </p>
          </div>

          {!readOnly && addTileMode !== 'url' && addTileMode !== 'text' && (
            <div className="max-w-xs mx-auto space-y-1 px-4">
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                disabled={uploading}
                className="w-full text-left px-4 py-3 text-sm text-cream/70 hover:bg-cream/5 rounded-lg transition-colors flex items-center gap-3 disabled:opacity-40"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cream/40 shrink-0">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                Upload photo
              </button>
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                disabled={uploading}
                className="w-full text-left px-4 py-3 text-sm text-cream/70 hover:bg-cream/5 rounded-lg transition-colors flex items-center gap-3 disabled:opacity-40 sm:hidden"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cream/40 shrink-0">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                Take photo
              </button>
              <button
                type="button"
                onClick={() => setAddTileMode('url')}
                className="w-full text-left px-4 py-3 text-sm text-cream/70 hover:bg-cream/5 rounded-lg transition-colors flex items-center gap-3"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cream/40 shrink-0">
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                </svg>
                Add from image URL
              </button>
              <button
                type="button"
                onClick={() => setAddTileMode('text')}
                className="w-full text-left px-4 py-3 text-sm text-cream/70 hover:bg-cream/5 rounded-lg transition-colors flex items-center gap-3"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cream/40 shrink-0">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Add a text note
              </button>
              <Link
                href={`/app/save-from-web?from=mood-boards&boardId=${board.id}`}
                className="hidden sm:flex w-full text-left px-4 py-3 text-sm text-cream/70 hover:bg-cream/5 rounded-lg transition-colors items-center gap-3"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cream/40 shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                </svg>
                Save from web
              </Link>
            </div>
          )}

          {/* Inline URL input in empty state */}
          {!readOnly && addTileMode === 'url' && (
            <div className="max-w-sm mx-auto px-4 space-y-2">
              <h4 className="text-xs font-medium text-cream/50">Add from image URL</h4>
              <input
                type="text"
                autoFocus
                value={quickUrl}
                onChange={(e) => { setQuickUrl(e.target.value); setQuickUrlError('') }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleQuickUrlAdd()
                  if (e.key === 'Escape') { setAddTileMode('closed'); setQuickUrl(''); setQuickUrlError('') }
                }}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-basalt border border-cream/15 text-cream text-sm rounded-lg placeholder:text-cream/25 focus:outline-none focus:border-sandstone/40"
              />
              {quickUrlError && <p className="text-xs text-red-400">{quickUrlError}</p>}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleQuickUrlAdd}
                  disabled={!quickUrl.trim()}
                  className="px-4 py-1.5 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors disabled:opacity-30"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => { setAddTileMode('closed'); setQuickUrl(''); setQuickUrlError('') }}
                  className="px-4 py-1.5 text-sm text-cream/50 hover:text-cream transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {/* Inline text form in empty state */}
          {!readOnly && addTileMode === 'text' && (
            <div className="max-w-sm mx-auto px-4 space-y-2">
              <h4 className="text-xs font-medium text-cream/50">Add a text note</h4>
              <input
                type="text"
                autoFocus
                value={textIdeaName}
                onChange={(e) => setTextIdeaName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && textIdeaName.trim()) handleAddTextIdea()
                  if (e.key === 'Escape') { setAddTileMode('closed'); setTextIdeaName(''); setTextIdeaNotes('') }
                }}
                placeholder="Idea name..."
                className="w-full px-3 py-2 bg-basalt border border-cream/15 text-cream text-sm rounded-lg placeholder:text-cream/25 focus:outline-none focus:border-sandstone/40"
              />
              <textarea
                value={textIdeaNotes}
                onChange={(e) => setTextIdeaNotes(e.target.value)}
                placeholder="Notes (optional)"
                rows={2}
                className="w-full px-3 py-2 bg-basalt border border-cream/15 text-cream text-sm rounded-lg placeholder:text-cream/25 focus:outline-none focus:border-sandstone/40 resize-none"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddTextIdea}
                  disabled={!textIdeaName.trim()}
                  className="px-4 py-1.5 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors disabled:opacity-30"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => { setAddTileMode('closed'); setTextIdeaName(''); setTextIdeaNotes('') }}
                  className="px-4 py-1.5 text-sm text-cream/50 hover:text-cream transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inline comments section */}
      {(commentCount > 0 || !readOnly) && (
        <div className="mt-8 border-t border-cream/10 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-cream/60 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Comments
              {commentCount > 0 && (
                <span className="text-cream/30">({commentCount})</span>
              )}
            </h3>
            {commentCount > 2 && (
              <button
                type="button"
                onClick={() => setCommentsOpen(true)}
                className="text-xs text-sandstone/70 hover:text-sandstone transition-colors flex items-center gap-1"
              >
                View all {commentCount}
              </button>
            )}
          </div>

          {recentComments.length > 0 ? (
            <div className="space-y-3 mb-4">
              {recentComments.map((comment) => {
                const thumbUrl = comment.refEntityId ? getIdeaThumbnail(comment.refEntityId) : null
                return (
                  <div key={comment.id} className="flex gap-3">
                    <span className="w-7 h-7 rounded-full bg-sandstone/20 text-sandstone text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {comment.authorName.charAt(0).toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-cream/70">{comment.authorName}</span>
                        <span className="text-cream/20">&middot;</span>
                        <span className="text-[11px] text-cream/30">{relativeTime(comment.createdAt)}</span>
                      </div>
                      {comment.refEntityId && comment.refEntityLabel && (
                        <button
                          type="button"
                          onClick={() => setSelectedIdeaId(comment.refEntityId!)}
                          className="mt-1 flex items-center gap-2 px-2 py-1 rounded-md bg-sandstone/10 hover:bg-sandstone/20 transition-colors"
                        >
                          {thumbUrl && (
                            <img
                              src={thumbUrl}
                              alt=""
                              className="w-6 h-6 rounded object-cover shrink-0"
                              loading="lazy"
                            />
                          )}
                          <span className="text-[11px] text-sandstone/80 truncate">
                            Re: {comment.refEntityLabel.length > 40
                              ? comment.refEntityLabel.slice(0, 40).trimEnd() + '...'
                              : comment.refEntityLabel}
                          </span>
                        </button>
                      )}
                      <p className="text-sm text-cream/80 whitespace-pre-wrap mt-0.5">{comment.text}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-cream/30 mb-4">No comments yet. Start the conversation.</p>
          )}

          {!readOnly && (
            <div className="flex gap-3 items-start">
              <span className="w-7 h-7 rounded-full bg-sandstone/20 text-sandstone text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {(userName || userEmail || '?').charAt(0).toUpperCase()}
              </span>
              <div className="flex-1 flex gap-2">
                <textarea
                  value={inlineCommentText}
                  onChange={(e) => setInlineCommentText(e.target.value.slice(0, 400))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleInlineComment()
                    }
                  }}
                  placeholder="Add a comment..."
                  rows={1}
                  className="flex-1 px-3 py-2 bg-basalt border border-cream/15 text-cream text-sm rounded-lg placeholder:text-cream/25 focus:outline-none focus:border-sandstone/40 resize-none"
                />
                <button
                  type="button"
                  onClick={handleInlineComment}
                  disabled={!inlineCommentText.trim()}
                  className="px-3 py-2 bg-sandstone text-basalt text-xs font-medium rounded-lg hover:bg-sandstone-light transition-colors disabled:opacity-30 shrink-0 self-end"
                >
                  Post
                </button>
              </div>
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
          onAddComment={boardComments.addComment}
          boardComments={boardComments.comments}
          currentUserEmail={userEmail}
        />
      )}

      {/* Comments panel */}
      {commentsOpen && (
        <CommentThread
          title="Comments"
          comments={boardComments.comments}
          isLoading={boardComments.isLoading}
          readOnly={readOnly}
          onClose={() => {
            setCommentsOpen(false)
            setDraftRef(null)
          }}
          onAddComment={boardComments.addComment}
          onDeleteComment={boardComments.deleteComment}
          refEntities={ideaRefEntities}
          refEntityType="idea"
          refPickerLabel="Tag an idea"
          initialRef={draftRef ? { id: draftRef.ideaId, label: draftRef.ideaLabel } : null}
          onClearInitialRef={() => setDraftRef(null)}
          onNavigateToRef={(ideaId) => setSelectedIdeaId(ideaId)}
          pageSize={10}
          collectionId={collectionId}
        />
      )}

      {/* Board settings sheet */}
      {showSettings && (
        <BoardSettingsSheet
          board={board}
          toolMembers={toolMembers}
          currentUserEmail={userEmail}
          currentUserName={userName}
          projectId={currentProject?.id || ''}
          isOwner={isOwner}
          onUpdate={(visibility, accessList) =>
            api.updateBoardAccess(board.id, visibility, accessList)
          }
          onClose={() => setShowSettings(false)}
          onManagePublicLinks={() => setShowShareExportForBoard(true)}
          publicLinkCount={shareLinkCount}
          isCollectionMode={!!collectionId}
        />
      )}

      {/* Share & Export modal opened from board settings (pre-selects this board) */}
      {showShareExportForBoard && currentProject && (
        <ShareExportModal
          toolKey="mood_boards"
          toolLabel="Mood Boards"
          projectId={currentProject.id}
          isOwner={isOwner}
          onClose={() => setShowShareExportForBoard(false)}
          scopes={api.payload.boards
            .filter((b) => !isDefaultBoard(b))
            .map((b) => ({
              id: b.id,
              name: b.name,
            }))}
          scopeLabel="Boards"
          buildExportUrl={({ includeNotes, includeComments, includePhotos, scopeMode, selectedScopeIds }) => {
            const reportBase = collectionId
              ? `/app/tools/mood-boards/${collectionId}/report`
              : '/app/tools/mood-boards/report'
            let url = `${reportBase}?includeNotes=${includeNotes}&includeComments=${includeComments}&includePhotos=${includePhotos}`
            if (!collectionId && scopeMode === 'selected' && selectedScopeIds.length > 0) {
              url += `&boardIds=${encodeURIComponent(selectedScopeIds.join(','))}`
            }
            return url
          }}
          initialTab="share"
          initialSelectedScopeIds={[board.id]}
          collectionId={collectionId}
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
