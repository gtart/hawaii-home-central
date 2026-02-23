'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import type { PunchlistStateAPI } from '../usePunchlistState'
import type { PunchlistPhoto } from '../types'
import { uploadFile } from '../utils'

interface Props {
  api: PunchlistStateAPI
  onDone: () => void
}

export function QuickAddStrip({ api, onDone }: Props) {
  const [title, setTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [addError, setAddError] = useState('')
  const [savedCount, setSavedCount] = useState(0)
  const [showSaved, setShowSaved] = useState(false)
  const [cameraBlocked, setCameraBlocked] = useState(false)

  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Detect camera permission state
  useEffect(() => {
    if (typeof navigator === 'undefined') return
    navigator.permissions
      ?.query({ name: 'camera' as PermissionName })
      .then((result) => {
        setCameraBlocked(result.state === 'denied')
        const onChange = () => setCameraBlocked(result.state === 'denied')
        result.addEventListener('change', onChange)
        return () => result.removeEventListener('change', onChange)
      })
      .catch(() => {})
  }, [])

  function flashSaved() {
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    setShowSaved(true)
    savedTimerRef.current = setTimeout(() => setShowSaved(false), 2000)
  }

  const commit = useCallback(
    (photo?: PunchlistPhoto) => {
      const t = title.trim()
      const hasPhoto = !!photo
      const hasTitle = !!t

      if (!hasPhoto && !hasTitle) {
        setAddError('Add a photo or describe the issue')
        return false
      }

      api.addItem({
        title: t,
        location: '',
        assigneeLabel: '',
        photos: photo ? [photo] : [],
      })

      setTitle('')
      setAddError('')
      setSavedCount((c) => c + 1)
      flashSaved()
      setTimeout(() => inputRef.current?.focus(), 50)
      return true
    },
    [title, api]
  )

  async function handleFiles(files: FileList | null, ref: React.RefObject<HTMLInputElement | null>) {
    if (!files || files.length === 0) return
    const file = files[0]

    if (file.size === 0) {
      setUploadError('Camera returned an empty photo — try again')
      if (ref.current) ref.current.value = ''
      return
    }

    setUploadError('')
    setAddError('')
    setUploading(true)

    try {
      const uploaded = await uploadFile(file)
      commit(uploaded)
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (ref.current) ref.current.value = ''
    }
  }

  function openCamera() {
    if (cameraBlocked) {
      setUploadError('Camera blocked — check browser or device settings')
      return
    }
    cameraRef.current?.click()
  }

  function openGallery() {
    galleryRef.current?.click()
  }

  function handleAdd() {
    commit()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  const disabled = uploading

  return (
    <>
      {/* Hidden file inputs — triggered programmatically */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFiles(e.target.files, cameraRef)}
        className="hidden"
        tabIndex={-1}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFiles(e.target.files, galleryRef)}
        className="hidden"
        tabIndex={-1}
      />

      {/* ── Mobile: sticky bottom bar ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-basalt-50 border-t border-cream/15 z-30">
        <div className="px-4 pt-3 pb-4">
          <div className="flex items-center gap-2 mb-2">
            {/* Camera button */}
            <button
              type="button"
              onClick={openCamera}
              disabled={disabled}
              className="shrink-0 w-10 h-10 bg-basalt border border-cream/20 rounded-lg flex items-center justify-center disabled:opacity-50 active:bg-cream/5 transition-colors"
              aria-label="Take a photo"
            >
              {uploading ? (
                <div className="w-4 h-4 border border-cream/20 border-t-sandstone rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5 text-cream/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              )}
            </button>

            {/* Gallery button */}
            <button
              type="button"
              onClick={openGallery}
              disabled={disabled}
              className="shrink-0 w-10 h-10 bg-basalt border border-cream/20 rounded-lg flex items-center justify-center disabled:opacity-50 active:bg-cream/5 transition-colors"
              aria-label="Choose from photos"
            >
              <svg className="w-5 h-5 text-cream/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </button>

            {/* Text input */}
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setAddError('') }}
              onKeyDown={handleKeyDown}
              placeholder="Describe the issue…"
              autoFocus
              className="flex-1 min-w-0 bg-basalt border border-cream/20 rounded-lg px-3 py-2.5 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50"
            />

            {/* Add button */}
            <button
              type="button"
              onClick={handleAdd}
              disabled={disabled}
              className="shrink-0 px-3.5 py-2.5 bg-sandstone text-basalt text-sm font-medium rounded-lg disabled:opacity-50 hover:bg-sandstone-light transition-colors"
            >
              Add
            </button>
          </div>

          {/* Status line */}
          <div className="flex items-center justify-between min-h-[18px]">
            <div className="text-xs">
              {showSaved && <span className="text-emerald-400">Saved ✓</span>}
              {uploadError && <span className="text-red-400">{uploadError}</span>}
              {addError && !uploadError && <span className="text-red-400">{addError}</span>}
              {cameraBlocked && !uploadError && !addError && !showSaved && (
                <span className="text-amber-400/70">Camera blocked — use Photos instead</span>
              )}
              {savedCount > 0 && !showSaved && !uploadError && !addError && !cameraBlocked && (
                <span className="text-cream/30">{savedCount} added</span>
              )}
            </div>
            <button
              type="button"
              onClick={onDone}
              className="text-xs text-cream/40 hover:text-cream/60 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* ── Desktop: inline card above item list ── */}
      <div className="hidden md:block bg-basalt-50 border border-cream/10 rounded-xl px-4 py-3 mb-6">
        <div className="flex items-center gap-3 mb-2">
          {/* Photo picker (desktop — no camera, just file picker) */}
          <button
            type="button"
            onClick={openGallery}
            disabled={disabled}
            className="shrink-0 w-10 h-10 bg-basalt border border-cream/20 rounded-lg flex items-center justify-center disabled:opacity-50 hover:border-cream/40 transition-colors"
            aria-label="Add photo"
          >
            {uploading ? (
              <div className="w-4 h-4 border border-cream/20 border-t-sandstone rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 text-cream/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            )}
          </button>

          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setAddError('') }}
            onKeyDown={handleKeyDown}
            placeholder="Describe the issue…"
            autoFocus
            className="flex-1 bg-basalt border border-cream/20 rounded-lg px-3 py-2.5 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50"
          />

          <button
            type="button"
            onClick={handleAdd}
            disabled={disabled}
            className="shrink-0 px-3.5 py-2.5 bg-sandstone text-basalt text-sm font-medium rounded-lg disabled:opacity-50 hover:bg-sandstone-light transition-colors"
          >
            Add
          </button>
        </div>
        <div className="flex items-center justify-between min-h-[18px] pl-14">
          <div className="text-xs">
            {showSaved && <span className="text-emerald-400">Saved ✓</span>}
            {uploadError && <span className="text-red-400">{uploadError}</span>}
            {addError && !uploadError && <span className="text-red-400">{addError}</span>}
            {savedCount > 0 && !showSaved && !uploadError && !addError && (
              <span className="text-cream/30">{savedCount} added</span>
            )}
          </div>
          <button
            type="button"
            onClick={onDone}
            className="text-xs text-cream/40 hover:text-cream/60 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </>
  )
}
