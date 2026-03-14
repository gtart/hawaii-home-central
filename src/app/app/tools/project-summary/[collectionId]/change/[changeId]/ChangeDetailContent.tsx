'use client'

import { Suspense, useState, useRef, useMemo, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useProjectSummaryState } from '../../../useProjectSummaryState'
import { SIMPLE_STATUS_CONFIG, SIMPLE_STATUS_ORDER, toSimpleStatus } from '../../../constants'
import type { SimpleChangeStatus } from '../../../constants'
import { InlineEdit } from '../../../components/InlineEdit'
import { StatusBadge } from '../../../components/StatusBadge'
import { uploadProjectSummaryFile } from '../../../uploadProjectSummaryFile'
import { CollapsibleCommentSidebar, type CommentSidebarHandle } from '@/components/app/CollapsibleCommentSidebar'
import { useComments } from '@/hooks/useComments'
import { OpenItemsList } from '../../../components/OpenItemsList'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Normalize a cost string into dollar format if it looks like a number */
function formatCost(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return trimmed
  if (trimmed.includes('$')) return trimmed
  const match = trimmed.match(/^([+-]?)\s*([0-9][0-9,]*\.?\d*)$/)
  if (!match) return trimmed
  const sign = match[1]
  const num = parseFloat(match[2].replace(/,/g, ''))
  if (isNaN(num)) return trimmed
  return `${sign}$${num.toLocaleString()}`
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
                {isActive && <span className="text-cream/35 ml-auto text-[10px]">Current</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Content({ collectionId, changeId }: { collectionId: string; changeId: string }) {
  const api = useProjectSummaryState({ collectionId })
  const { payload, isLoaded, readOnly, updateChange, incorporateChange, addChangeAttachment, removeChangeAttachment, updateChangePrivateNotes, addChangeOpenItem, updateChangeOpenItem, deleteChangeOpenItem } = api

  const change = useMemo(
    () => payload.changes.find((c) => c.id === changeId),
    [payload.changes, changeId]
  )

  const commentSidebarRef = useRef<CommentSidebarHandle>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [urlLabelInput, setUrlLabelInput] = useState('')
  const [showUrlForm, setShowUrlForm] = useState(false)
  const [confirmDeleteAttachment, setConfirmDeleteAttachment] = useState<string | null>(null)
  const [showIncorporateDialog, setShowIncorporateDialog] = useState(false)
  const [incorporateNote, setIncorporateNote] = useState('')

  const changeComments = useComments({
    collectionId,
    targetType: 'change',
    targetId: changeId,
  })

  const handleOpenComments = useCallback(() => {
    commentSidebarRef.current?.toggle()
  }, [])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !change) return

    setIsUploading(true)
    setUploadError(null)

    try {
      const result = await uploadProjectSummaryFile(file)
      addChangeAttachment(change.id, {
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
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function handleAddUrl() {
    if (!urlInput.trim() || !change) return
    addChangeAttachment(change.id, {
      type: 'url',
      url: urlInput.trim(),
      label: urlLabelInput.trim() || urlInput.trim(),
    })
    setUrlInput('')
    setUrlLabelInput('')
    setShowUrlForm(false)
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-sandstone/30 border-t-sandstone rounded-full animate-spin" />
      </div>
    )
  }

  if (!change) {
    return (
      <div className="text-center py-24">
        <h2 className="font-serif text-2xl text-cream mb-2">Change Not Found</h2>
        <p className="text-cream/65 text-sm mb-4">This change may have been deleted.</p>
        <Link
          href={`/app/tools/project-summary/${collectionId}`}
          className="text-sandstone hover:text-sandstone-light text-sm transition-colors"
        >
          Back to Plan
        </Link>
      </div>
    )
  }

  const canIncorporate = (change.status === 'accepted_by_contractor' || change.status === 'done') && !change.incorporated
  const attachments = change.attachments || []

  return (
    <>
      {/* Back link */}
      <div className="mb-6">
        <Link
          href={`/app/tools/project-summary/${collectionId}`}
          className="inline-flex items-center gap-1.5 text-sm text-cream/55 hover:text-cream/70 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Plan
        </Link>
      </div>

      <div className="md:flex md:gap-6 md:items-start">
        <div className="flex-1 min-w-0 space-y-6">
          {/* Title + Status */}
          <div className="rounded-xl border border-cream/12 bg-stone-50 p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <InlineEdit
                value={change.title}
                onSave={(title) => updateChange(change.id, { title })}
                readOnly={readOnly}
                displayClassName="text-lg font-serif text-cream/90 font-medium"
                className="text-lg font-serif font-medium"
              />
              <StatusDropdown
                status={toSimpleStatus(change.status)}
                onChange={(s) => {
                  const storageStatus = SIMPLE_STATUS_CONFIG[s].storageStatus
                  updateChange(change.id, { status: storageStatus })
                }}
                readOnly={readOnly}
              />
            </div>

            {/* Metadata: created + last edited */}
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-cream/35 mb-3">
              {change.created_at && (
                <span>Created {new Date(change.created_at).toLocaleDateString()}</span>
              )}
              {change.updated_at && change.updated_at !== change.created_at && (
                <span>
                  Last edited {new Date(change.updated_at).toLocaleDateString()}
                  {change.updated_by && ` by ${change.updated_by}`}
                </span>
              )}
            </div>

            {/* Incorporation / changed-since indicators */}
            {change.incorporated && change.incorporated_at && (
              <div className="text-[10px] text-teal-400/50 bg-teal-400/8 rounded-md px-2.5 py-1.5 mb-3 flex items-center gap-1.5">
                <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Added to plan on {new Date(change.incorporated_at).toLocaleDateString()}
                {change.incorporated_by && ` by ${change.incorporated_by}`}
              </div>
            )}

            {change.changed_since_accepted && (
              <div className="text-[10px] text-amber-400/50 bg-amber-400/8 rounded-md px-2.5 py-1.5 mb-3 flex items-center gap-1.5">
                <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" />
                  <line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round" />
                </svg>
                Edited since contractor accepted
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-cream/45 block mb-0.5">Scope / What&apos;s Changed</label>
                <InlineEdit
                  value={change.description || ''}
                  onSave={(v) => updateChange(change.id, { description: v || undefined })}
                  placeholder="Describe the change..."
                  readOnly={readOnly}
                  multiline
                  displayClassName="text-sm text-cream/70 leading-relaxed"
                  className="text-sm leading-relaxed"
                />
              </div>

              <div>
                <label className="text-[10px] text-cream/45 block mb-0.5">Reason (optional)</label>
                <InlineEdit
                  value={change.rationale || ''}
                  onSave={(v) => updateChange(change.id, { rationale: v || undefined })}
                  placeholder="Why did this change happen? What prompted it?"
                  readOnly={readOnly}
                  multiline
                  displayClassName="text-sm text-cream/70 leading-relaxed"
                  className="text-sm leading-relaxed"
                />
              </div>

              <div>
                <label className="text-[10px] text-cream/45 block mb-0.5">Requested By</label>
                <InlineEdit
                  value={change.requested_by || ''}
                  onSave={(v) => updateChange(change.id, { requested_by: v || undefined })}
                  placeholder="Who requested?"
                  readOnly={readOnly}
                  displayClassName="text-sm text-cream/70"
                  className="text-sm"
                />
              </div>

              {/* Budget: proposed vs final side by side on desktop, stacked on mobile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-lg bg-stone-50 border border-cream/15 p-3 space-y-2">
                  <span className="text-[10px] text-cream/40 uppercase tracking-wider font-medium">Proposed</span>
                  <div>
                    <label className="text-[10px] text-cream/45 block mb-0.5">Cost</label>
                    <InlineEdit
                      value={change.proposed_cost_impact || ''}
                      onSave={(v) => updateChange(change.id, { proposed_cost_impact: v ? formatCost(v) : undefined })}
                      placeholder="e.g. +$1,200"
                      readOnly={readOnly}
                      displayClassName="text-sm text-cream/65"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-cream/45 block mb-0.5">Schedule</label>
                    <InlineEdit
                      value={change.proposed_schedule_impact || ''}
                      onSave={(v) => updateChange(change.id, { proposed_schedule_impact: v || undefined })}
                      placeholder="e.g. +2 weeks"
                      readOnly={readOnly}
                      displayClassName="text-sm text-cream/65"
                      className="text-sm"
                    />
                  </div>
                </div>
                <div className="rounded-lg bg-stone-50 border border-cream/15 p-3 space-y-2">
                  <span className="text-[10px] text-cream/40 uppercase tracking-wider font-medium">Final</span>
                  <div>
                    <label className="text-[10px] text-cream/45 block mb-0.5">Cost</label>
                    <InlineEdit
                      value={change.cost_impact || ''}
                      onSave={(v) => updateChange(change.id, { cost_impact: v ? formatCost(v) : undefined })}
                      placeholder="Agreed cost impact"
                      readOnly={readOnly}
                      displayClassName="text-sm text-cream/70"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-cream/45 block mb-0.5">Schedule</label>
                    <InlineEdit
                      value={change.schedule_impact || ''}
                      onSave={(v) => updateChange(change.id, { schedule_impact: v || undefined })}
                      placeholder="Agreed schedule impact"
                      readOnly={readOnly}
                      displayClassName="text-sm text-cream/70"
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Note from Contractor */}
              <div>
                <label className="text-[10px] text-cream/45 block mb-0.5">Note from Contractor (optional)</label>
                <InlineEdit
                  value={change.contractor_response || ''}
                  onSave={(v) => updateChange(change.id, { contractor_response: v || undefined })}
                  placeholder="Contractor's response to this change..."
                  readOnly={readOnly}
                  multiline
                  displayClassName="text-sm text-cream/70 leading-relaxed"
                  className="text-sm leading-relaxed"
                />
              </div>

              {(change.final_note || !readOnly) && (
                <div>
                  <label className="text-[10px] text-cream/45 block mb-0.5">Additional Notes (optional)</label>
                  <InlineEdit
                    value={change.final_note || ''}
                    onSave={(v) => updateChange(change.id, { final_note: v || undefined })}
                    placeholder="Any additional notes..."
                    readOnly={readOnly}
                    multiline
                    displayClassName="text-xs text-cream/65"
                    className="text-xs"
                  />
                </div>
              )}

              {/* Change — Open Questions */}
              <div>
                <label className="text-[10px] text-cream/45 uppercase tracking-wider font-medium block mb-1.5">
                  Open Questions
                </label>
                <OpenItemsList
                  items={change.open_items || []}
                  onAdd={(text) => addChangeOpenItem(change.id, text)}
                  onUpdate={(id, updates) => updateChangeOpenItem(change.id, id, updates)}
                  onResolve={(id, note) => updateChangeOpenItem(change.id, id, { status: 'resolved', resolution_note: note })}
                  onDelete={(id) => deleteChangeOpenItem(change.id, id)}
                  readOnly={readOnly}
                  emptyMessage="Nothing left to decide for this change."
                  addPlaceholder="Add something that needs deciding for this change..."
                />
              </div>

              {/* Incorporate action — guided dialog with merge note */}
              {canIncorporate && !readOnly && (
                <>
                  <button
                    type="button"
                    onClick={() => { setShowIncorporateDialog(true); setIncorporateNote('') }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-teal-400 bg-teal-400/10 hover:bg-teal-400/20 rounded-md transition-colors"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                    </svg>
                    Add to Your Plan
                  </button>
                  {showIncorporateDialog && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
                      <div className="w-full max-w-md rounded-xl border border-cream/15 bg-basalt p-6 shadow-2xl space-y-4">
                        <h3 className="text-base font-semibold text-cream">Add to Your Plan</h3>
                        <p className="text-sm text-cream/70 leading-relaxed">
                          This will mark <span className="text-cream/90">&ldquo;{change.title}&rdquo;</span> as part of your plan.
                        </p>
                        {(change.cost_impact || change.schedule_impact) && (
                          <div className="rounded-lg bg-stone-50 border border-cream/12 px-3 py-2 space-y-1">
                            <div className="text-[10px] text-cream/45 uppercase tracking-wider font-medium">Impact</div>
                            {change.cost_impact && <div className="text-xs text-cream/70">Cost: <span className="text-cream/90">{change.cost_impact}</span></div>}
                            {change.schedule_impact && <div className="text-xs text-cream/70">Schedule: <span className="text-cream/90">{change.schedule_impact}</span></div>}
                          </div>
                        )}
                        <div>
                          <label className="text-[10px] text-cream/45 block mb-1">Note (optional)</label>
                          <textarea
                            value={incorporateNote}
                            onChange={(e) => setIncorporateNote(e.target.value)}
                            placeholder="Any notes about adding this to the plan..."
                            rows={2}
                            className="w-full bg-stone-200 border border-cream/15 rounded-md px-3 py-2 text-xs text-cream/70 placeholder-cream/35 outline-none focus:border-sandstone/30 resize-none"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button type="button" onClick={() => setShowIncorporateDialog(false)} className="px-3 py-1.5 text-xs text-cream/55 hover:text-cream/70 transition-colors">Cancel</button>
                          <button
                            type="button"
                            onClick={() => { incorporateChange(change.id, undefined, incorporateNote.trim() || undefined); setShowIncorporateDialog(false) }}
                            className="px-3 py-1.5 text-xs bg-teal-400/20 text-teal-400 hover:bg-teal-400/30 rounded-md transition-colors"
                          >
                            Add to Your Plan
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Links — hidden for v1 self-tracking, data preserved */}
              {change.links.length > 0 && (
                <div className="text-[10px] text-cream/35">
                  {change.links.length} linked item{change.links.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>

          {/* Private Notes */}
          {!readOnly && (
            <div className="rounded-xl border border-amber-400/10 bg-amber-400/[0.02] p-5">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-3.5 h-3.5 text-amber-400/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[10px] text-amber-400/50 uppercase tracking-wider font-medium">Private Notes</span>
                <span className="text-[10px] text-cream/35">Only you can see this</span>
              </div>
              <InlineEdit
                value={change.private_notes || ''}
                onSave={(v) => updateChangePrivateNotes(change.id, v)}
                placeholder="Add private notes about this change..."
                readOnly={false}
                multiline
                displayClassName="text-sm text-cream/65 leading-relaxed"
                className="text-sm leading-relaxed"
              />
            </div>
          )}

          {/* Attachments */}
          <div className="rounded-xl border border-cream/12 bg-stone-50 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-cream/90">
                Attachments
                {attachments.length > 0 && (
                  <span className="ml-1.5 text-cream/45 font-normal">{attachments.length}</span>
                )}
              </span>
              {!readOnly && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowUrlForm(!showUrlForm)}
                    className="text-[11px] text-cream/45 hover:text-cream/65 transition-colors"
                  >
                    + Add URL
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center gap-1 text-[11px] text-cream/45 hover:text-cream/65 transition-colors disabled:opacity-50"
                  >
                    {isUploading ? (
                      <div className="w-3 h-3 border border-cream/20 border-t-cream/50 rounded-full animate-spin" />
                    ) : (
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    Upload File
                  </button>
                </div>
              )}
            </div>

            {uploadError && (
              <p className="text-[11px] text-red-400/70 mb-2">{uploadError}</p>
            )}

            {/* URL add form */}
            {showUrlForm && !readOnly && (
              <div className="mb-3 p-2 rounded-lg border border-cream/15 bg-stone-50 space-y-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="URL"
                  className="w-full bg-stone-200 border border-cream/15 rounded-md px-2 py-1.5 text-xs text-cream/80 placeholder-cream/35 outline-none focus:border-sandstone/30"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddUrl(); if (e.key === 'Escape') setShowUrlForm(false) }}
                />
                <input
                  type="text"
                  value={urlLabelInput}
                  onChange={(e) => setUrlLabelInput(e.target.value)}
                  placeholder="Label (optional)"
                  className="w-full bg-stone-200 border border-cream/15 rounded-md px-2 py-1.5 text-xs text-cream/80 placeholder-cream/35 outline-none focus:border-sandstone/30"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddUrl() }}
                />
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowUrlForm(false)} className="px-2 py-1 text-[10px] text-cream/45 hover:text-cream/65">Cancel</button>
                  <button type="button" onClick={handleAddUrl} disabled={!urlInput.trim()} className="px-2 py-1 text-[10px] bg-sandstone/20 text-sandstone hover:bg-sandstone/30 rounded-md disabled:opacity-30">Add</button>
                </div>
              </div>
            )}

            {attachments.length === 0 && !showUrlForm && (
              <p className="text-sm text-cream/45 italic">No attachments yet.</p>
            )}

            <div className="space-y-1.5">
              {attachments.map((att) => (
                <div key={att.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-stone-50 border border-cream/15 group">
                  {att.type === 'file' ? (
                    <svg className="w-3.5 h-3.5 text-cream/40 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5 text-cream/40 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-cream/70 hover:text-cream/90 transition-colors truncate flex-1"
                  >
                    {att.label}
                    {att.fileSize ? ` (${formatFileSize(att.fileSize)})` : ''}
                  </a>
                  {att.uploadedAt && (
                    <span className="text-[10px] text-cream/35 shrink-0">
                      {new Date(att.uploadedAt).toLocaleDateString()}
                    </span>
                  )}
                  {!readOnly && (
                    confirmDeleteAttachment === att.id ? (
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button type="button" onClick={() => { removeChangeAttachment(change.id, att.id); setConfirmDeleteAttachment(null) }} className="text-[10px] text-red-400/70 hover:text-red-400">Remove</button>
                        <button type="button" onClick={() => setConfirmDeleteAttachment(null)} className="text-[10px] text-cream/45 hover:text-cream/65">Cancel</button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteAttachment(att.id)}
                        className="shrink-0 text-cream/30 hover:text-red-400/50 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    )
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Comments button (mobile) */}
          <button
            type="button"
            onClick={handleOpenComments}
            className="md:hidden w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-cream/65 bg-stone-200 hover:bg-stone-hover transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Comments
            {changeComments.comments.length > 0 && (
              <span className="bg-cream/15 text-cream/55 text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                {changeComments.comments.length}
              </span>
            )}
          </button>
        </div>

        <CollapsibleCommentSidebar
          ref={commentSidebarRef}
          title="Change Discussion"
          storageKey={`project_summary_change_comments_${changeId}`}
          comments={changeComments.comments}
          isLoading={changeComments.isLoading}
          readOnly={readOnly}
          onAddComment={changeComments.addComment}
          onDeleteComment={changeComments.deleteComment}
          defaultCollapsed
          collectionId={collectionId}
        />
      </div>
    </>
  )
}

export function ChangeDetailContent({ collectionId, changeId }: { collectionId: string; changeId: string }) {
  return (
    <div className="pt-32 pb-[calc(6rem+var(--bottom-nav-offset,3.5rem))] px-6">
      <div className="max-w-4xl mx-auto overflow-x-clip">
        <Suspense fallback={null}>
          <Content collectionId={collectionId} changeId={changeId} />
        </Suspense>
      </div>
    </div>
  )
}
