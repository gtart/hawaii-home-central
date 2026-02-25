'use client'

import { useRef, useState, useEffect } from 'react'
import type { OptionV3, DecisionV3, SelectionComment, RoomV3 } from '@/data/finish-decisions'
import { getHeroImage, displayUrl } from '@/lib/finishDecisionsImages'
import { relativeTime } from '@/lib/relativeTime'
import { IdeaCardModal } from './IdeaCardModal'
import { CompareModal } from './CompareModal'
import { SaveFromWebDialog } from './SaveFromWebDialog'

interface CommentPayload {
  text: string
  authorName: string
  authorEmail: string
  refOptionId?: string
  refOptionLabel?: string
}

interface Props {
  decision: DecisionV3
  readOnly: boolean
  userEmail: string
  userName: string
  activeCardId: string | null
  setActiveCardId: (id: string | null) => void
  onAddOption: (opt: OptionV3) => void
  onUpdateOption: (id: string, updates: Partial<OptionV3>) => void
  onDeleteOption: (id: string) => void
  onSelectOption: (id: string) => void
  onUpdateDecision: (updates: Partial<DecisionV3>) => void
  onAddComment: (comment: CommentPayload) => void
  onCommentOnOption?: (optionId: string, optionLabel: string) => void
  onOpenGlobalComment?: () => void
  showContent?: boolean
  comments: SelectionComment[]
  hasKits?: boolean
  onOpenPack?: () => void
  hideFinalize?: boolean
  onAssignOption?: (optionId: string) => void
  onMoveOption?: (optionId: string) => void
  rooms?: RoomV3[]
  currentRoomId?: string
  currentDecisionId?: string
  onImportToDecision?: (targetRoomId: string, targetDecisionId: string | null, newTitle: string | undefined, result: { name: string; notes: string; sourceUrl: string; selectedImages: import('@/data/finish-decisions').OptionImageV3[] }) => void
}

// ---- Upload helper (mirrors punchlist utils, points to finish-decisions endpoint) ----

export async function uploadIdeaFile(file: File): Promise<{ url: string; thumbnailUrl: string; id: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30_000)

  let res: Response
  try {
    res = await fetch('/api/tools/finish-decisions/upload', {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    })
  } catch (err) {
    clearTimeout(timeout)
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Upload timed out. Check your connection and try again.')
    }
    throw err
  }
  clearTimeout(timeout)

  if (!res.ok) {
    let msg = `Upload failed (${res.status})`
    try {
      const data = await res.json()
      if (data.error) msg = data.error
    } catch { /* non-JSON */ }
    throw new Error(msg)
  }

  return res.json()
}

// ---- Card tile ----

function IdeaCardTile({
  option,
  decision,
  userEmail,
  readOnly,
  onClick,
  onToggleFinal,
  onComment,
  onVote,
  onAssign,
  onMove,
  myVote,
  commentCount,
  lastCommentAt,
}: {
  option: OptionV3
  decision: DecisionV3
  userEmail: string
  readOnly?: boolean
  onClick: () => void
  onToggleFinal?: () => void
  onComment?: () => void
  onVote?: (vote: 'up' | 'down') => void
  onAssign?: () => void
  onMove?: () => void
  myVote?: 'up' | 'down' | null
  commentCount?: number
  lastCommentAt?: string | null
}) {
  const votes = option.votes ?? {}
  const upCount = Object.values(votes).filter((v) => v === 'up').length
  const downCount = Object.values(votes).filter((v) => v === 'down').length
  const hero = getHeroImage(option)
  const heroSrc = hero?.thumbnailUrl || hero?.url
  const linkPreview = !heroSrc && option.urls?.[0]?.linkImage

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open idea: ${option.name || 'Untitled'}`}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
      className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-basalt border border-cream/10 hover:border-cream/30 transition-colors text-left group cursor-pointer focus:outline-none focus:ring-2 focus:ring-sandstone/50"
    >
      {heroSrc ? (
        <>
          <img
            src={displayUrl(heroSrc)}
            alt={option.name || 'Selection'}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        </>
      ) : linkPreview ? (
        <>
          <img
            src={displayUrl(linkPreview)}
            alt={option.name || 'Selection'}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        </>
      ) : (
        <div className="w-full h-full p-3 flex flex-col">
          <p className="text-sm text-cream font-medium leading-snug line-clamp-2 flex-1">
            {option.name || <span className="text-cream/30 italic">Untitled</span>}
          </p>
          {option.notes && (
            <p className="text-xs text-cream/40 line-clamp-2 mt-1">{option.notes}</p>
          )}
          {/* Meta: comment count + time */}
          <p className="text-[10px] text-cream/25 mt-auto pt-1">
            {option.origin && <span className="text-cream/30">{option.origin.kitLabel} · </span>}
            {commentCount && commentCount > 0
              ? `💬 ${commentCount} · ${relativeTime(lastCommentAt || option.updatedAt)}`
              : `Updated ${relativeTime(option.updatedAt)}`}
          </p>
        </div>
      )}

      {/* Name overlay for image/preview cards */}
      {(heroSrc || linkPreview) && (
        <div className="absolute bottom-0 left-0 right-0 px-2.5 py-2">
          <p className="text-xs text-white font-medium line-clamp-1">
            {option.name || <span className="text-white/50 italic">Untitled</span>}
          </p>
          <p className="text-[10px] text-white/40 mt-0.5">
            {option.origin && <span className="text-white/35">{option.origin.kitLabel} · </span>}
            {commentCount && commentCount > 0
              ? `💬 ${commentCount} · ${relativeTime(lastCommentAt || option.updatedAt)}`
              : relativeTime(option.updatedAt)}
          </p>
        </div>
      )}

      {/* Final toggle */}
      {onToggleFinal && !readOnly ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleFinal() }}
          className={`absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-full transition-all ${
            option.isSelected
              ? 'bg-sandstone text-basalt'
              : 'bg-black/40 text-white/70 opacity-60 sm:opacity-0 group-hover:opacity-100'
          }`}
        >
          {option.isSelected ? '⭐ Final' : '☆ Final'}
        </button>
      ) : option.isSelected ? (
        <span className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 bg-sandstone text-basalt text-[10px] font-semibold rounded-full">
          ⭐ Final
        </span>
      ) : null}

      {/* Assign button (for Uncategorized — same room) */}
      {onAssign && !readOnly && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onAssign() }}
          className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-amber-500/80 text-basalt text-[10px] font-semibold rounded-full opacity-80 sm:opacity-0 group-hover:opacity-100 transition-all hover:bg-amber-500"
        >
          Assign
        </button>
      )}

      {/* Move button (cross-room move) */}
      {onMove && !readOnly && !onAssign && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onMove() }}
          className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-cream/60 text-basalt text-[10px] font-semibold rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-cream/80"
        >
          Move
        </button>
      )}

      {/* Comment icon + count */}
      {onComment && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onComment() }}
          className={`absolute top-2 right-2 flex items-center gap-0.5 p-1 rounded-full transition-all ${
            commentCount && commentCount > 0
              ? 'bg-black/40 text-white/70'
              : 'text-white/50 hover:text-white/90 opacity-60 sm:opacity-0 group-hover:opacity-100'
          }`}
          title="Comment"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {commentCount && commentCount > 0 && (
            <span className="text-[10px]">{commentCount}</span>
          )}
        </button>
      )}

      {/* Vote buttons (interactive) or passive counts */}
      {onVote && !readOnly ? (
        <div className="absolute bottom-2 right-2 flex items-center gap-1 opacity-60 sm:opacity-0 group-hover:opacity-100 transition-all">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onVote('up') }}
            className={`text-[11px] px-1.5 py-0.5 rounded-full transition-colors ${
              myVote === 'up' ? 'bg-green-500/30 text-green-300' : 'bg-black/40 text-white/60 hover:text-white'
            }`}
          >
            👍{upCount > 0 ? ` ${upCount}` : ''}
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onVote('down') }}
            className={`text-[11px] px-1.5 py-0.5 rounded-full transition-colors ${
              myVote === 'down' ? 'bg-red-500/30 text-red-300' : 'bg-black/40 text-white/60 hover:text-white'
            }`}
          >
            👎{downCount > 0 ? ` ${downCount}` : ''}
          </button>
        </div>
      ) : (upCount > 0 || downCount > 0) ? (
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 text-[10px] text-white/70">
          {upCount > 0 && <span>👍 {upCount}</span>}
          {downCount > 0 && <span>👎 {downCount}</span>}
        </div>
      ) : null}
    </div>
  )
}

// ---- Add Idea Menu ----

function AddIdeaMenu({
  onPhoto,
  onNote,
  onWeb,
  onPack,
  uploading,
}: {
  onPhoto: () => void
  onNote: () => void
  onWeb: () => void
  onPack?: () => void
  uploading?: boolean
}) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={uploading}
        className={`flex items-center justify-center w-9 h-9 rounded-full transition-all ${
          open
            ? 'bg-sandstone text-basalt rotate-45'
            : 'bg-cream/10 text-cream/60 hover:bg-cream/20 hover:text-cream/80'
        } disabled:opacity-50`}
        title="Add idea"
      >
        {uploading ? (
          <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 bg-basalt-50 border border-cream/15 rounded-xl shadow-xl overflow-hidden min-w-[180px] z-50">
          <button
            type="button"
            onClick={() => { onPhoto(); setOpen(false) }}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-cream/70 hover:text-cream hover:bg-cream/5 transition-colors"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            Photo
          </button>
          <div className="border-t border-cream/8" />
          <button
            type="button"
            onClick={() => { onNote(); setOpen(false) }}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-cream/70 hover:text-cream hover:bg-cream/5 transition-colors"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
            </svg>
            Note
          </button>
          <div className="border-t border-cream/8" />
          <button
            type="button"
            onClick={() => { onWeb(); setOpen(false) }}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-cream/70 hover:text-cream hover:bg-cream/5 transition-colors"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20" strokeLinecap="round" />
              <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
            </svg>
            Save from web
          </button>
          {onPack && (
            <>
              <div className="border-t border-cream/8" />
              <button
                type="button"
                onClick={() => { onPack(); setOpen(false) }}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-cream/70 hover:text-cream hover:bg-cream/5 transition-colors"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                </svg>
                From pack
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ---- Main board ----

export function IdeasBoard({
  decision,
  readOnly,
  userEmail,
  userName,
  activeCardId,
  setActiveCardId,
  onAddOption,
  onUpdateOption,
  onDeleteOption,
  onSelectOption,
  onUpdateDecision,
  onAddComment,
  onCommentOnOption,
  onOpenGlobalComment,
  showContent,
  comments,
  hasKits,
  onOpenPack,
  hideFinalize,
  onAssignOption,
  onMoveOption,
  rooms,
  currentRoomId,
  currentDecisionId,
  onImportToDecision,
}: Props) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [compareMode, setCompareMode] = useState(false)
  const [selectedForCompare, setSelectedForCompare] = useState<Set<string>>(new Set())
  const [showCompareModal, setShowCompareModal] = useState(false)
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [showWebDialog, setShowWebDialog] = useState(false)

  const VISIBLE_COUNT = 3
  const fileInputRef = useRef<HTMLInputElement>(null)
  const noteInputRef = useRef<HTMLInputElement>(null)

  function toggleCompareSelect(id: string) {
    setSelectedForCompare((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < 3) {
        next.add(id)
      }
      return next
    })
  }

  const activeOption = decision.options.find((o) => o.id === activeCardId) ?? null
  const activeIdeaComments = activeCardId
    ? comments.filter((c) => c.refOptionId === activeCardId)
    : []

  async function handlePhotoFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploadError('')

    // Reject 0-byte files
    const fileArr = Array.from(files)
    if (fileArr.some((f) => f.size === 0)) {
      setUploadError('One or more files were empty — please try again.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setUploading(true)
    let firstUploadedId: string | null = null
    for (let i = 0; i < fileArr.length; i += 3) {
      const batch = fileArr.slice(i, i + 3)
      const results = await Promise.allSettled(batch.map(uploadIdeaFile))
      for (const r of results) {
        if (r.status === 'fulfilled') {
          const { url, thumbnailUrl, id } = r.value
          if (!firstUploadedId) firstUploadedId = id
          onAddOption({
            id,
            kind: 'image',
            name: '',
            notes: '',
            urls: [],
            imageUrl: url,
            thumbnailUrl,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        } else {
          const msg = r.reason instanceof Error ? r.reason.message : 'Upload failed'
          setUploadError(msg)
        }
      }
    }
    if (firstUploadedId) setActiveCardId(firstUploadedId)
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleAddTextCard() {
    setShowNoteInput(true)
    setTimeout(() => noteInputRef.current?.focus(), 50)
  }

  function handleNoteSubmit(title: string) {
    if (!title.trim()) {
      setShowNoteInput(false)
      return
    }
    const id = crypto.randomUUID()
    onAddOption({
      id,
      kind: 'text',
      name: title.trim(),
      notes: '',
      urls: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    setShowNoteInput(false)
  }

  function handleVote(optionId: string, vote: 'up' | 'down') {
    const option = decision.options.find((o) => o.id === optionId)
    if (!option) return
    const currentVotes = { ...(option.votes || {}) }
    if (currentVotes[userEmail] === vote) {
      delete currentVotes[userEmail]
    } else {
      currentVotes[userEmail] = vote
    }
    onUpdateOption(optionId, { votes: currentVotes })
  }

  function handleWebImport(result: { name: string; notes: string; sourceUrl: string; selectedImages: import('@/data/finish-decisions').OptionImageV3[] }) {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const firstImage = result.selectedImages[0]
    onAddOption({
      id,
      kind: firstImage ? 'image' : 'text',
      name: result.name,
      notes: result.notes,
      urls: result.sourceUrl ? [{ id: crypto.randomUUID(), url: result.sourceUrl, linkImage: firstImage?.url }] : [],
      images: result.selectedImages,
      heroImageId: firstImage?.id,
      imageUrl: firstImage?.url,
      thumbnailUrl: firstImage?.url,
      createdAt: now,
      updatedAt: now,
    })
    setShowWebDialog(false)
    setActiveCardId(id)
  }

  return (
    <div>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handlePhotoFiles(e.target.files)}
        className="hidden"
      />

      {showContent !== false && (
        <>
          {/* Action row: Compare + Add */}
          <div className="flex items-center justify-between mb-2">
            <div>
              {decision.options.length >= 2 && (
                <button
                  type="button"
                  onClick={() => {
                    setCompareMode(!compareMode)
                    setSelectedForCompare(new Set())
                  }}
                  className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                    compareMode
                      ? 'bg-sandstone/20 text-sandstone'
                      : 'bg-cream/10 text-cream/50 hover:text-cream/70'
                  }`}
                >
                  {compareMode ? 'Cancel' : 'Compare'}
                </button>
              )}
            </div>
            {!readOnly && (
              <div className="hidden md:block">
                <AddIdeaMenu
                  onPhoto={() => fileInputRef.current?.click()}
                  onNote={handleAddTextCard}
                  onWeb={() => setShowWebDialog(true)}
                  onPack={hasKits ? onOpenPack : undefined}
                  uploading={uploading}
                />
              </div>
            )}
          </div>

          {/* Inline note title input */}
          {showNoteInput && (
            <div className="mb-3">
              <input
                ref={noteInputRef}
                type="text"
                placeholder="Idea title..."
                className="w-full bg-basalt-50 border border-cream/20 rounded-lg px-3 py-2 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNoteSubmit((e.target as HTMLInputElement).value)
                  if (e.key === 'Escape') setShowNoteInput(false)
                }}
                onBlur={(e) => handleNoteSubmit(e.target.value)}
              />
            </div>
          )}

          {/* Card grid (1+ ideas) */}
          {decision.options.length >= 1 && (() => {
            const visible = expanded ? decision.options : decision.options.slice(0, VISIBLE_COUNT)
            const hiddenCount = decision.options.length - VISIBLE_COUNT
            return (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                  {visible.map((opt) => (
                    <div key={opt.id} className="relative">
                      <IdeaCardTile
                        option={opt}
                        decision={decision}
                        userEmail={userEmail}
                        readOnly={readOnly}
                        onClick={() => compareMode ? toggleCompareSelect(opt.id) : setActiveCardId(opt.id)}
                        onToggleFinal={compareMode || hideFinalize ? undefined : () => onSelectOption(opt.id)}
                        onAssign={!compareMode && onAssignOption ? () => onAssignOption(opt.id) : undefined}
                        onMove={!compareMode && onMoveOption ? () => onMoveOption(opt.id) : undefined}
                        onComment={compareMode ? undefined : onCommentOnOption ? () => onCommentOnOption(opt.id, opt.name || 'Untitled') : undefined}
                        onVote={compareMode ? undefined : (vote) => handleVote(opt.id, vote)}
                        myVote={(opt.votes || {})[userEmail] || null}
                        commentCount={comments.filter((c) => c.refOptionId === opt.id).length}
                        lastCommentAt={(() => {
                          const optComments = comments.filter((c) => c.refOptionId === opt.id)
                          if (optComments.length === 0) return null
                          return optComments.reduce((latest, c) => c.createdAt > latest ? c.createdAt : latest, '')
                        })()}
                      />
                      {/* Compare checkbox overlay */}
                      {compareMode && (
                        <div className="absolute top-2 right-2 pointer-events-none">
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                            selectedForCompare.has(opt.id)
                              ? 'bg-sandstone border-sandstone'
                              : 'border-white/50 bg-black/30'
                          }`}>
                            {selectedForCompare.has(opt.id) && (
                              <svg className="w-3 h-3 text-basalt" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {!expanded && hiddenCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setExpanded(true)}
                    className="w-full py-2 text-sm text-cream/50 hover:text-cream/80 transition-colors"
                  >
                    Show {hiddenCount} more idea{hiddenCount !== 1 ? 's' : ''}
                  </button>
                )}
                {expanded && decision.options.length > VISIBLE_COUNT && (
                  <button
                    type="button"
                    onClick={() => setExpanded(false)}
                    className="w-full py-2 text-sm text-cream/50 hover:text-cream/80 transition-colors"
                  >
                    Show less
                  </button>
                )}
              </>
            )
          })()}

          {/* Floating compare button */}
          {compareMode && selectedForCompare.size >= 2 && (
            <div className="flex justify-center my-3">
              <button
                type="button"
                onClick={() => setShowCompareModal(true)}
                className="px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors shadow-lg"
              >
                Compare ({selectedForCompare.size})
              </button>
            </div>
          )}

          {/* Empty state */}
          {decision.options.length === 0 && (
            <div className="bg-basalt-50 rounded-card p-8 text-center mb-4">
              <p className="text-cream/60 text-sm font-medium mb-1">Start collecting options</p>
              <p className="text-cream/35 text-xs mb-4">
                Save links, photos, and notes here. Vote and discuss with collaborators.
              </p>
              {!readOnly && (
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cream/10 text-cream/60 hover:bg-cream/15 hover:text-cream/80 rounded-full text-xs transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg>
                    Add photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowWebDialog(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cream/10 text-cream/60 hover:bg-cream/15 hover:text-cream/80 rounded-full text-xs transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M2 12h20" strokeLinecap="round" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>
                    Save from web
                  </button>
                  <button
                    type="button"
                    onClick={handleAddTextCard}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cream/10 text-cream/60 hover:bg-cream/15 hover:text-cream/80 rounded-full text-xs transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" /></svg>
                    Add note
                  </button>
                </div>
              )}
            </div>
          )}

          {uploadError && (
            <p className="text-sm text-red-400 mt-2">{uploadError}</p>
          )}
        </>
      )}

      {/* Card modal */}
      {activeOption && (
        <IdeaCardModal
          option={activeOption}
          decision={decision}
          readOnly={readOnly}
          userEmail={userEmail}
          userName={userName}
          ideaComments={activeIdeaComments}
          onUpdate={(updates) => onUpdateOption(activeOption.id, updates)}
          onDelete={() => onDeleteOption(activeOption.id)}
          onSelect={hideFinalize ? undefined : () => onSelectOption(activeOption.id)}
          onAssign={onAssignOption ? () => onAssignOption(activeOption.id) : undefined}
          onMove={onMoveOption ? () => onMoveOption(activeOption.id) : undefined}
          onUpdateDecision={onUpdateDecision}
          onAddComment={onAddComment}
          onUploadPhoto={uploadIdeaFile}
          onClose={() => {
            // Auto-delete empty ideas (e.g. new text card closed without filling in)
            const opt = activeOption
            if (opt && !opt.name && !opt.notes && !opt.imageUrl && (!opt.images || opt.images.length === 0) && (!opt.urls || opt.urls.length === 0)) {
              onDeleteOption(opt.id)
            }
            setActiveCardId(null)
          }}
          onCommentOnIdea={onCommentOnOption ? () => {
            const opt = activeOption
            setActiveCardId(null)
            onCommentOnOption(opt.id, opt.name || 'Untitled')
          } : undefined}
        />
      )}

      {/* Save from web dialog */}
      {showWebDialog && (
        <SaveFromWebDialog
          onImport={handleWebImport}
          onClose={() => setShowWebDialog(false)}
          rooms={rooms}
          currentRoomId={currentRoomId}
          currentDecisionId={currentDecisionId}
          onImportToDecision={onImportToDecision}
        />
      )}

      {/* Compare modal */}
      {showCompareModal && (
        <CompareModal
          options={decision.options.filter((o) => selectedForCompare.has(o.id))}
          decision={decision}
          readOnly={readOnly}
          onSelectOption={(id) => {
            onSelectOption(id)
            setShowCompareModal(false)
            setCompareMode(false)
            setSelectedForCompare(new Set())
          }}
          onClose={() => setShowCompareModal(false)}
        />
      )}

      {/* Mobile floating add button */}
      {!readOnly && (
        <div className="fixed bottom-6 right-4 z-40 md:hidden pb-[env(safe-area-inset-bottom)]">
          <AddIdeaMenu
            onPhoto={() => fileInputRef.current?.click()}
            onNote={handleAddTextCard}
            onWeb={() => setShowWebDialog(true)}
            onPack={hasKits ? onOpenPack : undefined}
            uploading={uploading}
          />
        </div>
      )}
    </div>
  )
}
