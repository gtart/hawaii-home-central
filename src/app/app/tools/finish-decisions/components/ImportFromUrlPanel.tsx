'use client'

import { useState, useCallback } from 'react'
import type { OptionImageV3 } from '@/data/finish-decisions'

interface LinkPreviewResult {
  title?: string
  description?: string
  image?: string
  canonicalUrl?: string
  siteName?: string
  primaryImage?: string
  images?: Array<{ url: string; label?: string }>
}

interface ImportResult {
  name: string
  notes: string
  sourceUrl: string
  selectedImages: OptionImageV3[]
}

export function ImportFromUrlPanel({
  onImport,
  onCancel,
  mode = 'create-idea',
}: {
  onImport: (result: ImportResult) => void
  onCancel: () => void
  /** 'create-idea' shows name/notes fields; 'pick-images' only shows image picker */
  mode?: 'create-idea' | 'pick-images'
}) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<LinkPreviewResult | null>(null)
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set())
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')

  const fetchPreview = useCallback(async () => {
    const trimmed = url.trim()
    if (!trimmed) return

    // Auto-prepend https:// if missing
    let finalUrl = trimmed
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl
    }

    try {
      new URL(finalUrl)
    } catch {
      setError('Please enter a valid URL')
      return
    }

    setLoading(true)
    setError('')
    setPreview(null)
    setSelectedUrls(new Set())

    try {
      const res = await fetch('/api/tools/finish-decisions/link-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: finalUrl }),
      })

      if (!res.ok) {
        setError('Could not fetch page preview')
        return
      }

      const data: LinkPreviewResult = await res.json()
      setUrl(finalUrl)

      // Check if the response is essentially empty (site blocked us)
      const isEmpty = !data.title && !data.description && (!data.images || data.images.length === 0)
      if (isEmpty) {
        // Still set preview so we show the fallback UI
        setPreview({ ...data, _blocked: true } as LinkPreviewResult)
        if (mode === 'create-idea') {
          // Pre-fill name from URL hostname + path
          try {
            const u = new URL(finalUrl)
            const pathName = u.pathname.split('/').filter(Boolean).pop() || ''
            const decoded = decodeURIComponent(pathName).replace(/[-_]/g, ' ').replace(/\.[^.]+$/, '')
            setName(decoded.slice(0, 80) || u.hostname.replace(/^www\./, ''))
          } catch { /* ignore */ }
        }
      } else {
        setPreview(data)
        if (data.title && mode === 'create-idea') {
          setName(data.title)
        }
        // No images selected by default — user picks what they want
      }
    } catch {
      setError('Failed to fetch preview. The site may be blocking requests.')
    } finally {
      setLoading(false)
    }
  }, [url, mode])

  const toggleImage = (imgUrl: string) => {
    setSelectedUrls((prev) => {
      const next = new Set(prev)
      if (next.has(imgUrl)) {
        next.delete(imgUrl)
      } else {
        next.add(imgUrl)
      }
      return next
    })
  }

  const handleImport = () => {
    const images: OptionImageV3[] = (preview?.images || [])
      .filter((img) => selectedUrls.has(img.url))
      .map((img) => ({
        id: crypto.randomUUID(),
        url: img.url,
        label: img.label,
        sourceUrl: url,
      }))

    onImport({
      name: name.trim() || preview?.title || 'Imported idea',
      notes: notes.trim(),
      sourceUrl: url,
      selectedImages: images,
    })
  }

  const proxyUrl = (imgUrl: string) =>
    `/api/image-proxy?url=${encodeURIComponent(imgUrl)}`

  const hasImages = preview?.images && preview.images.length > 0

  return (
    <div className="space-y-4">
      {/* URL Input */}
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              fetchPreview()
            }
          }}
          placeholder="Paste a URL (e.g. homedepot.com/p/...)"
          className="flex-1 px-3 py-2 bg-basalt-50 border border-cream/20 text-cream text-sm rounded-lg placeholder:text-cream/30 focus:outline-none focus:border-sandstone"
        />
        <button
          type="button"
          onClick={fetchPreview}
          disabled={loading || !url.trim()}
          className="px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
        >
          {loading ? 'Fetching...' : 'Fetch'}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {/* Loading spinner */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-cream/20 border-t-sandstone rounded-full animate-spin" />
        </div>
      )}

      {/* Preview */}
      {preview && !loading && (
        <div className="space-y-4">
          {/* Page info */}
          {(preview.title || preview.siteName || preview.description) && (
            <div className="bg-basalt-50 rounded-lg p-3 border border-cream/10">
              {preview.siteName && (
                <p className="text-[11px] text-cream/40 uppercase tracking-wide mb-1">
                  {preview.siteName}
                </p>
              )}
              {preview.title && (
                <p className="text-sm text-cream font-medium leading-snug">
                  {preview.title}
                </p>
              )}
              {preview.description && (
                <p className="text-xs text-cream/50 mt-1 line-clamp-2">
                  {preview.description}
                </p>
              )}
            </div>
          )}

          {/* Image picker grid */}
          {hasImages && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-cream/50">
                  Select images (optional) · {selectedUrls.size} selected
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUrls(new Set(preview!.images!.map((i) => i.url)))}
                    className="text-[11px] text-cream/40 hover:text-cream/70 transition-colors"
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedUrls(new Set())}
                    className="text-[11px] text-cream/40 hover:text-cream/70 transition-colors"
                  >
                    None
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-[300px] overflow-y-auto">
                {preview.images!.map((img) => {
                  const isSelected = selectedUrls.has(img.url)
                  return (
                    <button
                      key={img.url}
                      type="button"
                      onClick={() => toggleImage(img.url)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        isSelected
                          ? 'border-sandstone ring-1 ring-sandstone/30'
                          : 'border-transparent hover:border-cream/20'
                      }`}
                    >
                      <img
                        src={proxyUrl(img.url)}
                        alt={img.label || ''}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                      {/* Checkmark overlay */}
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-sandstone rounded-full flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-basalt">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                      {/* Label */}
                      {img.label && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 px-1.5 py-0.5">
                          <p className="text-[10px] text-white truncate">{img.label}</p>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* No images found / site blocked */}
          {!hasImages && (
            <div className="bg-basalt rounded-lg p-4 text-center">
              <p className="text-xs text-cream/50 mb-1">
                {(preview as Record<string, unknown>)?._blocked
                  ? 'This site blocked our preview request.'
                  : 'No images found on this page.'}
              </p>
              <p className="text-[11px] text-cream/30">
                You can still save this URL as an idea — just enter a name below.
              </p>
            </div>
          )}

          {/* Name & Notes (create-idea mode only) */}
          {mode === 'create-idea' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-cream/50 mb-1">Idea name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name this idea..."
                  className="w-full px-3 py-2 bg-basalt-50 border border-cream/20 text-cream text-sm rounded-lg placeholder:text-cream/30 focus:outline-none focus:border-sandstone"
                />
              </div>
              <div>
                <label className="block text-xs text-cream/50 mb-1">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Price, specs, or other details..."
                  rows={2}
                  className="w-full px-3 py-2 bg-basalt-50 border border-cream/20 text-cream text-sm rounded-lg placeholder:text-cream/30 focus:outline-none focus:border-sandstone resize-none"
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm text-cream/60 hover:text-cream transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={mode === 'create-idea' ? !name.trim() : selectedUrls.size === 0}
              className="px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {mode === 'pick-images'
                ? `Import ${selectedUrls.size} image${selectedUrls.size !== 1 ? 's' : ''}`
                : 'Create Idea'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
