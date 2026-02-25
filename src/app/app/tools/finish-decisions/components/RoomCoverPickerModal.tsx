'use client'

import { useState, useEffect, useRef } from 'react'
import type { RoomV3, RoomCoverImage } from '@/data/finish-decisions'
import { getHeroImage, displayUrl } from '@/lib/finishDecisionsImages'
import { uploadIdeaFile } from './IdeasBoard'

interface IdeaImage {
  url: string
  label: string
  optionId: string
}

export function RoomCoverPickerModal({
  room,
  onSetCover,
  onRemoveCover,
  onClose,
}: {
  room: RoomV3
  onSetCover: (cover: RoomCoverImage) => void
  onRemoveCover: () => void
  onClose: () => void
}) {
  const [tab, setTab] = useState<'ideas' | 'upload'>('ideas')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Collect all idea images from room's decisions
  const ideaImages: IdeaImage[] = []
  for (const d of room.decisions) {
    for (const opt of d.options) {
      const hero = getHeroImage(opt)
      const src = hero?.thumbnailUrl || hero?.url || opt.thumbnailUrl || opt.imageUrl
      if (src) {
        ideaImages.push({
          url: src,
          label: opt.name || 'Untitled',
          optionId: opt.id,
        })
      }
    }
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    const file = files[0]
    if (file.size === 0) {
      setError('File is empty — please try again.')
      return
    }

    setUploading(true)
    setError('')
    try {
      const result = await uploadIdeaFile(file)
      onSetCover({ type: 'upload', url: result.url })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-basalt-50 border-t sm:border border-cream/10 rounded-t-xl sm:rounded-xl w-full sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-cream/10 px-5 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-medium text-cream">Set Room Cover</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-cream/40 hover:text-cream transition-colors shrink-0 ml-4"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-3 shrink-0">
          <button
            type="button"
            onClick={() => setTab('ideas')}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              tab === 'ideas'
                ? 'bg-sandstone/20 text-sandstone'
                : 'bg-cream/10 text-cream/50 hover:text-cream/70'
            }`}
          >
            From ideas ({ideaImages.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('upload')}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              tab === 'upload'
                ? 'bg-sandstone/20 text-sandstone'
                : 'bg-cream/10 text-cream/50 hover:text-cream/70'
            }`}
          >
            Upload photo
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 pt-3">
          {tab === 'ideas' && (
            <>
              {ideaImages.length === 0 ? (
                <p className="text-sm text-cream/40 text-center py-6">
                  No idea images in this room yet.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {ideaImages.map((img) => (
                    <button
                      key={img.optionId + img.url}
                      type="button"
                      onClick={() => onSetCover({ type: 'idea', url: img.url, ideaId: img.optionId })}
                      className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-sandstone transition-all"
                    >
                      <img
                        src={displayUrl(img.url)}
                        alt={img.label}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                      <div className="absolute bottom-0 inset-x-0 bg-black/60 px-1.5 py-0.5">
                        <p className="text-[10px] text-white truncate">{img.label}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'upload' && (
            <div className="flex flex-col items-center justify-center py-8">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleUpload(e.target.files)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-6 py-3 bg-cream/10 hover:bg-cream/15 text-cream/70 rounded-xl transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    Uploading...
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-sm">Choose a photo</span>
                  </div>
                )}
              </button>
              {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
            </div>
          )}
        </div>

        {/* Remove cover button */}
        {room.coverImage && (
          <div className="border-t border-cream/10 px-5 py-3 shrink-0">
            <button
              type="button"
              onClick={onRemoveCover}
              className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
            >
              Remove cover
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
