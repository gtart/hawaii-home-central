'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
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

/** Status dropdown — 4 homeowner-friendly statuses */
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

type Tab = 'pending' | 'closed'

const PENDING_STATUSES = new Set(['requested', 'awaiting_homeowner'])
const ADDED_STATUSES = new Set(['approved_by_homeowner', 'accepted_by_contractor', 'done'])

export function ChangesSection({ api, commentCounts, focusEntryId }: ChangesSectionProps) {
  const { payload, readOnly, addChange, updateChange, deleteChange, addChangeAttachment } = api
  const { changes } = payload
  const [activeTab, setActiveTab] = useState<Tab>('pending')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [newCost, setNewCost] = useState('')
  const [newTimeline, setNewTimeline] = useState('')
  const [newStatus, setNewStatus] = useState<ChangeLogStatus>('noted')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [uploadingChangeId, setUploadingChangeId] = useState<string | null>(null)
  const [isUploadingNew, setIsUploadingNew] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const changeFileInputRef = useRef<HTMLInputElement>(null)
  const newChangeFileInputRef = useRef<HTMLInputElement>(null)
  const focusRef = useRef<HTMLDivElement>(null)
  const [newAttachments, setNewAttachments] = useState<Array<{ url: string; label: string; fileName: string; fileSize: number; mimeType: string }>>([])

  const pendingChanges = useMemo(
    () => changes
      .filter((c) => PENDING_STATUSES.has(c.status))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [changes]
  )

  const closedChanges = useMemo(
    () => changes
      .filter((c) => c.status === 'closed')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [changes]
  )

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
      status: storageStatus,
      cost_impact: newCost.trim() || undefined,
      schedule_impact: newTimeline.trim() || undefined,
    })
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
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploadingNew(false)
      if (newChangeFileInputRef.current) newChangeFileInputRef.current.value = ''
    }
  }

  const visibleChanges = activeTab === 'pending' ? pendingChanges : closedChanges

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
                <span className="text-[10px] text-cream/25 block mb-0.5">Change request</span>
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
                    <span className="text-[10px] text-cream/25">Est. end date:</span>
                    <InlineEdit
                      value={change.schedule_impact || ''}
                      onSave={(v) => updateChange(change.id, { schedule_impact: v || undefined })}
                      placeholder="e.g. June 2026"
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

  return (
    <div className="space-y-4">
      {/* Hidden file inputs */}
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
      <input
        ref={newChangeFileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.heic,.heif,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf"
        className="hidden"
        onChange={handleNewChangeFileUpload}
      />

      {/* Section header + tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1">
          <h2 className="text-xs font-semibold text-cream/50 uppercase tracking-wider mr-2">Changes pending your review</h2>
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded transition-colors ${
              activeTab === 'pending'
                ? 'text-cream/70 bg-cream/5'
                : 'text-cream/30 hover:text-cream/50'
            }`}
          >
            Pending
            {pendingChanges.length > 0 && (
              <span className="ml-1 text-[10px] font-normal tabular-nums">{pendingChanges.length}</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('closed')}
            className={`text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded transition-colors ${
              activeTab === 'closed'
                ? 'text-cream/70 bg-cream/5'
                : 'text-cream/30 hover:text-cream/50'
            }`}
          >
            No Longer Needed
            {closedChanges.length > 0 && (
              <span className="ml-1 text-[10px] font-normal tabular-nums">{closedChanges.length}</span>
            )}
          </button>
        </div>
      </div>

      {uploadError && (
        <p className="text-[11px] text-red-400/70">{uploadError}</p>
      )}

      {/* Add form */}
      {showAddForm && !readOnly && (
        <div className="p-4 rounded-lg border border-cream/12 bg-stone-50 space-y-3">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="What changed?"
            className="w-full bg-stone-200 border border-cream/12 rounded-md px-3 py-2.5 text-sm text-cream/90 placeholder-cream/30 outline-none focus:border-sandstone/30"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleAdd(); if (e.key === 'Escape') resetAddForm() }}
          />
          <div>
            <span className="text-[10px] text-cream/25 block mb-0.5">Change request</span>
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              rows={2}
              className="w-full bg-stone-200 border border-cream/12 rounded-md px-3 py-2 text-xs text-cream/65 placeholder-cream/30 outline-none focus:border-sandstone/30 resize-none"
            />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div onClick={(e) => e.stopPropagation()}>
              <StatusDropdown status={newStatus} onChange={(s) => setNewStatus(s)} />
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-cream/25">Cost:</span>
              <input type="text" value={newCost} onChange={(e) => setNewCost(e.target.value)} placeholder="e.g. +$2,500" className="bg-stone-200 border border-cream/12 rounded-md px-2 py-1 text-xs text-cream/60 placeholder-cream/30 outline-none focus:border-sandstone/30 w-28" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-cream/25">Est. end date:</span>
              <input type="text" value={newTimeline} onChange={(e) => setNewTimeline(e.target.value)} placeholder="e.g. June 2026" className="bg-stone-200 border border-cream/12 rounded-md px-2 py-1 text-xs text-cream/60 placeholder-cream/30 outline-none focus:border-sandstone/30 w-28" />
            </div>
          </div>
          <div className="flex items-start gap-2 flex-wrap">
            {newAttachments.map((att, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-[10px] text-cream/45 bg-stone-200 px-2 py-1 rounded">
                <svg className="w-2.5 h-2.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="truncate max-w-[120px]">{att.label}</span>
                <button type="button" onClick={() => setNewAttachments((prev) => prev.filter((_, idx) => idx !== i))} className="text-cream/30 hover:text-cream/50 transition-colors ml-0.5">
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </span>
            ))}
            <button type="button" onClick={() => newChangeFileInputRef.current?.click()} disabled={isUploadingNew} className="inline-flex items-center gap-1.5 text-[10px] text-cream/30 hover:text-cream/50 bg-stone-200 hover:bg-stone-hover px-2 py-1 rounded transition-colors disabled:opacity-50">
              {isUploadingNew ? <div className="w-3 h-3 border border-cream/20 border-t-cream/50 rounded-full animate-spin" /> : <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>}
              {isUploadingNew ? 'Uploading...' : 'Attach file'}
            </button>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={resetAddForm} className="px-3 py-1.5 text-xs text-cream/45 hover:text-cream/60 transition-colors">Cancel</button>
            <button type="button" onClick={handleAdd} disabled={!newTitle.trim() || isUploadingNew} className="px-4 py-1.5 text-xs bg-sandstone/15 text-sandstone hover:bg-sandstone/25 rounded-md transition-colors disabled:opacity-30">{isUploadingNew ? 'Uploading...' : 'Add'}</button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {visibleChanges.length === 0 && !showAddForm && (
        <div className="rounded-lg border border-dashed border-cream/12 px-4 py-6 text-center">
          {activeTab === 'pending' ? (
            <>
              <p className="text-sm text-cream/45 mb-1">No pending changes</p>
              <p className="text-xs text-cream/30">When something changes — a moved outlet, a new material, an updated plan — log it here.</p>
            </>
          ) : (
            <p className="text-sm text-cream/45">No closed changes</p>
          )}
        </div>
      )}

      {/* Changes list */}
      {visibleChanges.length > 0 && (
        <div className="space-y-1.5">
          {visibleChanges.map((change) => renderCollapsedRow(change))}
        </div>
      )}
    </div>
  )
}
