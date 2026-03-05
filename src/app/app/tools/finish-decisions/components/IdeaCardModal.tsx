'use client'

import { useRef, useState, useEffect } from 'react'
import type { OptionV3, OptionImageV3, OptionDocumentV3, DecisionV3, SelectionComment, LinkV3 } from '@/data/finish-decisions'
import { getAllImages, getHeroImage, displayUrl } from '@/lib/finishDecisionsImages'
import { relativeTime } from '@/lib/relativeTime'
import { ImageWithFallback } from '@/components/ui/ImageWithFallback'

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
  onSelect?: () => void
  onMove?: () => void
  onCopy?: () => void
  onUpdateDecision: (updates: Partial<DecisionV3>) => void
  onAddComment: (comment: CommentPayload) => void
  onUploadPhoto: (file: File) => Promise<{ url: string; thumbnailUrl: string; id: string }>
  onUploadDocument: (file: File) => Promise<{ url: string; id: string; fileName: string; fileSize: number; mimeType: string }>
  onClose: () => void
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
  onMove,
  onCopy,
  onUpdateDecision,
  onAddComment,
  onUploadPhoto,
  onUploadDocument,
  onClose,
}: Props) {
  const [inlineCommentText, setInlineCommentText] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [editingUrlId, setEditingUrlId] = useState<string | null>(null)
  const [editingUrlValue, setEditingUrlValue] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [photoUrlInput, setPhotoUrlInput] = useState('')
  const [showPhotoMenu, setShowPhotoMenu] = useState(false)
  const [docUploading, setDocUploading] = useState(false)
  const [docUploadError, setDocUploadError] = useState('')
  const [editingDocId, setEditingDocId] = useState<string | null>(null)
  const [editingDocTitle, setEditingDocTitle] = useState('')
  const docInputRef = useRef<HTMLInputElement>(null)
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

  // ---- Handlers ----

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
    if (confirm('Delete this option?')) {
      onDelete()
      onClose()
    }
  }

  function handleInlineComment() {
    if (!inlineCommentText.trim()) return
    onAddComment({
      text: inlineCommentText.trim().slice(0, 400),
      authorName: userName,
      authorEmail: userEmail,
      refOptionId: option.id,
      refOptionLabel: option.name || 'Untitled',
    })
    setInlineCommentText('')
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
      setUploadError(`Maximum ${MAX_IMAGES} images per option.`)
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
      setUploadError(`Maximum ${MAX_IMAGES} images per option.`)
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

  const MAX_DOCUMENTS = 10

  function isImageMime(file: File): boolean {
    if (file.type?.startsWith('image/')) return true
    const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0]
    return !!ext && ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'].includes(ext)
  }

  async function handleDocumentFile(file: File | null) {
    if (!file) return
    if (file.size === 0) {
      setDocUploadError('Empty file — please try again.')
      return
    }
    const currentDocs = option.documents ?? []
    if (currentDocs.length >= MAX_DOCUMENTS) {
      setDocUploadError(`Maximum ${MAX_DOCUMENTS} files per option.`)
      return
    }
    setDocUploadError('')
    setDocUploading(true)
    try {
      if (isImageMime(file)) {
        const result = await onUploadPhoto(file)
        const newDoc: OptionDocumentV3 = {
          id: result.id,
          url: result.url,
          thumbnailUrl: result.thumbnailUrl,
          title: file.name.replace(/\.[^.]+$/, ''),
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || 'image/jpeg',
          uploadedAt: new Date().toISOString(),
          uploadedByName: userName,
          uploadedByEmail: userEmail,
        }
        onUpdate({ documents: [...currentDocs, newDoc] })
      } else {
        const result = await onUploadDocument(file)
        const newDoc: OptionDocumentV3 = {
          id: result.id,
          url: result.url,
          title: result.fileName.replace(/\.[^.]+$/, ''),
          fileName: result.fileName,
          fileSize: result.fileSize,
          mimeType: result.mimeType,
          uploadedAt: new Date().toISOString(),
          uploadedByName: userName,
          uploadedByEmail: userEmail,
        }
        onUpdate({ documents: [...currentDocs, newDoc] })
      }
    } catch (err) {
      setDocUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setDocUploading(false)
      if (docInputRef.current) docInputRef.current.value = ''
    }
  }

  function handleRemoveDocument(docId: string) {
    onUpdate({ documents: (option.documents ?? []).filter((d) => d.id !== docId) })
  }

  function handleSaveDocTitle(docId: string) {
    const title = editingDocTitle.trim()
    if (!title) return
    onUpdate({
      documents: (option.documents ?? []).map((d) =>
        d.id === docId ? { ...d, title } : d
      ),
    })
    setEditingDocId(null)
    setEditingDocTitle('')
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  function docTypeColor(mimeType: string | undefined): string {
    if (!mimeType) return 'text-cream/40'
    if (mimeType.startsWith('image/')) return 'text-purple-400'
    if (mimeType === 'application/pdf') return 'text-red-400'
    if (mimeType.includes('word') || mimeType === 'application/msword') return 'text-blue-400'
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'text-green-400'
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'text-orange-400'
    return 'text-cream/40'
  }

  function docTypeLabel(mimeType: string | undefined): string {
    if (!mimeType) return 'FILE'
    if (mimeType.startsWith('image/')) return 'IMG'
    if (mimeType === 'application/pdf') return 'PDF'
    if (mimeType.includes('word') || mimeType === 'application/msword') return 'DOC'
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'XLS'
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'PPT'
    if (mimeType === 'text/plain') return 'TXT'
    if (mimeType === 'text/csv') return 'CSV'
    return 'FILE'
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

          {/* Origin badge — shows which Decision Pack this came from */}
          {option.origin && (
            <div className="flex items-center gap-1.5 pb-2">
              <svg className="w-3.5 h-3.5 text-cream/30 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="7" y1="7" x2="7.01" y2="7" strokeLinecap="round" />
              </svg>
              <span className="text-[11px] text-cream/40">Part of {option.origin.kitLabel}</span>
            </div>
          )}

          {/* Action row: Assign / Final + Votes */}
          <div className="flex flex-wrap items-center gap-2 pb-2.5 border-b border-cream/8">
            {onMove && !readOnly && (
              <button
                type="button"
                onClick={onMove}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-cream/10 text-cream/60 hover:bg-cream/20 transition-colors"
              >
                Move
              </button>
            )}
            {onCopy && !readOnly && (
              <button
                type="button"
                onClick={onCopy}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-cream/10 text-cream/60 hover:bg-cream/20 transition-colors"
              >
                Copy to...
              </button>
            )}
            {onSelect && !readOnly ? (
              <button
                type="button"
                onClick={onSelect}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  option.isSelected
                    ? 'bg-sandstone text-basalt'
                    : 'bg-cream/10 text-cream/60 hover:bg-cream/20'
                }`}
              >
                {option.isSelected ? 'Final Decision' : 'Mark as Final Decision'}
              </button>
            ) : option.isSelected ? (
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-sandstone text-basalt">
                Final Decision
              </span>
            ) : null}

            {/* Voting */}
            {!readOnly ? (
              <div className="flex items-center gap-1 ml-auto">
                {(['love', 'up', 'down'] as const).map((type) => {
                  const emoji = type === 'love' ? '❤️' : type === 'up' ? '👍' : '👎'
                  const votes = option.votes ?? {}
                  const myVote = votes[userEmail]
                  const isActive = myVote === type
                  const count = Object.values(votes).filter(v => v === type).length
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        const next = { ...(option.votes ?? {}) }
                        if (next[userEmail] === type) delete next[userEmail]
                        else next[userEmail] = type
                        onUpdate({ votes: next })
                      }}
                      className={`text-xs px-2 py-1 rounded-full transition-colors ${
                        isActive
                          ? 'bg-sandstone/20 text-sandstone'
                          : 'bg-cream/8 text-cream/40 hover:bg-cream/15'
                      }`}
                    >
                      {emoji}{count > 0 ? ` ${count}` : ''}
                    </button>
                  )
                })}
              </div>
            ) : (() => {
              const votes = option.votes ?? {}
              const hasVotes = Object.keys(votes).length > 0
              if (!hasVotes) return null
              return (
                <div className="flex items-center gap-1 ml-auto">
                  {(['love', 'up', 'down'] as const).map((type) => {
                    const emoji = type === 'love' ? '❤️' : type === 'up' ? '👍' : '👎'
                    const count = Object.values(votes).filter(v => v === type).length
                    if (count === 0) return null
                    return (
                      <span key={type} className="text-xs px-2 py-1 rounded-full bg-cream/5 text-cream/30">
                        {emoji} {count}
                      </span>
                    )
                  })}
                </div>
              )
            })()}
          </div>

          {/* Title input — no label, clean edit */}
          <div className="py-3">
            <input
              type="text"
              value={option.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              readOnly={readOnly}
              placeholder="Option name..."
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
                    <ImageWithFallback
                      src={displayUrl(hero?.url || images[0].url)}
                      alt={option.name || 'Option image'}
                      className="w-full max-h-64 object-contain"
                      fallback={
                        <div className="w-full h-32 flex items-center justify-center bg-basalt">
                          <span className="text-3xl opacity-20">🖼️</span>
                        </div>
                      }
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
                            <ImageWithFallback src={displayUrl(img.thumbnailUrl || img.url)} alt={img.label || ''} className="w-full h-full object-cover" fallback={<div className="w-full h-full flex items-center justify-center bg-cream/5"><span className="text-xs opacity-30">🖼️</span></div>} />
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

          {/* ── Price ── */}
          {(!readOnly || option.price) && (
            <div>
              <label className="text-[11px] text-cream/30 uppercase tracking-wider mb-1 block">Price</label>
              <input
                value={option.price || ''}
                onChange={(e) => onUpdate({ price: e.target.value })}
                readOnly={readOnly}
                placeholder="e.g. $1,200"
                className="w-full bg-basalt border border-cream/10 rounded-lg px-3 py-2 text-sm text-cream placeholder:text-cream/25 focus:outline-none focus:border-sandstone/50"
              />
            </div>
          )}

          {/* ── Specs ── */}
          {(!readOnly || option.notes) && (
            <div>
              <label className="text-[11px] text-cream/30 uppercase tracking-wider mb-1 block">Specs</label>
              <textarea
                value={option.notes}
                onChange={(e) => onUpdate({ notes: e.target.value })}
                readOnly={readOnly}
                rows={2}
                placeholder="Specs, dimensions, details..."
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
                          <ImageWithFallback
                            src={`/api/image-proxy?url=${encodeURIComponent(u.linkImage)}`}
                            alt=""
                            className="w-full h-28 object-cover"
                            fallback={<div className="w-full h-28 bg-cream/5" />}
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

          {/* ── Files ── */}
          {(!readOnly || (option.documents && option.documents.length > 0)) && (
            <div>
              {/* Hidden file input */}
              <input
                ref={docInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf,.jpg,.jpeg,.png,.webp,.heic,.heif"
                className="hidden"
                onChange={(e) => handleDocumentFile(e.target.files?.[0] ?? null)}
              />

              <label className="text-[11px] text-cream/30 uppercase tracking-wider mb-2 block">Files</label>

              {(option.documents ?? []).length > 0 && (
                <div className="space-y-2 mb-2">
                  {(option.documents ?? []).map((doc) => (
                    <div key={doc.id} className="bg-basalt rounded-xl border border-cream/8 px-3 py-2.5">
                      {editingDocId === doc.id ? (
                        <div className="flex gap-2">
                          <input
                            autoFocus
                            type="text"
                            value={editingDocTitle}
                            onChange={(e) => setEditingDocTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveDocTitle(doc.id)
                              if (e.key === 'Escape') { setEditingDocId(null); setEditingDocTitle('') }
                            }}
                            className="flex-1 bg-basalt border border-sandstone/40 rounded-lg px-3 py-1.5 text-sm text-cream focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveDocTitle(doc.id)}
                            className="px-3 py-1.5 bg-sandstone/20 text-sandstone text-sm rounded-lg hover:bg-sandstone/30 transition-colors"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2.5">
                          {/* File type badge */}
                          <span className={`text-[10px] font-bold uppercase mt-0.5 shrink-0 ${docTypeColor(doc.mimeType)}`}>
                            {docTypeLabel(doc.mimeType)}
                          </span>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-cream/80 leading-snug truncate">{doc.title}</p>
                            <p className="text-[11px] text-cream/30 mt-0.5">
                              {formatFileSize(doc.fileSize)} · {doc.uploadedByName} · {formatDate(doc.uploadedAt)}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            <a
                              href={doc.url}
                              download={doc.fileName}
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 text-cream/40 hover:text-sandstone transition-colors"
                              title="Download"
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round" />
                                <polyline points="7 10 12 15 17 10" strokeLinecap="round" strokeLinejoin="round" />
                                <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round" />
                              </svg>
                            </a>
                            {!readOnly && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => { setEditingDocId(doc.id); setEditingDocTitle(doc.title) }}
                                  className="p-1.5 text-cream/40 hover:text-cream/70 transition-colors"
                                  title="Rename"
                                >
                                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" />
                                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDocument(doc.id)}
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
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!readOnly && (
                <button
                  type="button"
                  onClick={() => docInputRef.current?.click()}
                  disabled={docUploading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-cream/5 hover:bg-cream/10 rounded-lg text-sm text-cream/40 hover:text-cream/60 transition-colors disabled:opacity-50"
                >
                  {docUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-cream/20 border-t-cream/60 rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                      </svg>
                      Upload file
                    </>
                  )}
                </button>
              )}

              {docUploadError && <p className="text-sm text-red-400 mt-2">{docUploadError}</p>}
            </div>
          )}

          {/* ── Comments on this option ── */}
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
              <div className="space-y-3 mb-3">
                {ideaComments.map((c) => (
                  <div key={c.id} className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-sandstone/20 text-sandstone text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {c.authorName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="text-xs font-medium text-cream/70">{c.authorName}</span>
                        <span className="text-[10px] text-cream/25">{relativeTime(c.createdAt)}</span>
                      </div>
                      <p className="text-sm text-cream/60 whitespace-pre-wrap">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!readOnly && (
              <>
                <div className="flex gap-2">
                  <textarea
                    rows={1}
                    value={inlineCommentText}
                    onChange={(e) => setInlineCommentText(e.target.value.slice(0, 400))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleInlineComment()
                      }
                    }}
                    placeholder="Add a comment..."
                    maxLength={400}
                    className="flex-1 bg-basalt border border-cream/15 rounded-lg px-3 py-2 text-sm text-cream placeholder:text-cream/25 focus:outline-none focus:border-sandstone/40 resize-none"
                  />
                  <button
                    type="button"
                    onClick={handleInlineComment}
                    disabled={!inlineCommentText.trim()}
                    className="px-3 py-2 bg-sandstone/20 text-sandstone text-sm rounded-lg hover:bg-sandstone/30 transition-colors disabled:opacity-30 self-end"
                  >
                    Post
                  </button>
                </div>
                {inlineCommentText.length > 0 && (
                  <p className={`text-[10px] mt-1 text-right ${inlineCommentText.length >= 400 ? 'text-red-400' : 'text-cream/25'}`}>
                    {inlineCommentText.length}/400
                  </p>
                )}
              </>
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
                Delete option
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors"
              >
                Done
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
