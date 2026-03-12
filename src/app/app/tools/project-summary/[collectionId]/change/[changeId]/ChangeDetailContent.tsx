'use client'

import { Suspense, useState, useRef, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useProjectSummaryState } from '../../../useProjectSummaryState'
import { CHANGE_STATUS_CONFIG, CHANGE_STATUS_CYCLE } from '../../../constants'
import { InlineEdit } from '../../../components/InlineEdit'
import { StatusBadge } from '../../../components/StatusBadge'
import { LinkPills } from '../../../components/LinkPills'
import { AttachMenu } from '../../../components/AttachMenu'
import { uploadProjectSummaryFile } from '../../../uploadProjectSummaryFile'
import { CollapsibleCommentSidebar, type CommentSidebarHandle } from '@/components/app/CollapsibleCommentSidebar'
import { useComments } from '@/hooks/useComments'
import type { ChangeStatus } from '@/data/project-summary'

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

function Content({ collectionId, changeId }: { collectionId: string; changeId: string }) {
  const api = useProjectSummaryState({ collectionId })
  const { payload, isLoaded, readOnly, updateChange, addChangeAttachment, removeChangeAttachment, updateChangePrivateNotes, addLink, removeLink } = api

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

  const changeComments = useComments({
    collectionId,
    targetType: 'change',
    targetId: changeId,
  })

  const handleOpenComments = useCallback(() => {
    commentSidebarRef.current?.toggle()
  }, [])

  function cycleStatus() {
    if (!change || readOnly) return
    const idx = CHANGE_STATUS_CYCLE.indexOf(change.status)
    const next = CHANGE_STATUS_CYCLE[(idx + 1) % CHANGE_STATUS_CYCLE.length]
    updateChange(change.id, { status: next })
  }

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
        <p className="text-cream/50 text-sm mb-4">This change may have been deleted.</p>
        <Link
          href={`/app/tools/project-summary/${collectionId}`}
          className="text-sandstone hover:text-sandstone-light text-sm transition-colors"
        >
          Back to Project Summary
        </Link>
      </div>
    )
  }

  const statusConfig = CHANGE_STATUS_CONFIG[change.status]
  const attachments = change.attachments || []

  return (
    <>
      {/* Back link */}
      <div className="mb-6">
        <Link
          href={`/app/tools/project-summary/${collectionId}`}
          className="inline-flex items-center gap-1.5 text-sm text-cream/40 hover:text-cream/60 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Project Summary
        </Link>
      </div>

      <div className="md:flex md:gap-6 md:items-start">
        <div className="flex-1 min-w-0 space-y-6">
          {/* Title + Status */}
          <div className="rounded-xl border border-cream/[0.06] bg-cream/[0.02] p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <InlineEdit
                value={change.title}
                onSave={(title) => updateChange(change.id, { title })}
                readOnly={readOnly}
                displayClassName="text-lg font-serif text-cream/90 font-medium"
                className="text-lg font-serif font-medium"
              />
              <StatusBadge
                label={statusConfig.label}
                color={statusConfig.color}
                bgColor={statusConfig.bgColor}
                onClick={readOnly ? undefined : cycleStatus}
                readOnly={readOnly}
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-cream/30 block mb-0.5">Description</label>
                <InlineEdit
                  value={change.description || ''}
                  onSave={(v) => updateChange(change.id, { description: v || undefined })}
                  placeholder="Describe the change..."
                  readOnly={readOnly}
                  multiline
                  displayClassName="text-sm text-cream/60 leading-relaxed"
                  className="text-sm leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-cream/30 block mb-0.5">Requested By</label>
                  <InlineEdit
                    value={change.requested_by || ''}
                    onSave={(v) => updateChange(change.id, { requested_by: v || undefined })}
                    placeholder="Who requested?"
                    readOnly={readOnly}
                    displayClassName="text-sm text-cream/60"
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-cream/30 block mb-0.5">Cost Impact</label>
                  <InlineEdit
                    value={change.cost_impact || ''}
                    onSave={(v) => updateChange(change.id, { cost_impact: v ? formatCost(v) : undefined })}
                    placeholder="e.g. +$1,200"
                    readOnly={readOnly}
                    displayClassName="text-sm text-cream/60"
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-cream/30 block mb-0.5">Schedule Impact</label>
                  <InlineEdit
                    value={change.schedule_impact || ''}
                    onSave={(v) => updateChange(change.id, { schedule_impact: v || undefined })}
                    placeholder="e.g. +2 weeks"
                    readOnly={readOnly}
                    displayClassName="text-sm text-cream/60"
                    className="text-sm"
                  />
                </div>
              </div>

              {(change.final_note || !readOnly) && (
                <div>
                  <label className="text-[10px] text-cream/30 block mb-0.5">Final Note</label>
                  <InlineEdit
                    value={change.final_note || ''}
                    onSave={(v) => updateChange(change.id, { final_note: v || undefined })}
                    placeholder="Resolution or outcome..."
                    readOnly={readOnly}
                    multiline
                    displayClassName="text-xs text-cream/50"
                    className="text-xs"
                  />
                </div>
              )}

              {/* Links */}
              <div className="flex items-center gap-2">
                <LinkPills
                  links={change.links}
                  onRemove={readOnly ? undefined : (linkId) => removeLink('changes', change.id, linkId)}
                  readOnly={readOnly}
                />
                <AttachMenu
                  readOnly={readOnly}
                  onAttach={(link) => addLink('changes', change.id, link)}
                />
              </div>
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
                <span className="text-[10px] text-cream/20">Only you can see this</span>
              </div>
              <InlineEdit
                value={change.private_notes || ''}
                onSave={(v) => updateChangePrivateNotes(change.id, v)}
                placeholder="Add private notes about this change..."
                readOnly={false}
                multiline
                displayClassName="text-sm text-cream/50 leading-relaxed"
                className="text-sm leading-relaxed"
              />
            </div>
          )}

          {/* Attachments */}
          <div className="rounded-xl border border-cream/[0.06] bg-cream/[0.02] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-cream/80">
                Attachments
                {attachments.length > 0 && (
                  <span className="ml-1.5 text-cream/30 font-normal">{attachments.length}</span>
                )}
              </span>
              {!readOnly && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowUrlForm(!showUrlForm)}
                    className="text-[11px] text-cream/30 hover:text-cream/50 transition-colors"
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
                    className="flex items-center gap-1 text-[11px] text-cream/30 hover:text-cream/50 transition-colors disabled:opacity-50"
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
              <div className="mb-3 p-2 rounded-lg border border-cream/10 bg-cream/[0.03] space-y-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="URL"
                  className="w-full bg-cream/5 border border-cream/10 rounded-md px-2 py-1.5 text-xs text-cream/70 placeholder-cream/20 outline-none focus:border-sandstone/30"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddUrl(); if (e.key === 'Escape') setShowUrlForm(false) }}
                />
                <input
                  type="text"
                  value={urlLabelInput}
                  onChange={(e) => setUrlLabelInput(e.target.value)}
                  placeholder="Label (optional)"
                  className="w-full bg-cream/5 border border-cream/10 rounded-md px-2 py-1.5 text-xs text-cream/70 placeholder-cream/20 outline-none focus:border-sandstone/30"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddUrl() }}
                />
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowUrlForm(false)} className="px-2 py-1 text-[10px] text-cream/30 hover:text-cream/50">Cancel</button>
                  <button type="button" onClick={handleAddUrl} disabled={!urlInput.trim()} className="px-2 py-1 text-[10px] bg-sandstone/20 text-sandstone hover:bg-sandstone/30 rounded-md disabled:opacity-30">Add</button>
                </div>
              </div>
            )}

            {attachments.length === 0 && !showUrlForm && (
              <p className="text-sm text-cream/30 italic">No attachments yet.</p>
            )}

            <div className="space-y-1.5">
              {attachments.map((att) => (
                <div key={att.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-cream/[0.02] border border-cream/[0.04] group">
                  {att.type === 'file' ? (
                    <svg className="w-3.5 h-3.5 text-cream/25 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5 text-cream/25 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-cream/60 hover:text-cream/80 transition-colors truncate flex-1"
                  >
                    {att.label}
                    {att.fileSize ? ` (${formatFileSize(att.fileSize)})` : ''}
                  </a>
                  {att.uploadedAt && (
                    <span className="text-[10px] text-cream/20 shrink-0">
                      {new Date(att.uploadedAt).toLocaleDateString()}
                    </span>
                  )}
                  {!readOnly && (
                    confirmDeleteAttachment === att.id ? (
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button type="button" onClick={() => { removeChangeAttachment(change.id, att.id); setConfirmDeleteAttachment(null) }} className="text-[10px] text-red-400/70 hover:text-red-400">Remove</button>
                        <button type="button" onClick={() => setConfirmDeleteAttachment(null)} className="text-[10px] text-cream/30 hover:text-cream/50">Cancel</button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteAttachment(att.id)}
                        className="shrink-0 text-cream/15 hover:text-red-400/50 transition-colors opacity-0 group-hover:opacity-100"
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
            className="md:hidden w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-cream/50 bg-cream/5 hover:bg-cream/10 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Comments
            {changeComments.comments.length > 0 && (
              <span className="bg-cream/10 text-cream/40 text-[10px] font-medium px-1.5 py-0.5 rounded-full">
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
