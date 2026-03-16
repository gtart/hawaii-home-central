'use client'

import { Suspense, useState, useRef, useMemo, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useProjectSummaryState } from '../../../useProjectSummaryState'
import { CHANGE_LOG_STATUS_CONFIG, CHANGE_LOG_STATUS_ORDER, toChangeLogStatus } from '../../../constants'
import type { ChangeLogStatus } from '../../../constants'
import { InlineEdit } from '../../../components/InlineEdit'
import { StatusBadge } from '../../../components/StatusBadge'
import { uploadProjectSummaryFile } from '../../../uploadProjectSummaryFile'
import { CollapsibleCommentSidebar, type CommentSidebarHandle } from '@/components/app/CollapsibleCommentSidebar'
import { useComments } from '@/hooks/useComments'

/** Auto-prefix $ on numeric cost values */
function formatCostDisplay(cost: string): string {
  const trimmed = cost.trim()
  if (!trimmed) return ''
  if (/^[+\-]?\s*[$€£¥]/.test(trimmed) || /^[$€£¥]/.test(trimmed)) return trimmed
  if (/^[+\-]?\s*[\d,.]/.test(trimmed)) return `$${trimmed}`
  return trimmed
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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
  const { payload, isLoaded, readOnly, updateChange, addChangeAttachment, removeChangeAttachment, updateChangePrivateNotes } = api

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
  const [showTextForm, setShowTextForm] = useState(false)
  const [newTextTitle, setNewTextTitle] = useState('')
  const [newTextBody, setNewTextBody] = useState('')
  const [confirmDeleteAttachment, setConfirmDeleteAttachment] = useState<string | null>(null)

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

  function handleAddText() {
    if (!newTextTitle.trim() || !change) return
    addChangeAttachment(change.id, {
      type: 'text',
      label: newTextTitle.trim(),
      body: newTextBody.trim() || undefined,
    })
    setNewTextTitle('')
    setNewTextBody('')
    setShowTextForm(false)
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
        <p className="text-cream/65 text-sm mb-4">This entry may have been deleted.</p>
        <Link
          href={`/app/tools/project-summary/${collectionId}`}
          className="text-sandstone hover:text-sandstone-light text-sm transition-colors"
        >
          Back to Plan & Changes
        </Link>
      </div>
    )
  }

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
          Back to Plan & Changes
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
                status={toChangeLogStatus(change.status)}
                onChange={(s) => {
                  const storageStatus = CHANGE_LOG_STATUS_CONFIG[s].storageStatus
                  updateChange(change.id, { status: storageStatus })
                }}
                readOnly={readOnly}
              />
            </div>

            {/* Metadata */}
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

            <div className="space-y-3">
              {/* Change request */}
              <div>
                <label className="text-[10px] text-cream/45 block mb-0.5">Change request</label>
                <InlineEdit
                  value={change.description || ''}
                  onSave={(v) => updateChange(change.id, { description: v || undefined })}
                  readOnly={readOnly}
                  multiline
                  displayClassName="text-sm text-cream/70 leading-relaxed"
                  className="text-sm leading-relaxed"
                />
              </div>

              {/* Cost impact — simple field */}
              <div>
                <label className="text-[10px] text-cream/45 block mb-0.5">Cost Impact</label>
                <InlineEdit
                  value={change.cost_impact || ''}
                  onSave={(v) => updateChange(change.id, { cost_impact: v ? formatCostDisplay(v) : undefined })}
                  placeholder="e.g. +$2,500 or TBD"
                  readOnly={readOnly}
                  displayClassName="text-sm text-cream/70"
                  className="text-sm"
                />
              </div>

              {/* Reason */}
              {(change.rationale || !readOnly) && (
                <div>
                  <label className="text-[10px] text-cream/45 block mb-0.5">Reason (optional)</label>
                  <InlineEdit
                    value={change.rationale || ''}
                    onSave={(v) => updateChange(change.id, { rationale: v || undefined })}
                    placeholder="Why did this change happen?"
                    readOnly={readOnly}
                    multiline
                    displayClassName="text-sm text-cream/70 leading-relaxed"
                    className="text-sm leading-relaxed"
                  />
                </div>
              )}

              {/* Participants */}
              {(change.requested_by || !readOnly) && (
                <div>
                  <label className="text-[10px] text-cream/45 block mb-0.5">Participants (optional)</label>
                  <InlineEdit
                    value={change.requested_by || ''}
                    onSave={(v) => updateChange(change.id, { requested_by: v || undefined })}
                    placeholder="Who was involved in this decision?"
                    readOnly={readOnly}
                    displayClassName="text-sm text-cream/70"
                    className="text-sm"
                  />
                </div>
              )}

              {/* Additional notes */}
              {(change.final_note || !readOnly) && (
                <div>
                  <label className="text-[10px] text-cream/45 block mb-0.5">Additional Notes</label>
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
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.heic,.heif,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />

            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-cream/50 uppercase tracking-wider">
                Attachments
                {attachments.length > 0 && (
                  <span className="ml-1.5 text-cream/45 font-normal">{attachments.length}</span>
                )}
              </span>
              {!readOnly && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-sandstone/70 hover:text-sandstone bg-sandstone/8 hover:bg-sandstone/12 transition-colors disabled:opacity-50"
                    title="Upload file"
                  >
                    {isUploading ? (
                      <div className="w-3 h-3 border border-cream/20 border-t-cream/50 rounded-full animate-spin" />
                    ) : (
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {isUploading ? 'Uploading...' : 'Upload'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowUrlForm(!showUrlForm); setShowTextForm(false) }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-cream/45 hover:text-cream/60 bg-cream/5 hover:bg-cream/8 transition-colors"
                    title="Add a link"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Link
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowTextForm(!showTextForm); setShowUrlForm(false) }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-cream/45 hover:text-cream/60 bg-cream/5 hover:bg-cream/8 transition-colors"
                    title="Add written content"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Add Content
                  </button>
                </div>
              )}
            </div>

            {uploadError && (
              <p className="text-[11px] text-red-400/70 mb-2">{uploadError}</p>
            )}

            {/* URL add form */}
            {showUrlForm && !readOnly && (
              <div className="mb-3 p-3 rounded-lg border border-cream/12 bg-stone-50 space-y-2">
                <input
                  type="text"
                  value={urlLabelInput}
                  onChange={(e) => setUrlLabelInput(e.target.value)}
                  placeholder="Link name"
                  className="w-full bg-stone-200 border border-cream/12 rounded-md px-3 py-2 text-sm text-cream/90 placeholder-cream/30 outline-none focus:border-sandstone/30"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddUrl(); if (e.key === 'Escape') setShowUrlForm(false) }}
                />
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="URL"
                  className="w-full bg-stone-200 border border-cream/12 rounded-md px-2 py-1.5 text-xs text-cream/60 placeholder-cream/30 outline-none focus:border-sandstone/30"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddUrl() }}
                />
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowUrlForm(false)} className="px-3 py-1.5 text-xs text-cream/45 hover:text-cream/60 transition-colors">Cancel</button>
                  <button type="button" onClick={handleAddUrl} disabled={!urlInput.trim()} className="px-3 py-1.5 text-xs bg-sandstone/15 text-sandstone hover:bg-sandstone/25 rounded-md transition-colors disabled:opacity-30">Add</button>
                </div>
              </div>
            )}

            {/* Text content add form */}
            {showTextForm && !readOnly && (
              <div className="mb-3 p-3 rounded-lg border border-cream/12 bg-stone-50 space-y-2">
                <input
                  type="text"
                  value={newTextTitle}
                  onChange={(e) => setNewTextTitle(e.target.value)}
                  placeholder="Title — e.g. 'Scope note' or 'Decision rationale'"
                  className="w-full bg-stone-200 border border-cream/12 rounded-md px-3 py-2 text-sm text-cream/90 placeholder-cream/30 outline-none focus:border-sandstone/30"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Escape') { setShowTextForm(false); setNewTextTitle(''); setNewTextBody('') } }}
                />
                <textarea
                  value={newTextBody}
                  onChange={(e) => setNewTextBody(e.target.value)}
                  placeholder="Write your content here..."
                  rows={4}
                  className="w-full bg-stone-200 border border-cream/12 rounded-md px-3 py-2 text-xs text-cream/65 placeholder-cream/30 outline-none focus:border-sandstone/30 resize-y"
                />
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => { setShowTextForm(false); setNewTextTitle(''); setNewTextBody('') }} className="px-3 py-1.5 text-xs text-cream/45 hover:text-cream/60 transition-colors">Cancel</button>
                  <button type="button" onClick={handleAddText} disabled={!newTextTitle.trim()} className="px-3 py-1.5 text-xs bg-sandstone/15 text-sandstone hover:bg-sandstone/25 rounded-md transition-colors disabled:opacity-30">Add</button>
                </div>
              </div>
            )}

            {attachments.length === 0 && !showUrlForm && !showTextForm && (
              <p className="text-xs text-cream/30 italic">No attachments yet.</p>
            )}

            <div className="space-y-1.5">
              {attachments.map((att) => (
                <div key={att.id} className={`flex items-start gap-2 px-3 py-2 rounded-lg border group ${att.type === 'text' ? 'border-sandstone/10 bg-stone-50' : 'border-cream/12 bg-stone-50'}`}>
                  {att.type === 'text' ? (
                    <svg className="w-3.5 h-3.5 text-sandstone/50 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : att.type === 'file' ? (
                    <svg className="w-3.5 h-3.5 text-cream/40 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5 text-cream/40 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {att.url ? (
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-cream/70 hover:text-cream/90 transition-colors truncate"
                        >
                          {att.label}
                          {att.fileSize ? ` (${formatFileSize(att.fileSize)})` : ''}
                        </a>
                      ) : (
                        <span className="text-xs text-cream/70 truncate">{att.label}</span>
                      )}
                      {att.type === 'text' && (
                        <span className="text-[9px] px-1 py-0.5 rounded bg-sandstone/10 text-sandstone/60">Text</span>
                      )}
                    </div>
                    {att.type === 'text' && att.body && (
                      <p className="text-[10px] text-cream/40 mt-0.5 line-clamp-2">{att.body}</p>
                    )}
                  </div>
                  {att.uploadedAt && (
                    <span className="text-[10px] text-cream/35 shrink-0 mt-0.5">
                      {new Date(att.uploadedAt).toLocaleDateString()}
                    </span>
                  )}
                  {!readOnly && (
                    confirmDeleteAttachment === att.id ? (
                      <div className="flex items-center gap-1 shrink-0 mt-0.5" onClick={(e) => e.stopPropagation()}>
                        <button type="button" onClick={() => { removeChangeAttachment(change.id, att.id); setConfirmDeleteAttachment(null) }} className="text-[10px] text-red-400/70 hover:text-red-400">Remove</button>
                        <button type="button" onClick={() => setConfirmDeleteAttachment(null)} className="text-[10px] text-cream/45 hover:text-cream/65">Cancel</button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteAttachment(att.id)}
                        className="shrink-0 mt-0.5 text-cream/30 hover:text-red-400/50 transition-colors md:opacity-0 md:group-hover:opacity-100"
                        title="Delete"
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
            Discussion
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
