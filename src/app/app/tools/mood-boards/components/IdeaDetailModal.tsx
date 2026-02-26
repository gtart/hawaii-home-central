'use client'

import { useState, useEffect, useRef } from 'react'
import { ImageWithFallback } from '@/components/ui/ImageWithFallback'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { Idea, Board, ReactionType } from '@/data/mood-boards'
import { REACTION_CONFIG } from '@/data/mood-boards'
import { MoveToBoardSheet } from './MoveToBoardSheet'
import { ConvertToSelectionSheet } from './ConvertToSelectionSheet'

interface Props {
  idea: Idea
  board: Board
  boards: Board[]
  readOnly: boolean
  onClose: () => void
  onUpdateIdea: (ideaId: string, updates: Partial<Idea>) => void
  onDeleteIdea: (ideaId: string) => void
  onMoveIdea: (toBoardId: string, ideaId: string) => void
  onToggleReaction: (ideaId: string, reaction: ReactionType) => void
  onCommentOnIdea: (ideaId: string, ideaName: string) => void
  currentUserEmail: string
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

export function IdeaDetailModal({
  idea,
  board,
  boards,
  readOnly,
  onClose,
  onUpdateIdea,
  onDeleteIdea,
  onMoveIdea,
  onToggleReaction,
  onCommentOnIdea,
  currentUserEmail,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const [name, setName] = useState(idea.name)
  const [notes, setNotes] = useState(idea.notes)
  const [tagsInput, setTagsInput] = useState(idea.tags.join(', '))
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showMoveSheet, setShowMoveSheet] = useState(false)
  const [showConvertSheet, setShowConvertSheet] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  // Focus trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (!focusable || focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const saveName = () => {
    const trimmed = name.trim()
    if (trimmed && trimmed !== idea.name) {
      onUpdateIdea(idea.id, { name: trimmed })
    }
  }

  const saveNotes = () => {
    if (notes !== idea.notes) {
      onUpdateIdea(idea.id, { notes })
    }
  }

  const saveTags = () => {
    const newTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    const oldTags = idea.tags.join(',')
    const newTagsStr = newTags.join(',')
    if (oldTags !== newTagsStr) {
      onUpdateIdea(idea.id, { tags: newTags })
    }
  }

  const images = idea.images
  const hasImages = images.length > 0
  const currentImage = hasImages ? images[currentImageIndex] : null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        ref={dialogRef}
        className="relative bg-basalt-50 border border-cream/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="idea-detail-title"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Image carousel */}
        {hasImages && currentImage && (
          <div className="relative bg-basalt">
            <ImageWithFallback
              src={`/api/image-proxy?url=${encodeURIComponent(currentImage.url)}`}
              alt={idea.name}
              className="w-full max-h-[400px] object-contain"
              fallback={
                <div className="w-full aspect-video flex items-center justify-center">
                  <span className="text-3xl opacity-20">{'\uD83D\uDDBC\uFE0F'}</span>
                </div>
              }
            />

            {/* Navigation arrows */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentImageIndex((i) =>
                      i === 0 ? images.length - 1 : i - 1
                    )
                  }
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentImageIndex((i) =>
                      i === images.length - 1 ? 0 : i + 1
                    )
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>

                {/* Dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrentImageIndex(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === currentImageIndex
                          ? 'bg-white'
                          : 'bg-white/40 hover:bg-white/60'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Name */}
          {readOnly ? (
            <h2
              id="idea-detail-title"
              className="font-serif text-xl text-sandstone"
            >
              {idea.name}
            </h2>
          ) : (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              }}
              className="w-full font-serif text-xl bg-transparent text-sandstone border-b border-transparent hover:border-cream/20 focus:border-sandstone focus:outline-none pb-0.5 transition-colors"
              id="idea-detail-title"
            />
          )}

          {/* Source link */}
          {idea.sourceUrl && (
            <a
              href={idea.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-sandstone/70 hover:text-sandstone transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="15 3 21 3 21 9" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="10" y1="14" x2="21" y2="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {extractDomain(idea.sourceUrl)}
            </a>
          )}

          {/* Reactions */}
          <div className="flex items-center gap-2">
            {(['love', 'like', 'dislike'] as ReactionType[]).map((type) => {
              const config = REACTION_CONFIG[type]
              const reactions = idea.reactions || []
              const count = reactions.filter((r) => r.reaction === type).length
              const isActive = reactions.some(
                (r) => r.userId === currentUserEmail && r.reaction === type
              )
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onToggleReaction(idea.id, type)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    isActive
                      ? 'bg-sandstone/15 border-sandstone/40 text-sandstone'
                      : 'bg-basalt border-cream/15 text-cream/50 hover:border-cream/30'
                  }`}
                >
                  <span>{config.emoji}</span>
                  <span className="text-xs">{config.label}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] ${
                        isActive ? 'text-sandstone/70' : 'text-cream/30'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-cream/50 mb-1">Notes</label>
            {readOnly ? (
              <p className="text-sm text-cream/70 whitespace-pre-wrap">
                {idea.notes || 'No notes'}
              </p>
            ) : (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={saveNotes}
                placeholder="Price, specs, or other details..."
                rows={3}
                className="w-full px-3 py-2 bg-basalt border border-cream/20 text-cream text-sm rounded-lg placeholder:text-cream/30 focus:outline-none focus:border-sandstone resize-none"
              />
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs text-cream/50 mb-1">Tags</label>
            {readOnly ? (
              <div className="flex flex-wrap gap-1.5">
                {idea.tags.length > 0
                  ? idea.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-xs text-cream/60 bg-cream/5 rounded"
                      >
                        {tag}
                      </span>
                    ))
                  : <span className="text-sm text-cream/40">No tags</span>}
              </div>
            ) : (
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                onBlur={saveTags}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                }}
                placeholder="kitchen, modern, marble (comma-separated)"
                className="w-full px-3 py-2 bg-basalt border border-cream/20 text-cream text-sm rounded-lg placeholder:text-cream/30 focus:outline-none focus:border-sandstone"
              />
            )}
          </div>

          {/* Actions */}
          {!readOnly && (
            <div className="flex items-center gap-3 pt-2 border-t border-cream/10 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  onCommentOnIdea(idea.id, idea.name)
                  onClose()
                }}
                className="px-3 py-1.5 text-sm text-cream/60 hover:text-cream border border-cream/20 rounded-lg transition-colors"
              >
                Comment...
              </button>
              <button
                type="button"
                onClick={() => setShowMoveSheet(true)}
                className="px-3 py-1.5 text-sm text-cream/60 hover:text-cream border border-cream/20 rounded-lg transition-colors"
              >
                Move to Board...
              </button>
              <button
                type="button"
                onClick={() => setShowConvertSheet(true)}
                className="px-3 py-1.5 text-sm text-sandstone hover:text-sandstone-light border border-sandstone/30 rounded-lg transition-colors"
              >
                Move to Selection Boards
              </button>

              {/* More menu */}
              <div className="relative ml-auto">
                <button
                  type="button"
                  onClick={() => setShowMenu(!showMenu)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-cream/40 hover:text-cream/60 hover:bg-cream/5 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="12" cy="19" r="2" />
                  </svg>
                </button>
                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 bottom-full mb-1 z-20 w-36 bg-basalt-50 border border-cream/15 rounded-lg shadow-xl py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false)
                          setShowDeleteConfirm(true)
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-cream/5 transition-colors"
                      >
                        Delete Idea
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Move to Board sheet */}
        {showMoveSheet && (
          <MoveToBoardSheet
            boards={boards}
            currentBoardId={board.id}
            onMove={(toBoardId) => onMoveIdea(toBoardId, idea.id)}
            onClose={() => setShowMoveSheet(false)}
          />
        )}

        {/* Convert to Selection sheet */}
        {showConvertSheet && (
          <ConvertToSelectionSheet
            idea={idea}
            onClose={() => setShowConvertSheet(false)}
          />
        )}

        {/* Delete confirm */}
        {showDeleteConfirm && (
          <ConfirmDialog
            title="Delete this idea?"
            message={`"${idea.name}" will be permanently removed from this board.`}
            confirmLabel="Delete"
            confirmVariant="danger"
            onConfirm={() => onDeleteIdea(idea.id)}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        )}
      </div>
    </div>
  )
}
