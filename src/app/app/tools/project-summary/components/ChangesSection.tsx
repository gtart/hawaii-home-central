'use client'

import { useState, useEffect, useRef, useMemo, forwardRef, useImperativeHandle } from 'react'
import { CHANGE_LOG_STATUS_CONFIG, CHANGE_LOG_STATUS_ORDER, toChangeLogStatus } from '../constants'
import type { ChangeLogStatus } from '../constants'
import type { ProjectSummaryStateAPI } from '../useProjectSummaryState'
import { InlineEdit } from './InlineEdit'
import { StatusBadge } from './StatusBadge'
import { uploadProjectSummaryFile } from '../uploadProjectSummaryFile'

interface ChangesSectionProps {
  api: ProjectSummaryStateAPI
  commentCounts?: Map<string, number>
  focusEntryId?: string
}

export interface ChangesSectionHandle {
  scrollToAndAdd: () => void
  scrollToChange: (id: string) => void
}

/** Status dropdown — 3 homeowner-friendly statuses */
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
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[180px] rounded-lg border border-cream/12 bg-basalt shadow-xl py-1">
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
                {isActive && <span className="text-cream/35 ml-auto text-[10px]">Current</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** Format cost display — prefix with $ if the user hasn't included a currency symbol */
function formatCostDisplay(cost: string): string {
  const trimmed = cost.trim()
  if (!trimmed) return ''
  if (/^[+\-]?\s*[$€£¥]/.test(trimmed) || /^[$€£¥]/.test(trimmed)) return trimmed
  if (/^[+\-]?\s*[\d,.]/.test(trimmed)) return `$${trimmed}`
  return trimmed
}

export const ChangesSection = forwardRef<ChangesSectionHandle, ChangesSectionProps>(
  function ChangesSection({ api, commentCounts, focusEntryId }, ref) {
  const { payload, readOnly, addChange, updateChange, deleteChange, addChangeAttachment } = api
  const { changes } = payload
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [uploadingChangeId, setUploadingChangeId] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newCost, setNewCost] = useState('')
  const [newTimeline, setNewTimeline] = useState('')
  const changeFileInputRef = useRef<HTMLInputElement>(null)
  const focusRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLDivElement>(null)
  const addFormRef = useRef<HTMLInputElement>(null)

  // All changes sorted newest first
  const allChanges = useMemo(
    () => [...changes].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [changes]
  )

  useImperativeHandle(ref, () => ({
    scrollToAndAdd() {
      setShowAddForm(true)
      requestAnimationFrame(() => {
        sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setTimeout(() => addFormRef.current?.focus(), 400)
      })
    },
    scrollToChange(id: string) {
      setExpandedId(id)
      requestAnimationFrame(() => {
        const el = document.getElementById(`change-row-${id}`)
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    },
  }))

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
    addChange({
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      status: 'requested',
      cost_impact: newCost.trim() || undefined,
      schedule_impact: newTimeline.trim() || undefined,
    })
    setNewTitle('')
    setNewDescription('')
    setNewCost('')
    setNewTimeline('')
    setShowAddForm(false)
  }

  function renderCollapsedRow(change: typeof changes[0]) {
    const isExpanded = expandedId === change.id
    const commentCount = commentCounts?.get(change.id) || 0
    const logStatus = toChangeLogStatus(change.status)

    return (
      <div
        key={change.id}
        id={`change-row-${change.id}`}
        ref={change.id === focusEntryId ? focusRef : undefined}
        className={`rounded-lg border transition-colors ${
          change.id === focusEntryId
            ? 'border-sandstone/30 ring-1 ring-sandstone/15 bg-stone-50'
            : isExpanded
              ? 'border-cream/12 bg-stone-50'
              : 'border-transparent hover:border-cream/8 bg-stone-50/60 hover:bg-stone-50'
        }`}
      >
        {/* Collapsed header */}
        <div
          className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer"
          onClick={() => setExpandedId(isExpanded ? null : change.id)}
        >
          <svg
            className={`w-3 h-3 text-cream/30 transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <polyline points="9 18 15 12 9 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>

          <div className="flex-1 min-w-0">
            <span className="text-sm text-cream/80 truncate block leading-snug">{change.title}</span>
          </div>

          {change.cost_impact && (
            <span className="text-[10px] text-cream/50 shrink-0 tabular-nums">{formatCostDisplay(change.cost_impact)}</span>
          )}

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

          {(change.attachments?.length || 0) > 0 && (
            <span className="text-cream/30 shrink-0">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          )}

          {commentCount > 0 && (
            <span className="text-[10px] text-cream/30 shrink-0 tabular-nums">
              {commentCount}
            </span>
          )}
        </div>

        {/* Expanded detail card */}
        {isExpanded && (
          <div className="px-3 pb-3 border-t border-cream/8">
            <div className="pt-3 space-y-3">
              {/* Change request */}
              <div>
                <span className="text-[10px] text-cream/40 block mb-0.5">Change request</span>
                <InlineEdit
                  value={change.description || ''}
                  onSave={(v) => updateChange(change.id, { description: v || undefined })}
                  readOnly={readOnly}
                  multiline
                  displayClassName="text-sm text-cream/65 leading-relaxed"
                  className="text-sm leading-relaxed"
                />
              </div>

              {/* Metadata row: cost, timeline */}
              <div className="flex items-center gap-4 flex-wrap">
                {(change.cost_impact || !readOnly) && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-cream/40">Cost:</span>
                    <InlineEdit
                      value={change.cost_impact || ''}
                      onSave={(v) => updateChange(change.id, { cost_impact: v || undefined })}
                      placeholder="e.g. +$2,500"
                      readOnly={readOnly}
                      displayClassName="text-[10px] text-cream/50 tabular-nums"
                      className="text-[10px]"
                    />
                  </div>
                )}
                {(change.schedule_impact || !readOnly) && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-cream/40">Est. end date:</span>
                    <InlineEdit
                      value={change.schedule_impact || ''}
                      onSave={(v) => updateChange(change.id, { schedule_impact: v || undefined })}
                      placeholder="e.g. June 2026"
                      readOnly={readOnly}
                      displayClassName="text-[10px] text-cream/50"
                      className="text-[10px]"
                    />
                  </div>
                )}
              </div>

              {/* Attachments */}
              {((change.attachments?.length || 0) > 0 || !readOnly) && (
                <div className="flex items-start gap-2 flex-wrap">
                  {(change.attachments || []).map((att) => (
                    att.url ? (
                      <a
                        key={att.id}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-cream/45 hover:text-cream/60 bg-stone-200 px-2 py-1 rounded transition-colors"
                      >
                        <svg className="w-2.5 h-2.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="truncate max-w-[120px]">{att.label}</span>
                      </a>
                    ) : (
                      <span
                        key={att.id}
                        className="inline-flex items-center gap-1 text-[10px] text-cream/45 bg-stone-200 px-2 py-1 rounded"
                      >
                        <svg className="w-2.5 h-2.5 shrink-0 text-sandstone/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="truncate max-w-[120px]">{att.label}</span>
                      </span>
                    )
                  ))}
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => {
                        setUploadingChangeId(change.id)
                        setTimeout(() => changeFileInputRef.current?.click(), 0)
                      }}
                      disabled={uploadingChangeId === change.id}
                      className="inline-flex items-center gap-1 text-[10px] text-cream/30 hover:text-cream/50 bg-stone-200 px-2 py-1 rounded transition-colors disabled:opacity-50"
                    >
                      {uploadingChangeId === change.id ? (
                        <div className="w-2.5 h-2.5 border border-cream/20 border-t-cream/50 rounded-full animate-spin" />
                      ) : (
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                        </svg>
                      )}
                      {uploadingChangeId === change.id ? 'Uploading...' : 'Attach file'}
                    </button>
                  )}
                </div>
              )}

              {/* Metadata footer */}
              <div className="flex items-center justify-between pt-2 border-t border-cream/6 text-[10px] text-cream/30">
                <span>
                  Created {new Date(change.created_at).toLocaleDateString()}
                  {change.created_by && ` by ${change.created_by}`}
                  {change.updated_at !== change.created_at && (
                    <> · Modified {new Date(change.updated_at).toLocaleDateString()}
                      {change.updated_by && ` by ${change.updated_by}`}
                    </>
                  )}
                </span>
                {!readOnly && (
                  confirmDelete === change.id ? (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button type="button" onClick={() => { deleteChange(change.id); setConfirmDelete(null) }} className="text-red-400/70 hover:text-red-400 transition-colors">Confirm delete</button>
                      <button type="button" onClick={() => setConfirmDelete(null)} className="text-cream/35 hover:text-cream/50 transition-colors">Cancel</button>
                    </div>
                  ) : (
                    <button type="button" onClick={(e) => { e.stopPropagation(); setConfirmDelete(change.id) }} className="text-cream/20 hover:text-red-400/50 transition-colors">Delete</button>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div ref={sectionRef} className="space-y-4">
      {/* Hidden file input */}
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
          } catch (err) {
            setUploadError(err instanceof Error ? err.message : 'Upload failed')
          } finally {
            setUploadingChangeId(null)
            if (changeFileInputRef.current) changeFileInputRef.current.value = ''
          }
        }}
      />

      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-cream/65 uppercase tracking-wider">Change Log</h2>
        {!readOnly && (
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-sandstone/70 hover:text-sandstone bg-sandstone/8 hover:bg-sandstone/12 transition-colors"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Add a change
          </button>
        )}
      </div>

      {uploadError && (
        <p className="text-[11px] text-red-400/70">{uploadError}</p>
      )}

      {/* Add form */}
      {showAddForm && !readOnly && (
        <div className="p-4 rounded-lg border border-cream/12 bg-stone-50 space-y-3">
          <input
            ref={addFormRef}
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="What changed?"
            className="w-full bg-stone-200 border border-cream/12 rounded-md px-3 py-2.5 text-sm text-cream/90 placeholder-cream/35 outline-none focus:border-sandstone/30"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleAdd(); if (e.key === 'Escape') setShowAddForm(false) }}
          />
          <div>
            <span className="text-[10px] text-cream/40 block mb-0.5">Change request</span>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={2}
              className="w-full bg-stone-200 border border-cream/12 rounded-md px-3 py-2 text-xs text-cream/75 placeholder-cream/35 outline-none focus:border-sandstone/30 resize-none"
            />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-cream/40">Cost:</span>
              <input type="text" value={newCost} onChange={(e) => setNewCost(e.target.value)} placeholder="e.g. +$2,500" className="bg-stone-200 border border-cream/12 rounded-md px-2 py-1 text-xs text-cream/75 placeholder-cream/35 outline-none focus:border-sandstone/30 w-28" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-cream/40">Est. end date:</span>
              <input type="text" value={newTimeline} onChange={(e) => setNewTimeline(e.target.value)} placeholder="e.g. June 2026" className="bg-stone-200 border border-cream/12 rounded-md px-2 py-1 text-xs text-cream/75 placeholder-cream/35 outline-none focus:border-sandstone/30 w-28" />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={() => setShowAddForm(false)} className="px-3 py-1.5 text-xs text-cream/45 hover:text-cream/60 transition-colors">Cancel</button>
            <button type="button" onClick={handleAdd} disabled={!newTitle.trim()} className="px-4 py-1.5 text-xs bg-sandstone/15 text-sandstone hover:bg-sandstone/25 rounded-md transition-colors disabled:opacity-30">Add</button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {allChanges.length === 0 && !showAddForm && (
        <div className="rounded-lg border border-dashed border-cream/12 px-4 py-6 text-center">
          <p className="text-sm text-cream/55 mb-1">No changes yet</p>
          <p className="text-xs text-cream/40">When something changes — a moved outlet, a new material, an updated plan — log it here.</p>
        </div>
      )}

      {/* Changes list */}
      {allChanges.length > 0 && (
        <div className="space-y-1.5">
          {allChanges.map((change) => renderCollapsedRow(change))}
        </div>
      )}
    </div>
  )
})
