'use client'

import { useState, useRef, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import type { PunchlistPhoto, PunchlistPriority } from '../types'
import type { PunchlistStateAPI } from '../usePunchlistState'
import { uploadFile, LOCATION_SEEDS, ASSIGNEE_SEEDS } from '../utils'

interface DraftItem {
  photo: PunchlistPhoto
  title: string
  location: string
  assignee: string
  priority: PunchlistPriority | ''
}

interface Props {
  api: PunchlistStateAPI
  onClose: () => void
}

const MAX_PHOTOS = 10

export function BulkPhotoUpload({ api, onClose }: Props) {
  const { data: session } = useSession()
  const { addItem, payload } = api
  const [step, setStep] = useState<'upload' | 'label'>('upload')
  const [drafts, setDrafts] = useState<DraftItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 })
  const [error, setError] = useState('')
  const [submitError, setSubmitError] = useState('')

  // Default values for "Apply to all"
  const [defaultLocation, setDefaultLocation] = useState('')
  const [defaultAssignee, setDefaultAssignee] = useState('')

  const fileRef = useRef<HTMLInputElement>(null)

  const locationOptions = useMemo(() => {
    const existing = new Set(payload.items.map((i) => i.location))
    return Array.from(new Set([...LOCATION_SEEDS, ...existing])).sort()
  }, [payload.items])

  const assigneeOptions = useMemo(() => {
    const existing = new Set(payload.items.map((i) => i.assigneeLabel))
    return Array.from(new Set([...ASSIGNEE_SEEDS, ...existing])).sort()
  }, [payload.items])

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setError('')
    setUploading(true)

    const fileArray = Array.from(files).slice(0, MAX_PHOTOS)
    setUploadProgress({ done: 0, total: fileArray.length })

    const uploaded: PunchlistPhoto[] = []
    // Upload in parallel batches of 3
    for (let i = 0; i < fileArray.length; i += 3) {
      const batch = fileArray.slice(i, i + 3)
      const results = await Promise.allSettled(batch.map(uploadFile))
      for (const r of results) {
        if (r.status === 'fulfilled') {
          uploaded.push(r.value)
        } else {
          const msg = r.reason instanceof Error ? r.reason.message : 'Upload failed'
          setError(msg)
        }
      }
      setUploadProgress({ done: uploaded.length, total: fileArray.length })
    }

    if (uploaded.length > 0) {
      setDrafts((prev) => [
        ...prev,
        ...uploaded.map((photo) => ({
          photo,
          title: '',
          location: defaultLocation,
          assignee: defaultAssignee,
          priority: '' as PunchlistPriority | '',
        })),
      ].slice(0, MAX_PHOTOS))
    }

    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  function removeDraft(index: number) {
    setDrafts((prev) => prev.filter((_, i) => i !== index))
  }

  function updateDraft(index: number, field: keyof DraftItem, value: string) {
    setDrafts((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d))
    )
  }

  function applyDefaults() {
    setDrafts((prev) =>
      prev.map((d) => ({
        ...d,
        location: d.location || defaultLocation,
        assignee: d.assignee || defaultAssignee,
      }))
    )
  }

  function handleSubmit() {
    setSubmitError('')
    // Each draft already has a photo — submit all of them (title optional, can be added later)
    if (drafts.length === 0) {
      setSubmitError('Upload at least one photo')
      return
    }

    for (const d of drafts) {
      addItem({
        title: d.title.trim(),
        location: d.location.trim(),
        assigneeLabel: d.assignee.trim(),
        priority: d.priority || undefined,
        photos: [d.photo],
        createdByName: session?.user?.name || undefined,
        createdByEmail: session?.user?.email || undefined,
      })
    }

    onClose()
  }

  const canProceed = drafts.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={uploading || drafts.length > 0 ? undefined : onClose}
      />

      <div className="relative bg-basalt-50 border-t sm:border border-cream/10 rounded-t-xl sm:rounded-xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-basalt-50 border-b border-cream/10 px-5 py-3 flex items-center justify-between z-10">
          {step === 'label' ? (
            <button
              type="button"
              onClick={() => setStep('upload')}
              className="text-cream/40 hover:text-cream transition-colors p-1"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <div className="w-7" />
          )}

          <h2 className="text-base font-medium text-cream truncate flex-1 mx-3 text-center">
            {step === 'upload' ? 'Add Items from Photos' : `Label ${drafts.length} Items`}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="text-cream/40 hover:text-cream transition-colors p-1"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {step === 'upload' ? (
          <div className="px-5 py-5 space-y-5">
            <p className="text-sm text-cream/50">
              Select up to {MAX_PHOTOS} photos. Each photo becomes a new fix list item.
            </p>

            {/* Photo grid preview */}
            {drafts.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {drafts.map((d, i) => (
                  <div key={d.photo.id} className="relative aspect-square rounded-lg overflow-hidden group">
                    <img
                      src={d.photo.thumbnailUrl || d.photo.url}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <button
                      type="button"
                      onClick={() => removeDraft(i)}
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

            {/* File input */}
            {drafts.length < MAX_PHOTOS && (
              <div className={`relative flex items-center justify-center gap-2 py-8 border-2 border-dashed border-cream/20 rounded-lg text-cream/50 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFiles(e.target.files)}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 10 }}
                />
                <svg className="w-6 h-6 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <span className="text-sm pointer-events-none">
                  {drafts.length === 0 ? 'Select Photos' : `Add More (${drafts.length}/${MAX_PHOTOS})`}
                </span>
              </div>
            )}

            {uploading && (
              <div className="flex items-center gap-2 text-xs text-cream/40">
                <div className="w-3 h-3 border border-cream/20 border-t-sandstone rounded-full animate-spin" />
                Uploading {uploadProgress.done}/{uploadProgress.total}...
              </div>
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}

            {/* Next button */}
            <button
              type="button"
              onClick={() => setStep('label')}
              disabled={!canProceed}
              className="w-full py-3 bg-sandstone text-basalt font-medium rounded-lg hover:bg-sandstone-light transition-colors disabled:opacity-50"
            >
              Next — Label Items
            </button>
          </div>
        ) : (
          <div className="px-5 py-5 space-y-4">
            {/* Defaults bar */}
            <div className="bg-basalt rounded-lg p-3 space-y-3">
              <p className="text-xs text-cream/40 uppercase tracking-wider">Quick fill defaults</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={defaultLocation}
                  onChange={(e) => setDefaultLocation(e.target.value)}
                  list="bulk-locations"
                  placeholder="Location"
                  className="flex-1 bg-basalt-50 border border-cream/20 rounded-lg px-2.5 py-2 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50"
                />
                <input
                  type="text"
                  value={defaultAssignee}
                  onChange={(e) => setDefaultAssignee(e.target.value)}
                  list="bulk-assignees"
                  placeholder="Assignee"
                  className="flex-1 bg-basalt-50 border border-cream/20 rounded-lg px-2.5 py-2 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50"
                />
                <button
                  type="button"
                  onClick={applyDefaults}
                  className="px-3 py-2 text-xs bg-sandstone/20 text-sandstone rounded-lg hover:bg-sandstone/30 transition-colors shrink-0"
                >
                  Apply
                </button>
              </div>
              <datalist id="bulk-locations">
                {locationOptions.map((loc) => <option key={loc} value={loc} />)}
              </datalist>
              <datalist id="bulk-assignees">
                {assigneeOptions.map((a) => <option key={a} value={a} />)}
              </datalist>
            </div>

            {/* Draft items */}
            <div className="space-y-3">
              {drafts.map((d, i) => (
                <div key={d.photo.id} className="bg-basalt rounded-lg p-3">
                  <div className="flex gap-3">
                    {/* Thumbnail */}
                    <div className="shrink-0 w-14 h-14 rounded-lg overflow-hidden">
                      <img
                        src={d.photo.thumbnailUrl || d.photo.url}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    {/* Fields */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <input
                        type="text"
                        value={d.title}
                        onChange={(e) => updateDraft(i, 'title', e.target.value)}
                        placeholder="What's the issue? (optional)"
                        className="w-full bg-basalt-50 border border-cream/20 rounded-lg px-2.5 py-1.5 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={d.location}
                          onChange={(e) => updateDraft(i, 'location', e.target.value)}
                          list="bulk-locations"
                          placeholder="Location"
                          className="flex-1 bg-basalt-50 border border-cream/20 rounded-lg px-2.5 py-1.5 text-xs text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50"
                        />
                        <input
                          type="text"
                          value={d.assignee}
                          onChange={(e) => updateDraft(i, 'assignee', e.target.value)}
                          list="bulk-assignees"
                          placeholder="Assignee"
                          className="flex-1 bg-basalt-50 border border-cream/20 rounded-lg px-2.5 py-1.5 text-xs text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50"
                        />
                      </div>
                    </div>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => removeDraft(i)}
                      className="text-cream/30 hover:text-red-400 transition-colors shrink-0 self-start"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {submitError && <p className="text-sm text-red-400">{submitError}</p>}

            {/* Submit */}
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full py-3 bg-sandstone text-basalt font-medium rounded-lg hover:bg-sandstone-light transition-colors"
            >
              Add {drafts.length} {drafts.length === 1 ? 'Item' : 'Items'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
