'use client'

import { useState, useEffect, useRef } from 'react'

type CaptureMode = 'url' | 'photo' | 'note'
type CaptureState = 'input' | 'loading' | 'success' | 'error'

interface CapturedResult {
  id: string
  type: string
  title?: string | null
  thumbnailUrl?: string | null
  imageUrl?: string | null
}

interface QuickCaptureSheetProps {
  onClose: () => void
  suggestedToolKey?: string
  suggestedCollectionId?: string
  onSort?: (item: CapturedResult) => void
}

export function QuickCaptureSheet({
  onClose,
  suggestedToolKey,
  suggestedCollectionId,
  onSort,
}: QuickCaptureSheetProps) {
  const [mode, setMode] = useState<CaptureMode>('url')
  const [captureState, setCaptureState] = useState<CaptureState>('input')
  const [url, setUrl] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState<CapturedResult | null>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const urlInputRef = useRef<HTMLInputElement>(null)

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Body scroll lock
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Auto-focus URL input
  useEffect(() => {
    if (mode === 'url' && captureState === 'input') {
      setTimeout(() => urlInputRef.current?.focus(), 100)
    }
  }, [mode, captureState])

  async function handleUrlCapture() {
    const trimmed = url.trim()
    if (!trimmed) return

    let finalUrl = trimmed
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`
    }

    setCaptureState('loading')
    setError('')

    try {
      const res = await fetch('/api/captured-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: finalUrl,
          suggestedToolKey,
          suggestedCollectionId,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Capture failed')
      }

      const item = await res.json()
      setResult(item)
      setCaptureState('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Capture failed')
      setCaptureState('error')
    }
  }

  async function handleNoteCapture() {
    const trimmed = note.trim()
    if (!trimmed) return

    setCaptureState('loading')
    setError('')

    try {
      const res = await fetch('/api/captured-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: trimmed,
          suggestedToolKey,
          suggestedCollectionId,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Save failed')
      }

      const item = await res.json()
      setResult(item)
      setCaptureState('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
      setCaptureState('error')
    }
  }

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return

    const file = files[0]
    if (file.size === 0) {
      setError('Empty file — try again')
      return
    }

    setCaptureState('loading')
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      if (suggestedToolKey) formData.append('suggestedToolKey', suggestedToolKey)
      if (suggestedCollectionId) formData.append('suggestedCollectionId', suggestedCollectionId)

      const res = await fetch('/api/captured-items/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Upload failed')
      }

      const item = await res.json()
      setResult(item)
      setCaptureState('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setCaptureState('error')
    } finally {
      if (cameraRef.current) cameraRef.current.value = ''
      if (galleryRef.current) galleryRef.current.value = ''
    }
  }

  function resetForAnother() {
    setCaptureState('input')
    setUrl('')
    setNote('')
    setError('')
    setResult(null)
  }

  const sheetContent = (
    <div className="flex flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-cream/10 px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium text-cream">Quick Capture</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-cream/40 hover:text-cream transition-colors shrink-0"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Mode tabs */}
        {captureState === 'input' && (
          <div className="flex gap-1.5">
            {([
              { key: 'url' as const, label: 'URL' },
              { key: 'photo' as const, label: 'Photo' },
              { key: 'note' as const, label: 'Note' },
            ]).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => { setMode(tab.key); setError('') }}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                  mode === tab.key
                    ? 'bg-sandstone/20 text-sandstone font-medium'
                    : 'text-cream/40 hover:text-cream/60 bg-cream/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        {/* Hidden file inputs */}
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => handleFileUpload(e.target.files)}
          className="hidden"
          tabIndex={-1}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileUpload(e.target.files)}
          className="hidden"
          tabIndex={-1}
        />

        {captureState === 'loading' && (
          <div className="flex items-center justify-center gap-3 py-8">
            <div className="w-5 h-5 border-2 border-cream/20 border-t-sandstone rounded-full animate-spin" />
            <span className="text-sm text-cream/50">Capturing...</span>
          </div>
        )}

        {captureState === 'success' && result && (
          <div>
            {/* Preview */}
            <div className="flex items-start gap-3 p-3 bg-cream/5 rounded-lg mb-4">
              {(result.thumbnailUrl || result.imageUrl) && (
                <img
                  src={result.thumbnailUrl || result.imageUrl || ''}
                  alt=""
                  className="w-12 h-12 rounded object-cover shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-cream truncate">{result.title || 'Captured'}</p>
                <p className="text-[11px] text-cream/30 mt-0.5">
                  {result.type === 'IMAGE' ? 'Image' : result.type === 'PAGE' ? 'Page' : 'Note'} saved to inbox
                </p>
              </div>
              <svg className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {onSort && (
                <button
                  type="button"
                  onClick={() => onSort(result)}
                  className="flex-1 px-4 py-2.5 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors"
                >
                  Sort now
                </button>
              )}
              <button
                type="button"
                onClick={resetForAnother}
                className="flex-1 px-4 py-2.5 bg-cream/5 text-cream/60 text-sm rounded-lg hover:bg-cream/10 transition-colors"
              >
                Capture another
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-cream/40 text-sm rounded-lg hover:text-cream/60 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {(captureState === 'input' || captureState === 'error') && (
          <>
            {/* URL mode */}
            {mode === 'url' && (
              <div>
                <div className="flex gap-2">
                  <input
                    ref={urlInputRef}
                    type="url"
                    value={url}
                    onChange={(e) => { setUrl(e.target.value); setError('') }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleUrlCapture() }}
                    placeholder="Paste a URL..."
                    className="flex-1 bg-cream/5 border border-cream/10 rounded-lg px-3 py-2.5 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/40"
                  />
                  <button
                    type="button"
                    onClick={handleUrlCapture}
                    disabled={!url.trim()}
                    className="px-4 py-2.5 bg-sandstone text-basalt text-sm font-medium rounded-lg disabled:opacity-40 hover:bg-sandstone-light transition-colors"
                  >
                    Capture
                  </button>
                </div>
                <p className="text-[11px] text-cream/25 mt-2">
                  Paste a product page, image, or any URL
                </p>
              </div>
            )}

            {/* Photo mode */}
            {mode === 'photo' && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => cameraRef.current?.click()}
                  className="flex-1 flex flex-col items-center gap-2 py-6 bg-cream/5 border border-cream/10 rounded-xl hover:bg-cream/8 transition-colors"
                >
                  <svg className="w-8 h-8 text-cream/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <span className="text-xs text-cream/50">Camera</span>
                </button>
                <button
                  type="button"
                  onClick={() => galleryRef.current?.click()}
                  className="flex-1 flex flex-col items-center gap-2 py-6 bg-cream/5 border border-cream/10 rounded-xl hover:bg-cream/8 transition-colors"
                >
                  <svg className="w-8 h-8 text-cream/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                  <span className="text-xs text-cream/50">Gallery</span>
                </button>
              </div>
            )}

            {/* Note mode */}
            {mode === 'note' && (
              <div>
                <textarea
                  value={note}
                  onChange={(e) => { setNote(e.target.value); setError('') }}
                  placeholder="Type a note..."
                  rows={3}
                  className="w-full bg-cream/5 border border-cream/10 rounded-lg px-3 py-2.5 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/40 resize-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] text-cream/20">{note.length}/2000</span>
                  <button
                    type="button"
                    onClick={handleNoteCapture}
                    disabled={!note.trim()}
                    className="px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-lg disabled:opacity-40 hover:bg-sandstone-light transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-xs text-red-400 mt-2">{error}</p>
            )}
          </>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Desktop: centered modal */}
      <div className="hidden md:flex fixed inset-0 z-[56] items-center justify-center pointer-events-none">
        <div
          className="w-full max-w-md bg-basalt-50 border border-cream/10 rounded-xl shadow-2xl pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {sheetContent}
        </div>
      </div>

      {/* Mobile: bottom sheet */}
      <div
        className="md:hidden fixed inset-x-0 bottom-0 z-[56] bg-basalt-50 border-t border-cream/10 rounded-t-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-cream/15 rounded-full" />
        </div>
        {sheetContent}
        <div className="pb-[env(safe-area-inset-bottom)]" />
      </div>
    </>
  )
}
