'use client'

import { useState, useMemo, useRef } from 'react'
import { useSession } from 'next-auth/react'
import type { PunchlistItem, PunchlistPhoto, PunchlistPriority } from '../types'
import type { PunchlistStateAPI } from '../usePunchlistState'
import { LOCATION_SEEDS, ASSIGNEE_SEEDS } from '../utils'
import { PhotoCapture } from './PhotoCapture'

interface Props {
  api: PunchlistStateAPI
  editItem?: PunchlistItem
  onClose: () => void
}

export function PunchlistItemForm({ api, editItem, onClose }: Props) {
  const { data: session } = useSession()
  const { addItem, updateItem, payload } = api

  const [title, setTitle] = useState(editItem?.title ?? '')
  const [location, setLocation] = useState(editItem?.location ?? '')
  const [assignee, setAssignee] = useState(editItem?.assigneeLabel ?? '')
  const [priority, setPriority] = useState<PunchlistPriority | ''>(editItem?.priority ?? '')
  const [notes, setNotes] = useState(editItem?.notes ?? '')
  const [photos, setPhotos] = useState<PunchlistPhoto[]>(editItem?.photos ?? [])
  const [photoUploading, setPhotoUploading] = useState(false)
  const [error, setError] = useState('')
  const [addedCount, setAddedCount] = useState(0)
  const [showSaved, setShowSaved] = useState(false)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const locationOptions = useMemo(() => {
    const existing = new Set(payload.items.map((i) => i.location).filter(Boolean))
    const all = new Set([...LOCATION_SEEDS, ...existing])
    return Array.from(all).sort()
  }, [payload.items])

  const assigneeOptions = useMemo(() => {
    const existing = new Set(payload.items.map((i) => i.assigneeLabel).filter(Boolean))
    const all = new Set([...ASSIGNEE_SEEDS, ...existing])
    return Array.from(all).sort()
  }, [payload.items])

  function flashSaved() {
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    setShowSaved(true)
    savedTimerRef.current = setTimeout(() => setShowSaved(false), 2000)
  }

  function validate(): boolean {
    setError('')
    if (!title.trim() && photos.length === 0) {
      setError('Add a title or at least one photo')
      return false
    }
    return true
  }

  function handleSubmit() {
    if (!validate()) return

    if (editItem) {
      updateItem(editItem.id, {
        title: title.trim(),
        location: location.trim(),
        assigneeLabel: assignee.trim(),
        priority: priority || undefined,
        notes: notes.trim() || undefined,
        photos,
      })
    } else {
      addItem({
        title: title.trim(),
        location: location.trim(),
        assigneeLabel: assignee.trim(),
        priority: priority || undefined,
        notes: notes.trim() || undefined,
        photos,
        createdByName: session?.user?.name || undefined,
        createdByEmail: session?.user?.email || undefined,
      })
    }

    onClose()
  }

  function handleAddAnother() {
    if (!validate()) return

    addItem({
      title: title.trim(),
      location: location.trim(),
      assigneeLabel: assignee.trim(),
      priority: priority || undefined,
      notes: notes.trim() || undefined,
      photos,
      createdByName: session?.user?.name || undefined,
      createdByEmail: session?.user?.email || undefined,
    })

    // Reset variable fields; keep location/assignee/priority for rapid repeat entries
    setTitle('')
    setNotes('')
    setPhotos([])
    setError('')
    setAddedCount((c) => c + 1)
    flashSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop — blocked when there's unsaved work */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={photoUploading || photos.length > 0 || title.trim() || location.trim() ? undefined : onClose}
      />

      {/* Modal */}
      <div className="relative bg-basalt-50 border-t sm:border border-cream/10 rounded-t-xl sm:rounded-xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-basalt-50 border-b border-cream/10 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-medium text-cream">
              {editItem ? 'Edit Item' : 'New Item'}
            </h2>
            {showSaved && (
              <span className="text-xs text-emerald-400">Saved ✓</span>
            )}
            {addedCount > 0 && !showSaved && (
              <span className="text-xs text-cream/30">{addedCount} added</span>
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

        <div className="px-6 py-5 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm text-cream/70 mb-1.5">
              Title
              <span className="text-cream/30 text-xs ml-1.5">(or add a photo below)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chipped tile near shower door"
              autoFocus
              className="w-full bg-basalt border border-cream/20 rounded-lg px-3 py-2.5 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm text-cream/70 mb-1.5">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              list="punchlist-locations"
              placeholder="e.g. Master Bathroom"
              className="w-full bg-basalt border border-cream/20 rounded-lg px-3 py-2.5 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50"
            />
            <datalist id="punchlist-locations">
              {locationOptions.map((loc) => (
                <option key={loc} value={loc} />
              ))}
            </datalist>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-sm text-cream/70 mb-1.5">Assignee</label>
            <input
              type="text"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              list="punchlist-assignees"
              placeholder="e.g. GC, Plumber"
              className="w-full bg-basalt border border-cream/20 rounded-lg px-3 py-2.5 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50"
            />
            <datalist id="punchlist-assignees">
              {assigneeOptions.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm text-cream/70 mb-1.5">Priority</label>
            <div className="flex gap-2">
              {([
                { key: 'HIGH' as PunchlistPriority, label: 'High' },
                { key: 'MED' as PunchlistPriority, label: 'Medium' },
                { key: 'LOW' as PunchlistPriority, label: 'Low' },
              ]).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setPriority(priority === opt.key ? '' : opt.key)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                    priority === opt.key
                      ? 'bg-sandstone/20 border-sandstone/40 text-sandstone'
                      : 'border-cream/20 text-cream/50 hover:border-cream/40'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Photos */}
          <PhotoCapture
            photos={photos}
            onAdd={(p) => setPhotos((prev) => [...prev, p])}
            onRemove={(id) => setPhotos((prev) => prev.filter((p) => p.id !== id))}
            onUploadingChange={setPhotoUploading}
          />

          {/* Additional Information */}
          <div>
            <label className="block text-sm text-cream/70 mb-1.5">Additional Information</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Optional additional details…"
              className="w-full bg-basalt border border-cream/20 rounded-lg px-3 py-2.5 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50 resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            {!editItem && (
              <button
                type="button"
                onClick={handleAddAnother}
                disabled={photoUploading}
                className="flex-1 py-3 border border-cream/20 text-cream/70 text-sm font-medium rounded-lg hover:border-cream/40 hover:text-cream disabled:opacity-50 transition-colors"
              >
                + Add Another
              </button>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={photoUploading}
              className="flex-1 py-3 bg-sandstone text-basalt font-medium rounded-lg hover:bg-sandstone-light disabled:opacity-50 transition-colors"
            >
              {editItem ? 'Save Changes' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
