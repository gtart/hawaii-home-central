'use client'

import { useState, useEffect } from 'react'

interface ContentImage {
  id: string
  url: string
  alt: string | null
  caption: string | null
  createdAt: string
}

interface ImagePanelProps {
  contentId?: string
  onSetHero?: (url: string) => void
}

export function ImagePanel({ contentId, onSetHero }: ImagePanelProps) {
  const [images, setImages] = useState<ContentImage[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const loadImages = () => {
    const params = contentId ? `?contentId=${contentId}` : ''
    fetch(`/api/admin/images${params}`)
      .then((r) => r.json())
      .then((data) => setImages(data))
      .catch(() => {})
  }

  useEffect(() => {
    loadImages()
  }, [contentId])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setUploading(true)

    const formData = new FormData()
    formData.append('file', file)
    if (contentId) formData.append('contentId', contentId)

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Upload failed')
        return
      }

      loadImages()
    } catch {
      setError('Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this image?')) return
    await fetch(`/api/admin/images?id=${id}`, { method: 'DELETE' })
    loadImages()
  }

  const copySnippet = (image: ContentImage, format: 'md' | 'html') => {
    const alt = image.alt || 'image'
    const text =
      format === 'md'
        ? `![${alt}](${image.url})`
        : `<figure><img src="${image.url}" alt="${alt}" />${image.caption ? `<figcaption>${image.caption}</figcaption>` : ''}</figure>`

    navigator.clipboard.writeText(text)
    setCopiedId(image.id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  return (
    <div className="bg-basalt-50 rounded-card p-6">
      <h3 className="text-sm text-cream/70 font-medium mb-3">Images</h3>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded p-2 text-red-300 text-xs mb-3">
          {error}
        </div>
      )}

      <label className="inline-block cursor-pointer mb-4">
        <span className="inline-flex items-center justify-center font-sans font-medium text-sm px-4 py-2 rounded-button bg-basalt-50 text-cream border border-cream/20 hover:border-cream/40 hover:bg-basalt-100 transition-all">
          {uploading ? 'Uploading...' : 'Upload Image'}
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleUpload}
          className="hidden"
          disabled={uploading}
        />
      </label>

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative bg-basalt rounded overflow-hidden"
            >
              <img
                src={img.url}
                alt={img.alt || ''}
                className="w-full h-24 object-cover"
              />
              <div className="absolute inset-0 bg-basalt/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => copySnippet(img, 'md')}
                    className="text-[10px] bg-cream/10 hover:bg-cream/20 text-cream px-2 py-0.5 rounded"
                  >
                    {copiedId === img.id ? 'Copied!' : 'Copy MD'}
                  </button>
                  <button
                    type="button"
                    onClick={() => copySnippet(img, 'html')}
                    className="text-[10px] bg-cream/10 hover:bg-cream/20 text-cream px-2 py-0.5 rounded"
                  >
                    HTML
                  </button>
                </div>
                {onSetHero && (
                  <button
                    type="button"
                    onClick={() => onSetHero(img.url)}
                    className="text-[10px] bg-sandstone/20 hover:bg-sandstone/40 text-sandstone px-2 py-0.5 rounded"
                  >
                    Set as Hero
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(img.id)}
                  className="text-[10px] bg-red-500/20 hover:bg-red-500/40 text-red-300 px-2 py-0.5 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && !uploading && (
        <p className="text-cream/30 text-xs">No images uploaded yet</p>
      )}
    </div>
  )
}
