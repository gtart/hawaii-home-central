'use client'

import { useState, useRef } from 'react'
import type { AlignmentItem } from '@/data/alignment'
import type { AlignmentStateAPI } from '../useAlignmentState'

interface Props {
  item: AlignmentItem
  api: AlignmentStateAPI
  collectionId?: string
}

export function EvidencePhotos({ item, api, collectionId }: Props) {
  const { readOnly } = api
  const [uploading, setUploading] = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0 || !collectionId) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('collectionId', collectionId)

        const res = await fetch('/api/tools/project-alignment/upload', {
          method: 'POST',
          body: formData,
        })
        if (!res.ok) continue
        const data = await res.json()
        api.addPhoto(item.id, {
          url: data.url,
          thumbnailUrl: data.thumbnailUrl,
        })
      }
    } catch {
      // ignore upload errors in Phase 1
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-cream/40">
          Evidence / Photos {item.photos.length > 0 && `(${item.photos.length})`}
        </h3>
        {!readOnly && collectionId && (
          <label className="text-[10px] text-sandstone/60 hover:text-sandstone transition-colors cursor-pointer">
            + Upload
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
          </label>
        )}
      </div>

      {uploading && (
        <div className="flex items-center gap-2 text-xs text-cream/30 mb-2">
          <div className="w-3 h-3 border border-cream/20 border-t-cream/50 rounded-full animate-spin" />
          Uploading...
        </div>
      )}

      {item.photos.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {item.photos.map((photo, idx) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setLightboxIdx(idx)}
              className="relative aspect-square rounded-lg overflow-hidden border border-cream/8 hover:border-cream/20 transition-colors group"
            >
              <img
                src={photo.thumbnailUrl || photo.url}
                alt={photo.caption || 'Evidence photo'}
                className="w-full h-full object-cover"
              />
              {!readOnly && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); api.removePhoto(item.id, photo.id) }}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-basalt/80 text-cream/50 hover:text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-cream/20">No evidence photos yet.</p>
      )}

      {/* Simple lightbox */}
      {lightboxIdx !== null && item.photos[lightboxIdx] && (
        <div
          className="fixed inset-0 z-50 bg-basalt/90 flex items-center justify-center p-4"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxIdx(null)}
            className="absolute top-4 right-4 text-cream/50 hover:text-cream transition-colors"
          >
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
          {lightboxIdx > 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1) }}
              className="absolute left-4 text-cream/50 hover:text-cream transition-colors"
            >
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          {lightboxIdx < item.photos.length - 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1) }}
              className="absolute right-4 text-cream/50 hover:text-cream transition-colors"
            >
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          <img
            src={item.photos[lightboxIdx].url}
            alt={item.photos[lightboxIdx].caption || 'Evidence photo'}
            className="max-w-full max-h-[80vh] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
