'use client'

import { useRef, useState } from 'react'
import type { OptionV3, DecisionV3, SelectionComment } from '@/data/finish-decisions'
import { IdeaCardModal } from './IdeaCardModal'
import { CompareModal } from './CompareModal'

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
  comments: SelectionComment[]
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
}: {
  option: OptionV3
  decision: DecisionV3
  userEmail: string
  readOnly?: boolean
  onClick: () => void
  onToggleFinal?: () => void
  onComment?: () => void
}) {
  const votes = option.votes ?? {}
  const upCount = Object.values(votes).filter((v) => v === 'up').length
  const downCount = Object.values(votes).filter((v) => v === 'down').length
  const isMyPick = decision.picksByUser?.[userEmail] === option.id
  const isImage = option.kind === 'image' && option.thumbnailUrl
  const linkPreview = !isImage && option.urls?.[0]?.linkImage

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-basalt border border-cream/10 hover:border-cream/30 transition-colors text-left group"
    >
      {isImage ? (
        <>
          <img
            src={option.thumbnailUrl}
            alt={option.name || 'Option'}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        </>
      ) : linkPreview ? (
        <>
          <img
            src={`/api/image-proxy?url=${encodeURIComponent(linkPreview)}`}
            alt={option.name || 'Option'}
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
        </div>
      )}

      {/* Name overlay for image/preview cards */}
      {(isImage || linkPreview) && (
        <div className="absolute bottom-0 left-0 right-0 px-2.5 py-2">
          <p className="text-xs text-white font-medium line-clamp-1">
            {option.name || <span className="text-white/50 italic">Untitled</span>}
          </p>
        </div>
      )}

      {/* Final toggle */}
      {onToggleFinal && !readOnly ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleFinal() }}
          className={`absolute top-2 left-2 px-1.5 py-0.5 text-[10px] font-semibold rounded-full transition-all ${
            option.isSelected
              ? 'bg-sandstone text-basalt'
              : 'bg-black/40 text-white/70 opacity-60 sm:opacity-0 group-hover:opacity-100'
          }`}
        >
          {option.isSelected ? '✓ Final' : 'Final'}
        </button>
      ) : option.isSelected ? (
        <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-sandstone text-basalt text-[10px] font-semibold rounded-full">
          Final
        </span>
      ) : null}

      {/* My pick indicator */}
      {isMyPick && (
        <span className="absolute top-2 right-2 text-sm" title="My pick">⭐</span>
      )}

      {/* Comment icon */}
      {onComment && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onComment() }}
          className="absolute top-2 right-8 p-1 text-white/50 hover:text-white/90 opacity-60 sm:opacity-0 group-hover:opacity-100 transition-all"
          title="Comment"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* Vote counts */}
      {(upCount > 0 || downCount > 0) && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 text-[10px] text-white/70">
          {upCount > 0 && <span>👍 {upCount}</span>}
          {downCount > 0 && <span>👎 {downCount}</span>}
        </div>
      )}
    </button>
  )
}

// ---- Hero tile for single option ----

function HeroTile({
  option,
  decision,
  userEmail,
  readOnly,
  onClick,
  onToggleFinal,
  onComment,
}: {
  option: OptionV3
  decision: DecisionV3
  userEmail: string
  readOnly?: boolean
  onClick: () => void
  onToggleFinal?: () => void
  onComment?: () => void
}) {
  const isImage = option.kind === 'image' && option.imageUrl
  const linkPreview = !isImage && option.urls?.[0]?.linkImage
  const hasBg = isImage || linkPreview

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-basalt border border-cream/10 hover:border-cream/30 transition-colors text-left group mb-3"
    >
      {isImage ? (
        <>
          <img
            src={option.imageUrl}
            alt={option.name || 'Option'}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        </>
      ) : linkPreview ? (
        <>
          <img
            src={`/api/image-proxy?url=${encodeURIComponent(linkPreview)}`}
            alt={option.name || 'Option'}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        </>
      ) : (
        <div className="w-full h-full p-4 flex flex-col justify-end">
          <p className="text-lg text-cream font-medium leading-snug line-clamp-2">
            {option.name || <span className="text-cream/30 italic">Untitled</span>}
          </p>
          {option.notes && (
            <p className="text-sm text-cream/40 line-clamp-2 mt-1">{option.notes}</p>
          )}
        </div>
      )}

      {hasBg && (
        <div className="absolute bottom-0 left-0 right-0 px-4 py-3">
          <p className="text-sm text-white font-medium line-clamp-1">
            {option.name || <span className="text-white/50 italic">Untitled</span>}
          </p>
        </div>
      )}

      {/* Final toggle */}
      {onToggleFinal && !readOnly ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleFinal() }}
          className={`absolute top-3 left-3 px-2 py-1 text-xs font-semibold rounded-full transition-all ${
            option.isSelected
              ? 'bg-sandstone text-basalt'
              : 'bg-black/40 text-white/70 opacity-60 sm:opacity-0 group-hover:opacity-100'
          }`}
        >
          {option.isSelected ? '✓ Final' : 'Mark Final'}
        </button>
      ) : option.isSelected ? (
        <span className="absolute top-3 left-3 px-2 py-1 bg-sandstone text-basalt text-xs font-semibold rounded-full">
          Final
        </span>
      ) : null}

      {/* Comment icon */}
      {onComment && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onComment() }}
          className="absolute top-3 right-3 p-1.5 text-white/50 hover:text-white/90 opacity-60 sm:opacity-0 group-hover:opacity-100 transition-all"
          title="Comment"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </button>
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
  comments,
}: Props) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [compareMode, setCompareMode] = useState(false)
  const [selectedForCompare, setSelectedForCompare] = useState<Set<string>>(new Set())
  const [showCompareModal, setShowCompareModal] = useState(false)

  const VISIBLE_COUNT = 3
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    const isFirstOption = decision.options.length === 0
    let firstUploadedId: string | null = null
    for (let i = 0; i < fileArr.length; i += 3) {
      const batch = fileArr.slice(i, i + 3)
      const results = await Promise.allSettled(batch.map(uploadIdeaFile))
      for (const r of results) {
        if (r.status === 'fulfilled') {
          const { url, thumbnailUrl, id } = r.value
          const autoFinal = isFirstOption && !firstUploadedId
          if (autoFinal) firstUploadedId = id
          onAddOption({
            id,
            kind: 'image',
            name: '',
            notes: '',
            urls: [],
            imageUrl: url,
            thumbnailUrl,
            isSelected: autoFinal || undefined,
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
    const id = crypto.randomUUID()
    const autoFinal = decision.options.length === 0
    onAddOption({
      id,
      kind: 'text',
      name: '',
      notes: '',
      urls: [],
      isSelected: autoFinal || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    setActiveCardId(id)
  }

  return (
    <div>
      {/* Hero tile for single option */}
      {decision.options.length === 1 && (
        <HeroTile
          option={decision.options[0]}
          decision={decision}
          userEmail={userEmail}
          readOnly={readOnly}
          onClick={() => setActiveCardId(decision.options[0].id)}
          onToggleFinal={() => onSelectOption(decision.options[0].id)}
          onComment={onCommentOnOption ? () => onCommentOnOption(decision.options[0].id, decision.options[0].name || 'Untitled') : undefined}
        />
      )}

      {/* Compare toggle (2+ options) */}
      {decision.options.length >= 2 && (
        <div className="flex items-center justify-end mb-2">
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
        </div>
      )}

      {/* Card grid (2+ options) */}
      {decision.options.length > 1 && (() => {
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
                    onToggleFinal={compareMode ? undefined : () => onSelectOption(opt.id)}
                    onComment={compareMode ? undefined : onCommentOnOption ? () => onCommentOnOption(opt.id, opt.name || 'Untitled') : undefined}
                  />
                  {/* Compare checkbox overlay */}
                  {compareMode && (
                    <div
                      className="absolute top-2 right-2 pointer-events-none"
                    >
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
                Show {hiddenCount} more option{hiddenCount !== 1 ? 's' : ''}
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
          <p className="text-cream/40 text-sm">
            No options yet.{' '}
            {!readOnly && 'Add a photo or note to start comparing.'}
          </p>
        </div>
      )}

      {/* Add controls */}
      {!readOnly && (
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cream/10 text-cream/60 hover:text-cream/80 hover:bg-cream/15 text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <div className="w-3.5 h-3.5 border border-cream/20 border-t-cream/60 rounded-full animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  Add Photo
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleAddTextCard}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cream/10 text-cream/60 hover:text-cream/80 hover:bg-cream/15 text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
              </svg>
              Add Note
            </button>
          </div>
        </div>
      )}

      {uploadError && (
        <p className="text-sm text-red-400 mt-2">{uploadError}</p>
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
          onSelect={() => onSelectOption(activeOption.id)}
          onUpdateDecision={onUpdateDecision}
          onAddComment={onAddComment}
          onUploadPhoto={uploadIdeaFile}
          onClose={() => setActiveCardId(null)}
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
    </div>
  )
}
