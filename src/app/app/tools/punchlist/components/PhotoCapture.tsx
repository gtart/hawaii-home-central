'use client'

import { useState, useRef } from 'react'
import type { PunchlistPhoto } from '../types'

interface Props {
  photos: PunchlistPhoto[]
  onAdd: (photo: PunchlistPhoto) => void
  onRemove: (photoId: string) => void
}

export function PhotoCapture({ photos, onAdd, onRemove }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setError('')
    setUploading(true)

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/tools/punchlist/upload', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          let msg = `Upload failed (${res.status})`
          try {
            const data = await res.json()
            if (data.error) msg = data.error
          } catch { /* non-JSON response */ }
          setError(msg)
          continue
        }

        const { url, thumbnailUrl, id } = await res.json()
        onAdd({ id, url, thumbnailUrl, uploadedAt: new Date().toISOString() })
      } catch (err) {
        console.error('Photo upload error:', err)
        setError('Upload failed. Check your connection and try again.')
      }
    }

    setUploading(false)
    if (cameraRef.current) cameraRef.current.value = ''
    if (galleryRef.current) galleryRef.current.value = ''
  }

  return (
    <div>
      <span className="block text-sm text-cream/70 mb-2">
        Photos
      </span>

      {/* Photo preview grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden group">
              <img
                src={photo.thumbnailUrl || photo.url}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <button
                type="button"
                onClick={() => onRemove(photo.id)}
                className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Full-size transparent inputs — user taps the actual <input> element */}
      <div className="flex gap-2">
        {/* Camera — capture="environment" opens camera directly */}
        <div
          className={`relative flex-1 flex items-center justify-center gap-2 py-3 border border-dashed border-cream/20 rounded-lg text-cream/50 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleFiles(e.target.files)}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 10 }}
          />
          <svg className="w-5 h-5 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <span className="text-sm pointer-events-none">Camera</span>
        </div>

        {/* Photo Library — no capture, opens gallery/files */}
        <div
          className={`relative flex-1 flex items-center justify-center gap-2 py-3 border border-dashed border-cream/20 rounded-lg text-cream/50 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFiles(e.target.files)}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 10 }}
          />
          <svg className="w-5 h-5 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span className="text-sm pointer-events-none">Photo Library</span>
        </div>
      </div>

      {uploading && (
        <div className="flex items-center gap-2 mt-2 text-xs text-cream/40">
          <div className="w-3 h-3 border border-cream/20 border-t-sandstone rounded-full animate-spin" />
          Uploading...
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400 mt-2">{error}</p>
      )}

      {photos.length === 0 && (
        <p className="text-xs text-cream/30 mt-2">
          Optional. Add photos to document this item.
        </p>
      )}
    </div>
  )
}
