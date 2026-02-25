'use client'

import { useRef, useState, useEffect } from 'react'
import type { OptionV3, OptionImageV3, DecisionV3, SelectionComment, LinkV3 } from '@/data/finish-decisions'
import { getAllImages, getHeroImage, displayUrl } from '@/lib/finishDecisionsImages'

interface CommentPayload {
  text: string
  authorName: string
  authorEmail: string
  refOptionId?: string
  refOptionLabel?: string
}

interface Props {
  option: OptionV3
  decision: DecisionV3
  readOnly: boolean
  userEmail: string
  userName: string
  ideaComments: SelectionComment[]
  onUpdate: (updates: Partial<OptionV3>) => void
  onDelete: () => void
  onSelect: () => void
  onUpdateDecision: (updates: Partial<DecisionV3>) => void
  onAddComment: (comment: CommentPayload) => void
  onUploadPhoto: (file: File) => Promise<{ url: string; thumbnailUrl: string; id: string }>
  onClose: () => void
  onCommentOnIdea?: () => void
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function linkHostname(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

async function fetchLinkPreview(url: string): Promise<{ linkTitle?: string; linkDescription?: string; linkImage?: string }> {
  try {
    const res = await fetch('/api/tools/finish-decisions/link-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
    if (!res.ok) return {}
    const data = await res.json()
    return {
      linkTitle: data.title || undefined,
      linkDescription: data.description || undefined,
      linkImage: data.image || undefined,
    }
  } catch {
    return {}
  }
}

export function IdeaCardModal({
  option,
  decision,
  readOnly,
  userEmail,
  userName,
  ideaComments,
  onUpdate,
  onDelete,
  onSelect,
  onUpdateDecision,
  onAddComment,
  onUploadPhoto,
  onClose,
  onCommentOnIdea,
}: Props) {
  const [newUrl, setNewUrl] = useState('')
  const [editingUrlId, setEditingUrlId] = useState<string | null>(null)
  const [editingUrlValue, setEditingUrlValue] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [photoUrlInput, setPhotoUrlInput] = useState('')
  const [showPhotoMenu, setShowPhotoMenu] = useState(false)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const photoMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showPhotoMenu) return
    function handleClickOutside(e: MouseEvent) {
      if (photoMenuRef.current && !photoMenuRef.current.contains(e.target as Node)) {
        setShowPhotoMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showPhotoMenu])

  // ---- Derived state ----
  const votes = option.votes ?? {}
  const myVote = votes[userEmail]
  const upCount = Object.values(votes).filter((v) => v === 'up').length
  const downCount = Object.values(votes).filter((v) => v === 'down').length

  // ---- Handlers ----
  function handleVote(dir: 'up' | 'down') {
    if (readOnly) return
    const current = votes[userEmail]
    const next = { ...votes }
    if (current === dir) {
      delete next[userEmail]
    } else {
      next[userEmail] = dir
    }
    onUpdate({ votes: next })
  }

  async function handleAddUrl() {
    const url = newUrl.trim()
    if (!url) return
    const newLink: LinkV3 = { id: crypto.randomUUID(), url }
    onUpdate({ urls: [...option.urls, newLink] })
    setNewUrl('')
    // Fetch metadata async and update the link in place
    const meta = await fetchLinkPreview(url)
    if (meta.linkTitle || meta.linkDescription || meta.linkImage) {
      onUpdate({
        urls: [...option.urls, { ...newLink, ...meta }],
      })
    }
  }

  function handleSaveEditUrl(urlId: string) {
    const updated = editingUrlValue.trim()
    if (!updated) return
    onUpdate({
      urls: option.urls.map((u) => u.id === urlId ? { ...u, url: updated } : u),
    })
    setEditingUrlId(null)
    setEditingUrlValue('')
    // Re-fetch metadata for the updated URL
    fetchLinkPreview(updated).then((meta) => {
      if (meta.linkTitle || meta.linkDescription || meta.linkImage) {
        onUpdate({
          urls: option.urls.map((u) => u.id === urlId ? { ...u, url: updated, ...meta } : u),
        })
      }
    })
  }

  function handleRemoveUrl(urlId: string) {
    onUpdate({ urls: option.urls.filter((u) => u.id !== urlId) })
  }

  function handleDelete() {
    if (confirm('Delete this idea?')) {
      onDelete()
      onClose()
    }
  }

  const MAX_IMAGES = 5

  async function handlePhotoFile(file: File | null) {
    if (!file) return
    if (file.size === 0) {
      setUploadError('Empty file — please try again.')
      return
    }
    const currentCount = getAllImages(option).filter((i) => i.id !== 'legacy').length
    if (currentCount >= MAX_IMAGES) {
      setUploadError(`Maximum ${MAX_IMAGES} images per idea.`)
      return
    }
    setUploadError('')
    setUploading(true)
    try {
      const { url, thumbnailUrl } = await onUploadPhoto(file)
      const newImg: OptionImageV3 = { id: crypto.randomUUID(), url, thumbnailUrl }
      const current = getAllImages(option).filter((i) => i.id !== 'legacy')
      const merged = [...current, newImg]
      onUpdate({
        kind: 'image',
        imageUrl: url,
        thumbnailUrl,
        images: merged,
        heroImageId: option.heroImageId || newImg.id,
      })
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (galleryInputRef.current) galleryInputRef.current.value = ''
      if (cameraInputRef.current) cameraInputRef.current.value = ''
    }
  }

  function handlePhotoUrl() {
    const url = photoUrlInput.trim()
    if (!url) return
    const current = getAllImages(option).filter((i) => i.id !== 'legacy')
    if (current.length >= MAX_IMAGES) {
      setUploadError(`Maximum ${MAX_IMAGES} images per idea.`)
      return
    }
    const newImg: OptionImageV3 = { id: crypto.randomUUID(), url, thumbnailUrl: url }
    const merged = [...current, newImg]
    onUpdate({
      kind: 'image',
      imageUrl: url,
      thumbnailUrl: url,
      images: merged,
      heroImageId: option.heroImageId || newImg.id,
    })
    setPhotoUrlInput('')
  }

  const isValidUrl = (url: string) => /^https?:\/\/.+/i.test(url)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Sheet / Modal */}
      <div className="relative bg-basalt-50 border-t sm:border border-cream/10 rounded-t-xl sm:rounded-xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">

        {/* ── Sticky header ── */}
        <div className="sticky top-0 bg-basalt-50 border-b border-cream/10 px-5 pt-3 pb-0 z-10">
          {/* Date line + close */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-[11px] text-cream/30">
              <span>Added {formatDate(option.createdAt)}</span>
              {option.updatedAt !== option.createdAt && (
                <>
                  <span className="text-cream/15">·</span>
                  <span>Updated {formatDate(option.updatedAt)}</span>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-cream/40 hover:text-cream transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Action row: Final + Votes */}
          <div className="flex flex-wrap items-center gap-2 pb-2.5 border-b border-cream/8">
            {!readOnly ? (
              <button
                type="button"
                onClick={onSelect}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  option.isSelected
                    ? 'bg-sandstone text-basalt'
                    : 'bg-cream/10 text-cream/60 hover:bg-cream/20'
                }`}
              >
                {option.isSelected ? '⭐ Final' : '☆ Mark as Final'}
              </button>
            ) : option.isSelected ? (
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-sandstone text-basalt">
                ⭐ Final
              </span>
            ) : null}

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleVote('up')}
                disabled={readOnly}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-colors ${
                  myVote === 'up'
                    ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40'
                    : 'bg-cream/10 text-cream/60 hover:bg-cream/20 disabled:opacity-50'
                }`}
              >
                👍 {upCount > 0 && <span>{upCount}</span>}
              </button>
              <button
                type="button"
                onClick={() => handleVote('down')}
                disabled={readOnly}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-colors ${
                  myVote === 'down'
                    ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/40'
                    : 'bg-cream/10 text-cream/60 hover:bg-cream/20 disabled:opacity-50'
                }`}
              >
                👎 {downCount > 0 && <span>{downCount}</span>}
              </button>
            </div>
          </div>

          {/* Title input — no label, clean edit */}
          <div className="py-3">
            <input
              type="text"
              value={option.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              readOnly={readOnly}
              placeholder="Idea name..."
              className="w-full bg-transparent text-cream text-lg font-medium placeholder:text-cream/30 focus:outline-none"
            />
          </div>
        </div>

        <div className="px-5 py-5 space-y-5">

          {/* ── Photo section ── */}
          <div>
            {/* Hidden file inputs */}
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handlePhotoFile(e.target.files?.[0] ?? null)}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handlePhotoFile(e.target.files?.[0] ?? null)}
            />

            {(() => {
              const images = getAllImages(option)
              const hero = getHeroImage(option)
              const hasImages = images.length > 0

              return hasImages ? (
                /* Has image(s) */
                <div>
                  {/* Hero image — clickable to add more photos */}
                  <div
                    className="relative rounded-xl overflow-hidden bg-basalt cursor-pointer"
                    onClick={() => !readOnly && !uploading && galleryInputRef.current?.click()}
                  >
                    <img
                      src={displayUrl(hero?.url || images[0].url)}
                      alt={option.name || 'Idea image'}
                      className="w-full max-h-64 object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                    {uploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      </div>
                    )}
                    {!readOnly && !uploading && (
                      <div className="absolute bottom-2 right-2" ref={photoMenuRef}>
                        <button
                          type="button"
                          onClick={() => setShowPhotoMenu(!showPhotoMenu)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/60 backdrop-blur-sm text-white text-xs rounded-lg hover:bg-black/80 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                            <circle cx="12" cy="13" r="4" />
                          </svg>
                          Change photo
                        </button>
                        {showPhotoMenu && (
                          <div className="absolute bottom-full right-0 mb-1.5 bg-basalt-50 border border-cream/15 rounded-xl shadow-xl overflow-hidden min-w-[200px]">
                            <button
                              type="button"
                              onClick={() => { cameraInputRef.current?.click(); setShowPhotoMenu(false) }}
                              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-cream/70 hover:text-cream hover:bg-cream/5 transition-colors"
                            >
                              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                                <circle cx="12" cy="13" r="4" />
                              </svg>
                              Take a photo
                            </button>
                            <div className="border-t border-cream/10" />
                            <button
                              type="button"
                              onClick={() => { galleryInputRef.current?.click(); setShowPhotoMenu(false) }}
                              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-cream/70 hover:text-cream hover:bg-cream/5 transition-colors"
                            >
                              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <path d="M21 15l-5-5L5 21" />
                              </svg>
                              Photo library
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Image gallery strip (2+ images) */}
                  {images.length > 1 && (
                    <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
                      {images.map((img) => {
                        const isHero = img.id === (option.heroImageId || images[0].id)
                        return (
                          <button
                            key={img.id}
                            type="button"
                            onClick={() => !readOnly && onUpdate({ heroImageId: img.id })}
                            className={`relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                              isHero ? 'border-sandstone' : 'border-transparent hover:border-cream/20'
                            }`}
                            title={isHero ? 'Primary image' : 'Set as primary'}
                          >
                            <img src={displayUrl(img.thumbnailUrl || img.url)} alt={img.label || ''} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                            {isHero && (
                              <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-sandstone rounded-full flex items-center justify-center">
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="text-basalt">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : !readOnly ? (
                /* No photo — single clickable area */
                <div>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full rounded-xl border border-dashed border-cream/15 bg-basalt/30 hover:border-cream/30 hover:bg-basalt/50 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <div className="flex flex-col items-center justify-center gap-2 py-10">
                      {uploading ? (
                        <div className="w-8 h-8 border-2 border-cream/20 border-t-cream/60 rounded-full animate-spin" />
                      ) : (
                        <svg className="w-8 h-8 text-cream/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                          <circle cx="12" cy="13" r="4" />
                        </svg>
                      )}
                      <span className="text-sm text-cream/30">
                        {uploading ? 'Uploading...' : 'Tap to add a photo'}
                      </span>
                    </div>
                  </button>
                  {/* Photo URL paste */}
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={photoUrlInput}
                      onChange={(e) => setPhotoUrlInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handlePhotoUrl() }}
                      placeholder="Or paste a photo URL..."
                      className="flex-1 bg-basalt border border-cream/15 rounded-lg px-3 py-2 text-sm text-cream placeholder:text-cream/25 focus:outline-none focus:border-sandstone/40"
                    />
                    <button
                      type="button"
                      onClick={handlePhotoUrl}
                      disabled={!photoUrlInput.trim() || !isValidUrl(photoUrlInput)}
                      className="px-3 py-2 bg-cream/10 text-cream/60 text-sm rounded-lg hover:bg-cream/20 transition-colors disabled:opacity-30"
                    >
                      Use
                    </button>
                  </div>
                </div>
              ) : null
            })()}

            {uploadError && <p className="text-sm text-red-400 mt-2">{uploadError}</p>}
          </div>

          {/* ── Notes ── */}
          {(!readOnly || option.notes) && (
            <div>
              <textarea
                value={option.notes}
                onChange={(e) => onUpdate({ notes: e.target.value })}
                readOnly={readOnly}
                rows={2}
                placeholder="Notes, specs, details..."
                className="w-full bg-basalt border border-cream/10 rounded-lg px-3 py-2 text-sm text-cream placeholder:text-cream/25 focus:outline-none focus:border-sandstone/50 resize-none"
              />
            </div>
          )}

          {/* ── Links ── */}
          <div>
            {/* Existing links */}
            {option.urls.length > 0 && (
              <div className="space-y-2 mb-2">
                {option.urls.map((u) => (
                  <div key={u.id}>
                    {editingUrlId === u.id ? (
                      /* Edit mode */
                      <div className="flex gap-2">
                        <input
                          autoFocus
                          type="text"
                          value={editingUrlValue}
                          onChange={(e) => setEditingUrlValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEditUrl(u.id)
                            if (e.key === 'Escape') { setEditingUrlId(null); setEditingUrlValue('') }
                          }}
                          className="flex-1 bg-basalt border border-sandstone/40 rounded-lg px-3 py-2 text-sm text-cream focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEditUrl(u.id)}
                          className="px-3 py-2 bg-sandstone/20 text-sandstone text-sm rounded-lg hover:bg-sandstone/30 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditingUrlId(null); setEditingUrlValue('') }}
                          className="px-2 py-2 text-cream/40 hover:text-cream/70 text-sm transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      /* Display mode */
                      <div className="bg-basalt rounded-xl overflow-hidden border border-cream/8">
                        {/* Preview image */}
                        {u.linkImage && (
                          <img
                            src={`/api/image-proxy?url=${encodeURIComponent(u.linkImage)}`}
                            alt=""
                            className="w-full h-28 object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                        )}
                        <div className="px-3 py-2.5 flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            {u.linkTitle ? (
                              <>
                                <p className="text-sm font-medium text-cream/80 leading-snug line-clamp-1">
                                  {u.linkTitle}
                                </p>
                                {u.linkDescription && (
                                  <p className="text-xs text-cream/40 line-clamp-1 mt-0.5">
                                    {u.linkDescription}
                                  </p>
                                )}
                                <p className="text-[11px] text-cream/30 mt-1">{linkHostname(u.url)}</p>
                              </>
                            ) : (
                              <p className="text-sm text-cream/60 font-mono truncate">{u.url}</p>
                            )}
                          </div>
                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0 mt-0.5">
                            <a
                              href={u.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 text-cream/40 hover:text-sandstone transition-colors"
                              title="Open link"
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" strokeLinecap="round" />
                                <path d="M15 3h6v6" strokeLinecap="round" />
                                <path d="M10 14L21 3" strokeLinecap="round" />
                              </svg>
                            </a>
                            {!readOnly && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => { setEditingUrlId(u.id); setEditingUrlValue(u.url) }}
                                  className="p-1.5 text-cream/40 hover:text-cream/70 transition-colors"
                                  title="Edit URL"
                                >
                                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" />
                                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveUrl(u.id)}
                                  className="p-1.5 text-cream/30 hover:text-red-400 transition-colors"
                                  title="Remove"
                                >
                                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                                  </svg>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add URL input */}
            {!readOnly && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddUrl() }}
                  placeholder="https://..."
                  className="flex-1 bg-basalt border border-cream/20 rounded-lg px-3 py-2 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50"
                />
                <button
                  type="button"
                  onClick={handleAddUrl}
                  disabled={!newUrl.trim() || !isValidUrl(newUrl)}
                  className="px-3 py-2 bg-cream/10 text-cream/60 text-sm rounded-lg hover:bg-cream/20 transition-colors disabled:opacity-30"
                >
                  Add
                </button>
              </div>
            )}
            {newUrl && !isValidUrl(newUrl) && (
              <p className="text-yellow-500 text-xs mt-1">URL should start with http:// or https://</p>
            )}
          </div>

          {/* ── Comments on this idea ── */}
          <div className="pt-2 border-t border-cream/10">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-cream/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-xs text-cream/40">
                {ideaComments.length > 0 ? `${ideaComments.length} comment${ideaComments.length !== 1 ? 's' : ''}` : 'Comments'}
              </span>
            </div>

            {ideaComments.length > 0 && (
              <div className="space-y-2 mb-3">
                {ideaComments.map((c) => (
                  <div key={c.id} className="bg-basalt rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-cream/70">{c.authorName}</span>
                      <span className="text-[10px] text-cream/30">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-cream/60">{c.text}</p>
                  </div>
                ))}
              </div>
            )}

            {!readOnly && onCommentOnIdea && (
              <button
                type="button"
                onClick={onCommentOnIdea}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-cream/5 hover:bg-cream/10 rounded-lg text-sm text-cream/40 hover:text-cream/60 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                Add a comment
              </button>
            )}
          </div>

          {/* ── Footer: Delete + Save ── */}
          {!readOnly && (
            <div className="pt-1 border-t border-cream/10 flex items-center justify-between">
              <button
                type="button"
                onClick={handleDelete}
                className="text-red-400/60 hover:text-red-400 text-sm transition-colors"
              >
                Delete idea
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors"
              >
                Save
              </button>
            </div>
          )}

          {readOnly && (
            <div className="pt-1 border-t border-cream/10 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-cream/10 text-cream/60 text-sm rounded-lg hover:bg-cream/20 transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
