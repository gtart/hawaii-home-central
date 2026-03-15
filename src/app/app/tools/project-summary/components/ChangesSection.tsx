'use client'

import { useState, useEffect, useRef } from 'react'
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
    return <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-200 text-cream/45">{value}</span>
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
          value ? 'bg-stone-200 text-cream/45 hover:bg-stone-hover' : 'text-cream/25 hover:text-cream/40'
        }`}
      >
        {value || '+ Category'}
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 min-w-[140px] rounded-lg border border-cream/12 bg-basalt shadow-xl py-1 max-h-[240px] overflow-y-auto">
          <button
            type="button"
            onClick={() => { onChange(undefined); setOpen(false) }}
            className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${!value ? 'text-sandstone' : 'text-cream/60 hover:bg-stone-hover'}`}
          >
            None
          </button>
          {CHANGE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => { onChange(cat); setOpen(false) }}
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${value === cat ? 'text-sandstone' : 'text-cream/60 hover:bg-stone-hover'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

type WorkflowGroup = 'needs_followup' | 'resolved' | 'no_longer_needed'

function getWorkflowGroup(logStatus: ChangeLogStatus): WorkflowGroup {
  switch (logStatus) {
    case 'noted':
    case 'needs_confirmation':
      return 'needs_followup'
    case 'confirmed':
    case 'completed':
      return 'resolved'
    case 'superseded':
      return 'no_longer_needed'
  }
}

/** Format cost display — prefix with $ if the user hasn't included a currency symbol */
function formatCostDisplay(cost: string): string {
  const trimmed = cost.trim()
  if (!trimmed) return ''
  // If already starts with $, +$, -$, or other currency symbols, leave it
  if (/^[+\-]?\s*[$€£¥]/.test(trimmed) || /^[$€£¥]/.test(trimmed)) return trimmed
  // If it's just a number or +/- number, prefix with $
  if (/^[+\-]?\s*[\d,.]/.test(trimmed)) return `$${trimmed}`
  return trimmed
}

export function ChangesSection({ api, commentCounts, focusEntryId }: ChangesSectionProps) {
  const { payload, readOnly, addChange, updateChange, deleteChange, addChangeAttachment } = api
  const { changes } = payload
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [newCategory, setNewCategory] = useState<ChangeCategory | ''>('')
  const [newRoom, setNewRoom] = useState('')
  const [newCost, setNewCost] = useState('')
  const [newTimeline, setNewTimeline] = useState('')
  const [newStatus, setNewStatus] = useState<ChangeLogStatus>('noted')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [uploadingChangeId, setUploadingChangeId] = useState<string | null>(null)
  const [isUploadingNew, setIsUploadingNew] = useState(false)
  const changeFileInputRef = useRef<HTMLInputElement>(null)
  const newChangeFileInputRef = useRef<HTMLInputElement>(null)
  const focusRef = useRef<HTMLDivElement>(null)
  // Track pending attachment for new change (before it's created)
  const [newAttachments, setNewAttachments] = useState<Array<{ url: string; label: string; fileName: string; fileSize: number; mimeType: string }>>([])

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
    if (!newTitle.trim() || isUploadingNew) return
    const storageStatus = CHANGE_LOG_STATUS_CONFIG[newStatus].storageStatus
    const changeId = addChange({
      title: newTitle.trim(),
      description: newNotes.trim() || undefined,
      category: newCategory || undefined,
      room: newRoom.trim() || undefined,
      status: storageStatus,
      cost_impact: newCost.trim() || undefined,
      schedule_impact: newTimeline.trim() || undefined,
    })
    // Attach any uploaded files to the new change
    if (changeId && newAttachments.length > 0) {
      for (const att of newAttachments) {
        addChangeAttachment(changeId, {
          type: 'file',
          url: att.url,
          label: att.label,
          fileName: att.fileName,
          fileSize: att.fileSize,
          mimeType: att.mimeType,
          uploadedAt: new Date().toISOString(),
        })
      }
    }
    resetAddForm()
  }

  function resetAddForm() {
    setShowAddForm(false)
    setNewTitle('')
    setNewNotes('')
    setNewCategory('')
    setNewRoom('')
    setNewCost('')
    setNewTimeline('')
    setNewStatus('noted')
    setNewAttachments([])
  }

  async function handleNewChangeFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingNew(true)
    try {
      const result = await uploadProjectSummaryFile(file)
      setNewAttachments((prev) => [...prev, {
        url: result.url,
        label: file.name.replace(/\.[^.]+$/, ''),
        fileName: result.fileName,
        fileSize: result.fileSize,
        mimeType: result.mimeType,
      }])
    } catch {
      // silently fail
    } finally {
      setIsUploadingNew(false)
      if (newChangeFileInputRef.current) newChangeFileInputRef.current.value = ''
    }
  }

  // Group changes by workflow state
  const grouped = {
    needs_followup: [] as typeof changes,
    resolved: [] as typeof changes,
    no_longer_needed: [] as typeof changes,
  }
  for (const change of changes) {
    const logStatus = toChangeLogStatus(change.status)
    const group = getWorkflowGroup(logStatus)
    grouped[group].push(change)
  }

  function renderCollapsedRow(change: typeof changes[0]) {
    const isExpanded = expandedId === change.id
    const commentCount = commentCounts?.get(change.id) || 0
    const logStatus = toChangeLogStatus(change.status)

    return (
      <div
        key={change.id}
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

          {/* Cost impact — always visible if present, with $ formatting */}
          {change.cost_impact && (
            <span className="text-[10px] text-cream/45 shrink-0 tabular-nums">{formatCostDisplay(change.cost_impact)}</span>
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

          {/* Indicators — visible on all sizes */}
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
              {/* Description */}
              <div>
                <InlineEdit
                  value={change.description || ''}
                  onSave={(v) => updateChange(change.id, { description: v || undefined })}
                  placeholder="What happened and why..."
                  readOnly={readOnly}
                  multiline
                  displayClassName="text-sm text-cream/65 leading-relaxed"
                  className="text-sm leading-relaxed"
                />
              </div>

              {/* Metadata row: category, room, cost, timeline */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <CategoryDropdown
                    value={change.category as string | undefined}
                    onChange={(cat) => updateChange(change.id, { category: cat })}
                    readOnly={readOnly}
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-cream/25">Area:</span>
                  <InlineEdit
                    value={(change.room as string) || ''}
                    onSave={(v) => updateChange(change.id, { room: v || undefined })}
                    placeholder="e.g. Kitchen"
                    readOnly={readOnly}
                    displayClassName="text-[10px] text-cream/45"
                    className="text-[10px]"
                  />
                </div>
                {(change.cost_impact || !readOnly) && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-cream/25">Cost:</span>
                    <InlineEdit
                      value={change.cost_impact || ''}
                      onSave={(v) => updateChange(change.id, { cost_impact: v || undefined })}
                      placeholder="e.g. +$2,500"
                      readOnly={readOnly}
                      displayClassName="text-[10px] text-cream/45 tabular-nums"
                      className="text-[10px]"
                    />
                  </div>
                )}
                {(change.schedule_impact || !readOnly) && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-cream/25">Timeline:</span>
                    <InlineEdit
                      value={change.schedule_impact || ''}
                      onSave={(v) => updateChange(change.id, { schedule_impact: v || undefined })}
                      placeholder="e.g. +2 weeks"
                      readOnly={readOnly}
                      displayClassName="text-[10px] text-cream/45"
                      className="text-[10px]"
                    />
                  </div>
                )}
              </div>

              {/* Additional notes */}
              {(change.final_note || !readOnly) && (
                <div>
                  <InlineEdit
                    value={change.final_note || ''}
                    onSave={(v) => updateChange(change.id, { final_note: v || undefined })}
                    placeholder="Additional notes..."
                    readOnly={readOnly}
                    displayClassName="text-xs text-cream/45 italic"
                    className="text-xs"
                  />
                </div>
              )}

              {/* Attachments */}
              {((change.attachments?.length || 0) > 0 || !readOnly) && (
                <div className="flex items-start gap-2 flex-wrap">
                  {(change.attachments || []).map((att) => (
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
            </div>

            {/* Bottom actions row */}
            <div className="flex items-center justify-end mt-3 pt-2 border-t border-cream/6">
              {!readOnly && (
                confirmDelete === change.id ? (
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => { deleteChange(change.id); setConfirmDelete(null) }}
                      className="text-[10px] text-red-400/70 hover:text-red-400 transition-colors"
                    >
                      Confirm delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(null)}
                      className="text-[10px] text-cream/35 hover:text-cream/50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(change.id) }}
                    className="text-[10px] text-cream/20 hover:text-red-400/50 transition-colors"
                    title="Delete"
                  >
                    Delete
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  const hasAnyChanges = changes.length > 0

  return (
    <div className="space-y-6">
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

      {/* Hidden file input for new change form uploads */}
      <input
        ref={newChangeFileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.heic,.heif,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf"
        className="hidden"
        onChange={handleNewChangeFileUpload}
      />

      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-cream/50 uppercase tracking-wider">Changes</h2>
        {!readOnly && !showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-sandstone/70 hover:text-sandstone bg-sandstone/8 hover:bg-sandstone/12 transition-colors"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Add Change
          </button>
        )}
      </div>

      {/* Empty state */}
      {!hasAnyChanges && !showAddForm && (
        <div className="rounded-lg border border-dashed border-cream/12 px-4 py-6 text-center">
          <p className="text-sm text-cream/45 mb-1">No changes yet</p>
          <p className="text-xs text-cream/30">When something changes — a moved outlet, a new material, an updated plan — log it here.</p>
        </div>
      )}

      {/* Add form — matches expanded card fields */}
      {showAddForm && !readOnly && (
        <div className="p-4 rounded-lg border border-cream/12 bg-stone-50 space-y-3">
          {/* Title */}
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="What changed?"
            className="w-full bg-stone-200 border border-cream/12 rounded-md px-3 py-2.5 text-sm text-cream/90 placeholder-cream/30 outline-none focus:border-sandstone/30"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleAdd(); if (e.key === 'Escape') resetAddForm() }}
          />

          {/* Description */}
          <textarea
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            placeholder="What happened and why..."
            rows={2}
            className="w-full bg-stone-200 border border-cream/12 rounded-md px-3 py-2 text-xs text-cream/65 placeholder-cream/30 outline-none focus:border-sandstone/30 resize-none"
          />

          {/* Metadata row: status, category, room */}
          <div className="flex items-center gap-3 flex-wrap">
            <div onClick={(e) => e.stopPropagation()}>
              <StatusDropdown
                status={newStatus}
                onChange={(s) => setNewStatus(s)}
              />
            </div>
            <CategoryDropdown
              value={newCategory || undefined}
              onChange={(cat) => setNewCategory((cat as ChangeCategory) || '')}
            />
            <input
              type="text"
              value={newRoom}
              onChange={(e) => setNewRoom(e.target.value)}
              placeholder="Room / Area"
              className="bg-stone-200 border border-cream/12 rounded-md px-2 py-1 text-xs text-cream/60 placeholder-cream/30 outline-none focus:border-sandstone/30 w-32"
            />
          </div>

          {/* Cost + Timeline row */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-cream/25">Cost:</span>
              <input
                type="text"
                value={newCost}
                onChange={(e) => setNewCost(e.target.value)}
                placeholder="e.g. +$2,500"
                className="bg-stone-200 border border-cream/12 rounded-md px-2 py-1 text-xs text-cream/60 placeholder-cream/30 outline-none focus:border-sandstone/30 w-28"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-cream/25">Timeline:</span>
              <input
                type="text"
                value={newTimeline}
                onChange={(e) => setNewTimeline(e.target.value)}
                placeholder="e.g. +2 weeks"
                className="bg-stone-200 border border-cream/12 rounded-md px-2 py-1 text-xs text-cream/60 placeholder-cream/30 outline-none focus:border-sandstone/30 w-28"
              />
            </div>
          </div>

          {/* File attachments */}
          <div className="flex items-start gap-2 flex-wrap">
            {newAttachments.map((att, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-[10px] text-cream/45 bg-stone-200 px-2 py-1 rounded"
              >
                <svg className="w-2.5 h-2.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="truncate max-w-[120px]">{att.label}</span>
                <button
                  type="button"
                  onClick={() => setNewAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-cream/30 hover:text-cream/50 transition-colors ml-0.5"
                >
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={() => newChangeFileInputRef.current?.click()}
              disabled={isUploadingNew}
              className="inline-flex items-center gap-1.5 text-[10px] text-cream/30 hover:text-cream/50 bg-stone-200 hover:bg-stone-hover px-2 py-1 rounded transition-colors disabled:opacity-50"
            >
              {isUploadingNew ? (
                <div className="w-3 h-3 border border-cream/20 border-t-cream/50 rounded-full animate-spin" />
              ) : (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
              )}
              {isUploadingNew ? 'Uploading...' : 'Attach file'}
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={resetAddForm}
              className="px-3 py-1.5 text-xs text-cream/45 hover:text-cream/60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newTitle.trim() || isUploadingNew}
              className="px-4 py-1.5 text-xs bg-sandstone/15 text-sandstone hover:bg-sandstone/25 rounded-md transition-colors disabled:opacity-30"
            >
              {isUploadingNew ? 'Uploading...' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {/* Changes — grouped by state, no "Needs Follow-Up" label */}
      {grouped.needs_followup.length > 0 && (
        <div className="space-y-1.5">
          {grouped.needs_followup.map((change) => renderCollapsedRow(change))}
        </div>
      )}

      {/* Resolved group */}
      {grouped.resolved.length > 0 && (
        <div className="space-y-1.5">
          {hasAnyChanges && grouped.needs_followup.length > 0 && (
            <h3 className="text-[10px] text-emerald-400/60 uppercase tracking-wider font-medium mb-2">Resolved</h3>
          )}
          {grouped.resolved.map((change) => renderCollapsedRow(change))}
        </div>
      )}

      {/* No Longer Needed group — collapsed */}
      {grouped.no_longer_needed.length > 0 && (
        <details>
          <summary className="text-[10px] text-cream/25 cursor-pointer hover:text-cream/40 transition-colors select-none">
            {grouped.no_longer_needed.length} no longer needed
          </summary>
          <div className="mt-2 space-y-1.5">
            {grouped.no_longer_needed.map((change) => renderCollapsedRow(change))}
          </div>
        </details>
      )}
    </div>
  )
}
