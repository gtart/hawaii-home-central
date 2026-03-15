'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { CHANGE_LOG_STATUS_CONFIG, CHANGE_LOG_STATUS_ORDER, toChangeLogStatus, CHANGE_CATEGORIES } from '../constants'
import type { ChangeLogStatus, ChangeCategory } from '../constants'
import type { ProjectSummaryStateAPI } from '../useProjectSummaryState'
import { InlineEdit } from './InlineEdit'
import { StatusBadge } from './StatusBadge'
import { uploadProjectSummaryFile } from '../uploadProjectSummaryFile'

interface ChangesSectionProps {
  api: ProjectSummaryStateAPI
  commentCounts?: Map<string, number>
  focusEntryId?: string
}

/** Status dropdown — 5 homeowner-friendly statuses */
function StatusDropdown({
  status,
  onChange,
  readOnly,
}: {
  status: ChangeLogStatus
  onChange: (status: ChangeLogStatus) => void
  readOnly?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const config = CHANGE_LOG_STATUS_CONFIG[status]

  return (
    <div className="relative" ref={ref}>
      <StatusBadge
        label={config.label}
        color={config.color}
        bgColor={config.bgColor}
        onClick={readOnly ? undefined : () => setOpen(!open)}
        readOnly={readOnly}
      />
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[180px] rounded-lg border border-cream/15 bg-basalt shadow-xl py-1">
          {CHANGE_LOG_STATUS_ORDER.map((s) => {
            const cfg = CHANGE_LOG_STATUS_CONFIG[s]
            const isActive = s === status
            return (
              <button
                key={s}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  if (s !== status) onChange(s)
                  setOpen(false)
                }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors ${
                  isActive ? 'bg-stone-200' : 'hover:bg-stone-hover'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${cfg.bgColor} ${isActive ? 'ring-1 ring-cream/35' : ''}`} />
                <span className={cfg.color}>{cfg.label}</span>
                {isActive && <span className="text-cream/45 ml-auto text-[10px]">Current</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** Category dropdown */
function CategoryDropdown({
  value,
  onChange,
  readOnly,
}: {
  value?: string
  onChange: (category: string | undefined) => void
  readOnly?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  if (readOnly) {
    if (!value) return null
    return <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-200 text-cream/55">{value}</span>
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
          value ? 'bg-stone-200 text-cream/55 hover:bg-stone-hover' : 'text-cream/30 hover:text-cream/45'
        }`}
      >
        {value || 'Category'}
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 min-w-[140px] rounded-lg border border-cream/15 bg-basalt shadow-xl py-1 max-h-[240px] overflow-y-auto">
          <button
            type="button"
            onClick={() => { onChange(undefined); setOpen(false) }}
            className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${!value ? 'text-sandstone' : 'text-cream/70 hover:bg-stone-hover'}`}
          >
            None
          </button>
          {CHANGE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => { onChange(cat); setOpen(false) }}
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${value === cat ? 'text-sandstone' : 'text-cream/70 hover:bg-stone-hover'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function ChangesSection({ api, commentCounts, focusEntryId }: ChangesSectionProps) {
  const { payload, readOnly, addChange, updateChange, deleteChange, addChangeAttachment } = api
  const { changes } = payload
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [newCategory, setNewCategory] = useState<ChangeCategory | ''>('')
  const [newRoom, setNewRoom] = useState('')
  const [newStatus, setNewStatus] = useState<ChangeLogStatus>('noted')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [uploadingChangeId, setUploadingChangeId] = useState<string | null>(null)
  const changeFileInputRef = useRef<HTMLInputElement>(null)
  const focusRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!focusEntryId) return
    const exists = changes.some((c) => c.id === focusEntryId)
    if (exists) {
      setExpandedId(focusEntryId)
      requestAnimationFrame(() => {
        focusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    }
  }, [focusEntryId, changes])

  function handleAdd() {
    if (!newTitle.trim()) return
    const storageStatus = CHANGE_LOG_STATUS_CONFIG[newStatus].storageStatus
    addChange({
      title: newTitle.trim(),
      description: newNotes.trim() || undefined,
      category: newCategory || undefined,
      room: newRoom.trim() || undefined,
      status: storageStatus,
    })
    setNewTitle('')
    setNewNotes('')
    setNewCategory('')
    setNewRoom('')
    setNewStatus('noted')
    setShowAddForm(false)
  }

  function handleCancelAdd() {
    setShowAddForm(false)
    setNewTitle('')
    setNewNotes('')
    setNewCategory('')
    setNewRoom('')
    setNewStatus('noted')
  }

  // Split into active vs superseded
  const activeChanges = changes.filter((c) => c.status !== 'closed')
  const supersededChanges = changes.filter((c) => c.status === 'closed')

  function renderChangeRow(change: typeof changes[0]) {
    const isExpanded = expandedId === change.id
    const commentCount = commentCounts?.get(change.id) || 0
    const logStatus = toChangeLogStatus(change.status)

    return (
      <div
        key={change.id}
        ref={change.id === focusEntryId ? focusRef : undefined}
        className={`rounded-lg bg-stone-50 border group ${
          change.id === focusEntryId ? 'border-sandstone/30 ring-1 ring-sandstone/20' : 'border-cream/12'
        }`}
      >
        {/* Header row — summary-first */}
        <div
          className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
          onClick={() => setExpandedId(isExpanded ? null : change.id)}
        >
          <svg
            className={`w-3 h-3 text-cream/45 transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <polyline points="9 18 15 12 9 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>

          <div className="flex-1 min-w-0">
            <span className="text-sm text-cream/80 truncate block">{change.title}</span>
            {/* Category + room — visible on all sizes */}
            {(change.category || change.room) && (
              <span className="text-[10px] text-cream/45 truncate block mt-0.5">
                {[change.category, change.room].filter(Boolean).join(' · ')}
              </span>
            )}
          </div>

          <div onClick={(e) => e.stopPropagation()}>
            <StatusDropdown
              status={logStatus}
              onChange={(s) => {
                const storageStatus = CHANGE_LOG_STATUS_CONFIG[s].storageStatus
                updateChange(change.id, { status: storageStatus })
              }}
              readOnly={readOnly}
            />
          </div>

          {change.cost_impact && (
            <span className="text-[10px] text-cream/60 shrink-0 hidden md:inline">{change.cost_impact}</span>
          )}

          {(change.attachments?.length || 0) > 0 && (
            <span className="text-[10px] text-cream/50 shrink-0 hidden md:flex items-center gap-0.5">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {change.attachments!.length}
            </span>
          )}

          {commentCount > 0 && (
            <span className="text-[10px] text-cream/50 shrink-0 hidden md:inline">
              {commentCount} comment{commentCount !== 1 ? 's' : ''}
            </span>
          )}

          {api.collectionId && (
            <Link
              href={`/app/tools/project-summary/${api.collectionId}/change/${change.id}`}
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 text-[10px] text-sandstone/40 hover:text-sandstone transition-colors md:opacity-0 md:group-hover:opacity-100"
            >
              Details →
            </Link>
          )}

          {!readOnly && (
            confirmDelete === change.id ? (
              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => { deleteChange(change.id); setConfirmDelete(null) }}
                  className="text-[10px] text-red-400/70 hover:text-red-400 transition-colors"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(null)}
                  className="text-[10px] text-cream/45 hover:text-cream/65 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setConfirmDelete(change.id) }}
                className="shrink-0 text-cream/30 hover:text-red-400/50 transition-colors opacity-0 group-hover:opacity-100"
                title="Delete entry"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )
          )}
        </div>

        {/* Expanded detail */}
        {isExpanded && (
          <div className="px-3 pb-3 pt-1 border-t border-cream/12 space-y-2">
            <div>
              <label className="text-[10px] text-cream/55 block mb-0.5">Notes</label>
              <InlineEdit
                value={change.description || ''}
                onSave={(v) => updateChange(change.id, { description: v || undefined })}
                placeholder="Add details about this change..."
                readOnly={readOnly}
                multiline
                displayClassName="text-xs text-cream/70"
                className="text-xs"
              />
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-cream/40">Category:</span>
                <div onClick={(e) => e.stopPropagation()}>
                  <CategoryDropdown
                    value={change.category as string | undefined}
                    onChange={(cat) => updateChange(change.id, { category: cat })}
                    readOnly={readOnly}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-cream/40">Room/Area:</span>
                <InlineEdit
                  value={(change.room as string) || ''}
                  onSave={(v) => updateChange(change.id, { room: v || undefined })}
                  placeholder="e.g. Kitchen"
                  readOnly={readOnly}
                  displayClassName="text-[10px] text-cream/55"
                  className="text-[10px]"
                />
              </div>
            </div>

            {(change.cost_impact || !readOnly) && (
              <div>
                <label className="text-[10px] text-cream/55 block mb-0.5">Cost Impact</label>
                <InlineEdit
                  value={change.cost_impact || ''}
                  onSave={(v) => updateChange(change.id, { cost_impact: v || undefined })}
                  placeholder="e.g. +$2,500 or TBD"
                  readOnly={readOnly}
                  displayClassName="text-xs text-cream/70"
                  className="text-xs"
                />
              </div>
            )}

            {(change.final_note || !readOnly) && (
              <div>
                <label className="text-[10px] text-cream/55 block mb-0.5">Additional Notes</label>
                <InlineEdit
                  value={change.final_note || ''}
                  onSave={(v) => updateChange(change.id, { final_note: v || undefined })}
                  placeholder="Any additional notes..."
                  readOnly={readOnly}
                  displayClassName="text-xs text-cream/55"
                  className="text-xs"
                />
              </div>
            )}

            {/* Attachments + inline upload */}
            {((change.attachments?.length || 0) > 0 || !readOnly) && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] text-cream/55">Attachments</span>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => {
                        setUploadingChangeId(change.id)
                        setTimeout(() => changeFileInputRef.current?.click(), 0)
                      }}
                      disabled={uploadingChangeId === change.id}
                      className="inline-flex items-center gap-1 text-[10px] text-cream/50 hover:text-cream/65 transition-colors disabled:opacity-50"
                    >
                      {uploadingChangeId === change.id ? (
                        <div className="w-2.5 h-2.5 border border-cream/20 border-t-cream/50 rounded-full animate-spin" />
                      ) : (
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                        </svg>
                      )}
                      {uploadingChangeId === change.id ? 'Uploading...' : 'Upload'}
                    </button>
                  )}
                </div>
                {(change.attachments || []).map((att) => (
                  <div key={att.id} className="flex items-center gap-1.5 text-[10px] text-cream/55 ml-1">
                    <svg className="w-2.5 h-2.5 text-cream/45 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="hover:text-cream/70 truncate">{att.label}</a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Hidden file input for inline change uploads */}
      <input
        ref={changeFileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.heic,.heif,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file || !uploadingChangeId) return
          try {
            const result = await uploadProjectSummaryFile(file)
            addChangeAttachment(uploadingChangeId, {
              type: 'file',
              url: result.url,
              label: file.name.replace(/\.[^.]+$/, ''),
              fileName: result.fileName,
              fileSize: result.fileSize,
              mimeType: result.mimeType,
              uploadedAt: new Date().toISOString(),
            })
          } catch {
            // silently fail for inline
          } finally {
            setUploadingChangeId(null)
            if (changeFileInputRef.current) changeFileInputRef.current.value = ''
          }
        }}
      />

      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-semibold text-cream/90">Change Log</h2>
          {changes.length > 0 && (
            <span className="text-[11px] text-cream/45 tabular-nums">{changes.length}</span>
          )}
        </div>
        {!readOnly && !showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-sandstone/80 hover:text-sandstone bg-sandstone/10 hover:bg-sandstone/15 transition-colors"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Log a Change
          </button>
        )}
      </div>

      {changes.length === 0 && !showAddForm && (
        <p className="text-sm text-cream/50">
          No changes logged yet. When something changes — a moved outlet, an updated plan, a new material choice — log it here so nothing gets lost.
        </p>
      )}

      {/* Active changes */}
      {activeChanges.length > 0 && (
        <div className="space-y-2">
          {activeChanges.map((change) => renderChangeRow(change))}
        </div>
      )}

      {/* Superseded — collapsed */}
      {supersededChanges.length > 0 && (
        <details>
          <summary className="text-[10px] text-cream/45 cursor-pointer hover:text-cream/55 transition-colors select-none">
            {supersededChanges.length} no longer needed
          </summary>
          <div className="mt-2 space-y-2">
            {supersededChanges.map((change) => renderChangeRow(change))}
          </div>
        </details>
      )}

      {/* Add form */}
      {showAddForm && !readOnly && (
        <div className="p-4 rounded-lg border border-cream/15 bg-stone-50 space-y-3">
          <div>
            <label className="text-[10px] text-cream/55 block mb-1">What changed?</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Moved kitchen outlet to island, Changed cabinet finish to white oak"
              className="w-full bg-stone-200 border border-cream/15 rounded-md px-3 py-2 text-sm text-cream/90 placeholder-cream/35 outline-none focus:border-sandstone/30"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleAdd(); if (e.key === 'Escape') handleCancelAdd() }}
            />
          </div>

          <div>
            <label className="text-[10px] text-cream/55 block mb-1">Notes (optional)</label>
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Any details, context, or reason for the change..."
              rows={2}
              className="w-full bg-stone-200 border border-cream/15 rounded-md px-3 py-2 text-xs text-cream/70 placeholder-cream/35 outline-none focus:border-sandstone/30 resize-none"
            />
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <label className="text-[10px] text-cream/55 block mb-1">Status</label>
              <StatusDropdown
                status={newStatus}
                onChange={(s) => setNewStatus(s)}
              />
            </div>
            <div>
              <label className="text-[10px] text-cream/55 block mb-1">Category</label>
              <div className="relative">
                <CategoryDropdown
                  value={newCategory || undefined}
                  onChange={(cat) => setNewCategory((cat as ChangeCategory) || '')}
                />
              </div>
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="text-[10px] text-cream/55 block mb-1">Room / Area</label>
              <input
                type="text"
                value={newRoom}
                onChange={(e) => setNewRoom(e.target.value)}
                placeholder="e.g. Kitchen, Master Bath"
                className="w-full bg-stone-200 border border-cream/15 rounded-md px-2 py-1.5 text-xs text-cream/70 placeholder-cream/35 outline-none focus:border-sandstone/30"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={handleCancelAdd}
              className="px-3 py-1.5 text-xs text-cream/55 hover:text-cream/70 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newTitle.trim()}
              className="px-3 py-1.5 text-xs bg-sandstone/20 text-sandstone hover:bg-sandstone/30 rounded-md transition-colors disabled:opacity-30"
            >
              Log Change
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
