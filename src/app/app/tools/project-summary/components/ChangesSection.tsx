'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { SIMPLE_STATUS_CONFIG, SIMPLE_STATUS_ORDER, toSimpleStatus } from '../constants'
import type { SimpleChangeStatus } from '../constants'
import type { ProjectSummaryStateAPI } from '../useProjectSummaryState'
import type { PrefillDraft } from '../ToolContent'
import { InlineEdit } from './InlineEdit'
import { StatusBadge } from './StatusBadge'
import { uploadProjectSummaryFile } from '../uploadProjectSummaryFile'

interface ChangesSectionProps {
  api: ProjectSummaryStateAPI
  commentCounts?: Map<string, number>
  prefillDraft?: PrefillDraft | null
  onDraftConsumed?: () => void
  focusEntryId?: string
}

/** Simplified status dropdown — 3 statuses for v1 self-tracking */
function StatusDropdown({
  status,
  onChange,
  readOnly,
}: {
  status: SimpleChangeStatus
  onChange: (status: SimpleChangeStatus) => void
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

  const config = SIMPLE_STATUS_CONFIG[status]

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
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[150px] rounded-lg border border-cream/15 bg-basalt shadow-xl py-1">
          {SIMPLE_STATUS_ORDER.map((s) => {
            const cfg = SIMPLE_STATUS_CONFIG[s]
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

/** Cost impact selector — None / Yes, amount known / Yes, amount TBD */
function CostImpactField({
  value,
  onSave,
  readOnly,
}: {
  value: string | undefined
  onSave: (v: string | undefined) => void
  readOnly?: boolean
}) {
  const [mode, setMode] = useState<'none' | 'known' | 'tbd'>(
    value === 'TBD' ? 'tbd' : value ? 'known' : 'none'
  )

  if (readOnly) {
    if (!value) return <span className="text-xs text-cream/50">No cost impact</span>
    return <span className="text-xs text-cream/70">{value}</span>
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => { setMode('none'); onSave(undefined) }}
          className={`text-[10px] px-2 py-1 rounded transition-colors ${
            mode === 'none' ? 'bg-cream/15 text-cream/80' : 'text-cream/40 hover:text-cream/55'
          }`}
        >
          None
        </button>
        <button
          type="button"
          onClick={() => { setMode('known') }}
          className={`text-[10px] px-2 py-1 rounded transition-colors ${
            mode === 'known' ? 'bg-cream/15 text-cream/80' : 'text-cream/40 hover:text-cream/55'
          }`}
        >
          Yes, amount known
        </button>
        <button
          type="button"
          onClick={() => { setMode('tbd'); onSave('TBD') }}
          className={`text-[10px] px-2 py-1 rounded transition-colors ${
            mode === 'tbd' ? 'bg-cream/15 text-cream/80' : 'text-cream/40 hover:text-cream/55'
          }`}
        >
          Yes, TBD
        </button>
      </div>
      {mode === 'known' && (
        <InlineEdit
          value={value === 'TBD' ? '' : (value || '')}
          onSave={(v) => onSave(v || undefined)}
          placeholder="e.g. +$2,500"
          displayClassName="text-xs text-cream/70"
          className="text-xs"
        />
      )}
    </div>
  )
}

export function ChangesSection({ api, commentCounts, prefillDraft, onDraftConsumed, focusEntryId }: ChangesSectionProps) {
  const { payload, readOnly, addChange, updateChange, deleteChange, incorporateChange, addChangeAttachment } = api
  const { changes } = payload
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newRationale, setNewRationale] = useState('')
  const [newCostMode, setNewCostMode] = useState<'none' | 'known' | 'tbd'>('none')
  const [newCostAmount, setNewCostAmount] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [uploadingChangeId, setUploadingChangeId] = useState<string | null>(null)
  const changeFileInputRef = useRef<HTMLInputElement>(null)
  const [incorporatingChangeId, setIncorporatingChangeId] = useState<string | null>(null)
  const focusRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!prefillDraft) return
    setNewTitle(prefillDraft.title)
    setNewRationale(prefillDraft.description)
    setShowAddForm(true)
  }, [prefillDraft])

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
    const costImpact = newCostMode === 'tbd' ? 'TBD' : newCostMode === 'known' && newCostAmount.trim() ? newCostAmount.trim() : undefined
    addChange({
      title: newTitle.trim(),
      rationale: newRationale.trim() || undefined,
      cost_impact: costImpact,
    })
    setNewTitle('')
    setNewRationale('')
    setNewCostMode('none')
    setNewCostAmount('')
    setShowAddForm(false)
    onDraftConsumed?.()
  }

  function handleCancelAdd() {
    setShowAddForm(false)
    setNewTitle('')
    setNewRationale('')
    setNewCostMode('none')
    setNewCostAmount('')
    if (prefillDraft) onDraftConsumed?.()
  }

  // Split into active vs canceled
  const activeChanges = changes.filter((c) => c.status !== 'closed')
  const canceledChanges = changes.filter((c) => c.status === 'closed')

  function renderChangeRow(change: typeof changes[0]) {
    const isExpanded = expandedId === change.id
    const commentCount = commentCounts?.get(change.id) || 0
    const simpleStatus = toSimpleStatus(change.status)
    const canIncorporate = (change.status === 'accepted_by_contractor' || change.status === 'done') && !change.incorporated

    return (
      <div
        key={change.id}
        ref={change.id === focusEntryId ? focusRef : undefined}
        className={`rounded-lg bg-stone-50 border group ${
          change.id === focusEntryId ? 'border-sandstone/30 ring-1 ring-sandstone/20' : 'border-cream/12'
        }`}
      >
        {/* Header row */}
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

          <span className="text-sm text-cream/80 flex-1 truncate">{change.title}</span>

          {change.incorporated && (
            <span className="text-[9px] text-teal-400/50 bg-teal-400/5 px-1.5 py-0.5 rounded-full shrink-0 hidden md:inline-flex">
              In Plan
            </span>
          )}

          <div onClick={(e) => e.stopPropagation()}>
            <StatusDropdown
              status={simpleStatus}
              onChange={(s) => {
                const storageStatus = SIMPLE_STATUS_CONFIG[s].storageStatus
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
                title="Delete change order"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )
          )}
        </div>

        {/* Expanded detail — simplified for v1 */}
        {isExpanded && (
          <div className="px-3 pb-3 pt-1 border-t border-cream/12 space-y-2">
            <div>
              <label className="text-[10px] text-cream/55 block mb-0.5">What Changed</label>
              <InlineEdit
                value={change.description || ''}
                onSave={(v) => updateChange(change.id, { description: v || undefined })}
                placeholder="Describe what changed..."
                readOnly={readOnly}
                multiline
                displayClassName="text-xs text-cream/70"
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] text-cream/55 block mb-0.5">Why</label>
              <InlineEdit
                value={change.rationale || ''}
                onSave={(v) => updateChange(change.id, { rationale: v || undefined })}
                placeholder="Why was this change needed?"
                readOnly={readOnly}
                multiline
                displayClassName="text-xs text-cream/70"
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] text-cream/55 block mb-0.5">Cost Impact</label>
              <CostImpactField
                value={change.cost_impact}
                onSave={(v) => updateChange(change.id, { cost_impact: v })}
                readOnly={readOnly}
              />
            </div>

            {(change.final_note || !readOnly) && (
              <div>
                <label className="text-[10px] text-cream/55 block mb-0.5">Notes</label>
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

            {/* Incorporate action */}
            {canIncorporate && !readOnly && (
              <button
                type="button"
                onClick={() => {
                  incorporateChange(change.id)
                  setIncorporatingChangeId(null)
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-teal-400 bg-teal-400/10 hover:bg-teal-400/20 rounded-md transition-colors"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                Add to Plan
              </button>
            )}

            {/* Incorporation traceability */}
            {change.incorporated && change.incorporated_at && (
              <div className="text-[10px] text-teal-400/40">
                Added to plan on {new Date(change.incorporated_at).toLocaleDateString()}
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
          <h2 className="text-sm font-semibold text-cream/90">Change Orders</h2>
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
            Add Change Order
          </button>
        )}
      </div>

      {changes.length === 0 && !showAddForm && (
        <p className="text-sm text-cream/55">
          No change orders yet. When something changes from the original plan — new work, different materials, or removed scope — add it here so you have a record.
        </p>
      )}

      {/* Active change orders */}
      {activeChanges.length > 0 && (
        <div className="space-y-2">
          {activeChanges.map((change) => renderChangeRow(change))}
        </div>
      )}

      {/* Canceled — collapsed */}
      {canceledChanges.length > 0 && (
        <details>
          <summary className="text-[10px] text-cream/45 cursor-pointer hover:text-cream/55 transition-colors select-none">
            {canceledChanges.length} canceled
          </summary>
          <div className="mt-2 space-y-2">
            {canceledChanges.map((change) => renderChangeRow(change))}
          </div>
        </details>
      )}

      {/* Add form — simplified v1 */}
      {showAddForm && !readOnly && (
        <div className="p-4 rounded-lg border border-cream/15 bg-stone-50 space-y-3">
          <div>
            <label className="text-[10px] text-cream/55 block mb-1">What changed?</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Added recessed lighting in kitchen"
              className="w-full bg-stone-200 border border-cream/15 rounded-md px-3 py-2 text-sm text-cream/90 placeholder-cream/35 outline-none focus:border-sandstone/30"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleAdd(); if (e.key === 'Escape') handleCancelAdd() }}
            />
          </div>

          <div>
            <label className="text-[10px] text-cream/55 block mb-1">Why?</label>
            <textarea
              value={newRationale}
              onChange={(e) => setNewRationale(e.target.value)}
              placeholder="Why was this change needed?"
              rows={2}
              className="w-full bg-stone-200 border border-cream/15 rounded-md px-3 py-2 text-xs text-cream/70 placeholder-cream/35 outline-none focus:border-sandstone/30 resize-none"
            />
          </div>

          <div>
            <label className="text-[10px] text-cream/55 block mb-1">Cost impact</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setNewCostMode('none')}
                className={`text-[10px] px-2 py-1 rounded transition-colors ${
                  newCostMode === 'none' ? 'bg-cream/15 text-cream/80' : 'text-cream/40 hover:text-cream/55'
                }`}
              >
                None
              </button>
              <button
                type="button"
                onClick={() => setNewCostMode('known')}
                className={`text-[10px] px-2 py-1 rounded transition-colors ${
                  newCostMode === 'known' ? 'bg-cream/15 text-cream/80' : 'text-cream/40 hover:text-cream/55'
                }`}
              >
                Yes, amount known
              </button>
              <button
                type="button"
                onClick={() => setNewCostMode('tbd')}
                className={`text-[10px] px-2 py-1 rounded transition-colors ${
                  newCostMode === 'tbd' ? 'bg-cream/15 text-cream/80' : 'text-cream/40 hover:text-cream/55'
                }`}
              >
                Yes, TBD
              </button>
            </div>
            {newCostMode === 'known' && (
              <input
                type="text"
                value={newCostAmount}
                onChange={(e) => setNewCostAmount(e.target.value)}
                placeholder="e.g. +$2,500"
                className="mt-1.5 w-full max-w-[200px] bg-stone-200 border border-cream/15 rounded-md px-3 py-1.5 text-xs text-cream/70 placeholder-cream/35 outline-none focus:border-sandstone/30"
              />
            )}
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
              Add Change Order
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
