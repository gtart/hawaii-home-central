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
  const fileRef = useRef<HTMLInputElement>(null)

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

        const { url, id } = await res.json()
        onAdd({
          id,
          url,
          uploadedAt: new Date().toISOString(),
        })
      } catch (err) {
        console.error('Photo upload error:', err)
        setError('Upload failed. Check your connection and try again.')
      }
    }

    setUploading(false)
    if (cameraRef.current) cameraRef.current.value = ''
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div>
      <label className="block text-sm text-cream/70 mb-2">
        Photos
      </label>

      {/* Photo preview grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden group">
              <img
                src={photo.url}
                alt=""
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => onRemove(photo.id)}
                className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload buttons */}
      <div className="flex gap-2">
        {/* Camera — mobile only (hidden on md+ screens via CSS) */}
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          disabled={uploading}
          className="flex-1 flex md:hidden items-center justify-center gap-2 py-3 border border-dashed border-cream/20 rounded-lg text-cream/50 hover:border-sandstone/40 hover:text-sandstone transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <span className="text-sm">Camera</span>
        </button>

        {/* File upload — always shown */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex-1 flex items-center justify-center gap-2 py-3 border border-dashed border-cream/20 rounded-lg text-cream/50 hover:border-sandstone/40 hover:text-sandstone transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span className="text-sm">Upload Files</span>
        </button>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        capture="environment"
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

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
