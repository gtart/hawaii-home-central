'use client'

import { useState, useRef, useMemo } from 'react'
import type { PunchlistPriority, PunchlistPhoto } from '../types'
import type { PunchlistStateAPI } from '../usePunchlistState'
import { uploadFile, LOCATION_SEEDS, ASSIGNEE_SEEDS } from '../utils'

interface DraftRow {
  id: number
  title: string
  location: string
  assignee: string
  priority: PunchlistPriority | ''
  photos: PunchlistPhoto[]
  expanded: boolean
}

interface Props {
  api: PunchlistStateAPI
  onClose: () => void
}

const MAX_ROWS = 20

let rowCounter = 0
function makeRow(defaults: { location: string; assignee: string }): DraftRow {
  return {
    id: ++rowCounter,
    title: '',
    location: defaults.location,
    assignee: defaults.assignee,
    priority: '',
    photos: [],
    expanded: false,
  }
}

export function BulkTextEntry({ api, onClose }: Props) {
  const { addItem, payload } = api

  const [defaultLocation, setDefaultLocation] = useState('')
  const [defaultAssignee, setDefaultAssignee] = useState('')
  const [rows, setRows] = useState<DraftRow[]>(() => {
    const defaults = { location: '', assignee: '' }
    return [makeRow(defaults), makeRow(defaults), makeRow(defaults)]
  })
  const [error, setError] = useState('')
  const titleRefs = useRef<Map<number, HTMLInputElement>>(new Map())

  const locationOptions = useMemo(() => {
    const existing = new Set(payload.items.map((i) => i.location))
    return Array.from(new Set([...LOCATION_SEEDS, ...existing])).sort()
  }, [payload.items])

  const assigneeOptions = useMemo(() => {
    const existing = new Set(payload.items.map((i) => i.assigneeLabel))
    return Array.from(new Set([...ASSIGNEE_SEEDS, ...existing])).sort()
  }, [payload.items])

  function updateRow(id: number, field: keyof DraftRow, value: string | PunchlistPhoto[] | boolean) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    )
  }

  function removeRow(id: number) {
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  function addRow() {
    if (rows.length >= MAX_ROWS) return
    const newRow = makeRow({ location: defaultLocation, assignee: defaultAssignee })
    setRows((prev) => [...prev, newRow])
    // Focus the new row after render
    setTimeout(() => {
      titleRefs.current.get(newRow.id)?.focus()
    }, 50)
  }

  function handleTitleKeyDown(e: React.KeyboardEvent, rowIndex: number) {
    if (e.key === 'Enter') {
      e.preventDefault()
      // Focus next row's title, or add new row
      if (rowIndex < rows.length - 1) {
        titleRefs.current.get(rows[rowIndex + 1].id)?.focus()
      } else if (rows.length < MAX_ROWS) {
        addRow()
      }
    }
  }

  function applyDefaults() {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        location: r.location || defaultLocation,
        assignee: r.assignee || defaultAssignee,
      }))
    )
  }

  async function handlePhotoUpload(rowId: number, files: FileList | null) {
    if (!files || files.length === 0) return
    const file = files[0]
    try {
      const photo = await uploadFile(file)
      setRows((prev) =>
        prev.map((r) => (r.id === rowId ? { ...r, photos: [...r.photos, photo] } : r))
      )
    } catch {
      // silent — photo is optional
    }
  }

  function removePhoto(rowId: number, photoId: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId ? { ...r, photos: r.photos.filter((p) => p.id !== photoId) } : r
      )
    )
  }

  function handleSubmit() {
    setError('')
    const valid = rows.filter((r) => r.title.trim())
    if (valid.length === 0) {
      setError('At least one item needs a title')
      return
    }

    const missing = valid.find((r) => !r.location.trim() || !r.assignee.trim())
    if (missing) {
      setError('All items with a title need a location and assignee')
      return
    }

    for (const r of valid) {
      addItem({
        title: r.title.trim(),
        location: r.location.trim(),
        assigneeLabel: r.assignee.trim(),
        priority: r.priority || undefined,
        photos: r.photos,
      })
    }

    onClose()
  }

  const validCount = rows.filter((r) => r.title.trim()).length

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={rows.some((r) => r.title.trim()) ? undefined : onClose}
      />

      <div className="relative bg-basalt-50 border-t sm:border border-cream/10 rounded-t-xl sm:rounded-xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-basalt-50 border-b border-cream/10 px-5 py-3 flex items-center justify-between z-10">
          <div className="w-7" />
          <h2 className="text-base font-medium text-cream truncate flex-1 mx-3 text-center">
            Add Multiple Items
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

        <div className="px-5 py-5 space-y-4">
          {/* Defaults bar */}
          <div className="bg-basalt rounded-lg p-3 space-y-3">
            <p className="text-xs text-cream/40 uppercase tracking-wider">Default for new rows</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={defaultLocation}
                onChange={(e) => setDefaultLocation(e.target.value)}
                list="text-bulk-locations"
                placeholder="Location"
                className="flex-1 bg-basalt-50 border border-cream/20 rounded-lg px-2.5 py-2 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50"
              />
              <input
                type="text"
                value={defaultAssignee}
                onChange={(e) => setDefaultAssignee(e.target.value)}
                list="text-bulk-assignees"
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
            <datalist id="text-bulk-locations">
              {locationOptions.map((loc) => <option key={loc} value={loc} />)}
            </datalist>
            <datalist id="text-bulk-assignees">
              {assigneeOptions.map((a) => <option key={a} value={a} />)}
            </datalist>
          </div>

          {/* Rows */}
          <div className="space-y-2">
            {rows.map((row, idx) => (
              <div key={row.id} className="bg-basalt rounded-lg p-3">
                {/* Compact row */}
                <div className="flex gap-2 items-center">
                  <span className="text-[10px] text-cream/25 shrink-0 w-4 text-right">{idx + 1}</span>
                  <input
                    ref={(el) => {
                      if (el) titleRefs.current.set(row.id, el)
                      else titleRefs.current.delete(row.id)
                    }}
                    type="text"
                    value={row.title}
                    onChange={(e) => updateRow(row.id, 'title', e.target.value)}
                    onKeyDown={(e) => handleTitleKeyDown(e, idx)}
                    placeholder="What's the issue?"
                    className="flex-1 bg-basalt-50 border border-cream/20 rounded-lg px-2.5 py-1.5 text-sm text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50"
                  />
                  <input
                    type="text"
                    value={row.location}
                    onChange={(e) => updateRow(row.id, 'location', e.target.value)}
                    list="text-bulk-locations"
                    placeholder="Location"
                    className="w-24 bg-basalt-50 border border-cream/20 rounded-lg px-2 py-1.5 text-xs text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50"
                  />
                  {/* Expand / collapse */}
                  <button
                    type="button"
                    onClick={() => updateRow(row.id, 'expanded', !row.expanded)}
                    className="text-cream/30 hover:text-cream transition-colors shrink-0"
                    title="More options"
                  >
                    <svg className={`w-4 h-4 transition-transform ${row.expanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="text-cream/20 hover:text-red-400 transition-colors shrink-0"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>

                {/* Expanded details */}
                {row.expanded && (
                  <div className="mt-3 pt-3 border-t border-cream/5 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={row.assignee}
                        onChange={(e) => updateRow(row.id, 'assignee', e.target.value)}
                        list="text-bulk-assignees"
                        placeholder="Assignee"
                        className="flex-1 bg-basalt-50 border border-cream/20 rounded-lg px-2.5 py-1.5 text-xs text-cream placeholder:text-cream/30 focus:outline-none focus:border-sandstone/50"
                      />
                      <div className="flex gap-1">
                        {(['HIGH', 'MED', 'LOW'] as PunchlistPriority[]).map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => updateRow(row.id, 'priority', row.priority === p ? '' : p)}
                            className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                              row.priority === p
                                ? 'bg-sandstone/20 border-sandstone/40 text-sandstone'
                                : 'border-cream/20 text-cream/40 hover:border-cream/30'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Photo for this row */}
                    <div className="flex items-center gap-2">
                      {row.photos.map((p) => (
                        <div key={p.id} className="relative w-10 h-10 rounded overflow-hidden group">
                          <img src={p.thumbnailUrl || p.url} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removePhoto(row.id, p.id)}
                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      <label className="relative flex items-center gap-1 text-xs text-cream/30 hover:text-cream/50 cursor-pointer transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhotoUpload(row.id, e.target.files)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                        Photo
                      </label>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add row button */}
          {rows.length < MAX_ROWS && (
            <button
              type="button"
              onClick={addRow}
              className="w-full py-2 border border-dashed border-cream/20 rounded-lg text-xs text-cream/40 hover:border-cream/30 hover:text-cream/60 transition-colors"
            >
              + Add row ({rows.length}/{MAX_ROWS})
            </button>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={validCount === 0}
            className="w-full py-3 bg-sandstone text-basalt font-medium rounded-lg hover:bg-sandstone-light transition-colors disabled:opacity-50"
          >
            Add {validCount} Items
          </button>

          <p className="text-[10px] text-cream/25 text-center">
            Press Enter to jump to the next row. Rows without titles are skipped.
          </p>
        </div>
      </div>
    </div>
  )
}
