'use client'

import { useRef, useState } from 'react'
import type { OptionV3, DecisionV3, SelectionComment } from '@/data/finish-decisions'
import { IdeaCardModal } from './IdeaCardModal'

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
  comments: SelectionComment[]
}

// ---- Upload helper (mirrors punchlist utils, points to finish-decisions endpoint) ----

async function uploadIdeaFile(file: File): Promise<{ url: string; thumbnailUrl: string; id: string }> {
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
  onClick,
}: {
  option: OptionV3
  decision: DecisionV3
  userEmail: string
  onClick: () => void
}) {
  const votes = option.votes ?? {}
  const upCount = Object.values(votes).filter((v) => v === 'up').length
  const downCount = Object.values(votes).filter((v) => v === 'down').length
  const isMyPick = decision.picksByUser?.[userEmail] === option.id
  const isImage = option.kind === 'image' && option.thumbnailUrl

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
            alt={option.name || 'Idea'}
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay for text legibility */}
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

      {/* Name overlay for image cards */}
      {isImage && (
        <div className="absolute bottom-0 left-0 right-0 px-2.5 py-2">
          <p className="text-xs text-white font-medium line-clamp-1">
            {option.name || <span className="text-white/50 italic">Untitled</span>}
          </p>
        </div>
      )}

      {/* Final badge */}
      {option.isSelected && (
        <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-sandstone text-basalt text-[10px] font-semibold rounded-full">
          Final
        </span>
      )}

      {/* My pick indicator */}
      {isMyPick && (
        <span className="absolute top-2 right-2 text-sm" title="My pick">⭐</span>
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
  comments,
}: Props) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    for (let i = 0; i < fileArr.length; i += 3) {
      const batch = fileArr.slice(i, i + 3)
      const results = await Promise.allSettled(batch.map(uploadIdeaFile))
      for (const r of results) {
        if (r.status === 'fulfilled') {
          const { url, thumbnailUrl, id } = r.value
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
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleAddTextCard() {
    const id = crypto.randomUUID()
    onAddOption({
      id,
      kind: 'text',
      name: '',
      notes: '',
      urls: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    setActiveCardId(id)
  }

  return (
    <div>
      {/* Card grid */}
      {decision.options.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {decision.options.map((opt) => (
            <IdeaCardTile
              key={opt.id}
              option={opt}
              decision={decision}
              userEmail={userEmail}
              onClick={() => setActiveCardId(opt.id)}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {decision.options.length === 0 && (
        <div className="bg-basalt-50 rounded-card p-8 text-center mb-4">
          <p className="text-cream/40 text-sm">
            No ideas yet.{' '}
            {!readOnly && 'Add a photo or text idea to start comparing options.'}
          </p>
        </div>
      )}

      {/* Add controls */}
      {!readOnly && (
        <div className="flex items-center gap-2">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handlePhotoFiles(e.target.files)}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cream/10 text-cream/60 hover:text-cream/80 hover:bg-cream/15 text-sm rounded-lg transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <>
                <div className="w-3.5 h-3.5 border border-cream/20 border-t-cream/60 rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                + Photo
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleAddTextCard}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cream/10 text-cream/60 hover:text-cream/80 hover:bg-cream/15 text-sm rounded-lg transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            + Text Idea
          </button>
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
    </div>
  )
}
