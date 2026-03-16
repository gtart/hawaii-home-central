'use client'

import { useState, useMemo, useRef } from 'react'
import { CHANGE_LOG_STATUS_CONFIG } from '../constants'
import type { ChangeLogStatus } from '../constants'
import type { ProjectSummaryStateAPI } from '../useProjectSummaryState'
import { InlineEdit } from './InlineEdit'
import { uploadProjectSummaryFile } from '../uploadProjectSummaryFile'

interface AcceptedChangesSectionProps {
  api: ProjectSummaryStateAPI
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const ADDED_STATUSES = new Set(['approved_by_homeowner', 'accepted_by_contractor', 'done'])

export function AcceptedChangesSection({ api }: AcceptedChangesSectionProps) {
  const { payload, readOnly, updateChange, addChange, addChangeAttachment, removeChangeAttachment } = api
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [showUrlForm, setShowUrlForm] = useState<string | null>(null) // changeId
  const [showTextForm, setShowTextForm] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [urlLabelInput, setUrlLabelInput] = useState('')
  const [textTitle, setTextTitle] = useState('')
  const [textBody, setTextBody] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadForChangeId = useRef<string | null>(null)

  const acceptedChanges = useMemo(
    () => payload.changes
      .filter((c) => ADDED_STATUSES.has(c.status))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [payload.changes]
  )

  function handleAddChange() {
    if (!newTitle.trim()) return
    addChange({
      title: newTitle.trim(),
      status: 'approved_by_homeowner',
    })
    setNewTitle('')
    setShowAddForm(false)
  }

  function handleRemoveFromPlan(changeId: string, target: 'pending' | 'closed') {
    const storageStatus = target === 'pending'
      ? CHANGE_LOG_STATUS_CONFIG['noted' as ChangeLogStatus].storageStatus
      : CHANGE_LOG_STATUS_CONFIG['superseded' as ChangeLogStatus].storageStatus
    updateChange(changeId, { status: storageStatus })
    setConfirmRemoveId(null)
    setExpandedId(null)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const changeId = uploadForChangeId.current
    if (!file || !changeId) return
    setIsUploading(true)
    setUploadError(null)
    try {
      const result = await uploadProjectSummaryFile(file)
      addChangeAttachment(changeId, {
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

  function handleAddUrl(changeId: string) {
    if (!urlInput.trim()) return
    addChangeAttachment(changeId, {
      type: 'url',
      url: urlInput.trim(),
      label: urlLabelInput.trim() || urlInput.trim(),
    })
    setUrlInput('')
    setUrlLabelInput('')
    setShowUrlForm(null)
  }

  function handleAddText(changeId: string) {
    if (!textTitle.trim()) return
    addChangeAttachment(changeId, {
      type: 'text',
      label: textTitle.trim(),
      body: textBody.trim() || undefined,
    })
    setTextTitle('')
    setTextBody('')
    setShowTextForm(null)
  }

  return (
    <div className="space-y-3">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.heic,.heif,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf"
        onChange={handleFileUpload}
        className="hidden"
        disabled={isUploading}
      />

      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold text-cream/50 uppercase tracking-wider">Changes Added to Plan</h2>
          {acceptedChanges.length > 0 && (
            <span className="text-[10px] text-cream/30 tabular-nums">{acceptedChanges.length}</span>
          )}
        </div>
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

      {/* Quick add form */}
      {showAddForm && !readOnly && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="What changed?"
            className="flex-1 bg-stone-200 border border-cream/12 rounded-md px-3 py-2 text-sm text-cream/90 placeholder-cream/30 outline-none focus:border-sandstone/30"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddChange()
              if (e.key === 'Escape') { setShowAddForm(false); setNewTitle('') }
            }}
          />
          <button type="button" onClick={handleAddChange} disabled={!newTitle.trim()} className="px-3 py-2 text-xs bg-sandstone/15 text-sandstone hover:bg-sandstone/25 rounded-md transition-colors disabled:opacity-30">Add</button>
          <button type="button" onClick={() => { setShowAddForm(false); setNewTitle('') }} className="px-2 py-2 text-xs text-cream/45 hover:text-cream/60 transition-colors">Cancel</button>
        </div>
      )}

      {/* Empty state */}
      {acceptedChanges.length === 0 && !showAddForm && (
        <p className="text-xs text-cream/30 italic">No changes added to the plan yet.</p>
      )}

      {uploadError && (
        <p className="text-[11px] text-red-400/70">{uploadError}</p>
      )}

      {/* Changes list */}
      {acceptedChanges.length > 0 && (
        <div className="space-y-2">
          {acceptedChanges.map((change) => {
            const isExpanded = expandedId === change.id
            const attachments = change.attachments || []

            return (
              <div
                key={change.id}
                className={`rounded-lg border transition-colors ${
                  isExpanded ? 'border-emerald-400/15 bg-stone-50/60' : 'border-cream/8 hover:border-cream/12 bg-stone-50/40'
                }`}
              >
                {/* Collapsed row — clickable */}
                <div
                  className="flex items-center gap-2.5 px-4 py-2.5 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : change.id)}
                >
                  <svg
                    className={`w-3 h-3 text-cream/30 transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  >
                    <polyline points="9 18 15 12 9 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>

                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-cream/80 truncate block">{change.title}</span>
                  </div>

                  {change.cost_impact && (
                    <span className="text-[10px] text-cream/40 shrink-0 tabular-nums">{change.cost_impact}</span>
                  )}

                  <div className="flex items-center gap-2 shrink-0 text-[10px] text-cream/30 tabular-nums">
                    <span>{new Date(change.created_at).toLocaleDateString()}</span>
                    {(change.created_by || change.updated_by) && (
                      <span className="hidden md:inline">{change.created_by || change.updated_by}</span>
                    )}
                  </div>

                  {attachments.length > 0 && (
                    <span className="text-cream/25 shrink-0">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  )}
                </div>

                {/* Expanded detail — mirrors plan structure */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-cream/8">
                    <div className="pt-3 space-y-4">
                      {/* Change Request (scope) */}
                      <div>
                        <label className="text-[10px] text-cream/35 uppercase tracking-wider block mb-1">Change Request</label>
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

                      {/* Budget + Est End Date row */}
                      <div className="flex flex-wrap gap-6">
                        <div className="flex-1 min-w-[120px]">
                          <label className="text-[10px] text-cream/35 uppercase tracking-wider block mb-1">Budget</label>
                          <InlineEdit
                            value={change.cost_impact || ''}
                            onSave={(v) => updateChange(change.id, { cost_impact: v || undefined })}
                            placeholder="e.g. +$2,500"
                            readOnly={readOnly}
                            displayClassName="text-sm text-cream/60 tabular-nums"
                            className="text-sm"
                          />
                        </div>
                        <div className="min-w-[120px]">
                          <label className="text-[10px] text-cream/35 uppercase tracking-wider block mb-1">Est. End Date</label>
                          <InlineEdit
                            value={change.schedule_impact || ''}
                            onSave={(v) => updateChange(change.id, { schedule_impact: v || undefined })}
                            placeholder="e.g. June 2026"
                            readOnly={readOnly}
                            displayClassName="text-sm text-cream/60"
                            className="text-sm"
                          />
                        </div>
                      </div>

                      {/* Budget notes / rationale */}
                      {(change.rationale || change.final_note || !readOnly) && (
                        <div>
                          <label className="text-[10px] text-cream/35 uppercase tracking-wider block mb-1">Notes</label>
                          <InlineEdit
                            value={change.rationale || change.final_note || ''}
                            onSave={(v) => updateChange(change.id, { rationale: v || undefined })}
                            placeholder="Budget notes, rationale..."
                            readOnly={readOnly}
                            multiline
                            displayClassName="text-xs text-cream/45 leading-relaxed"
                            className="text-xs leading-relaxed"
                          />
                        </div>
                      )}

                      {/* Attachments (Plan Files for this change) */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-[10px] text-cream/35 uppercase tracking-wider">Files</label>
                          {!readOnly && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  uploadForChangeId.current = change.id
                                  fileInputRef.current?.click()
                                }}
                                disabled={isUploading}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] text-sandstone/60 hover:text-sandstone bg-sandstone/8 hover:bg-sandstone/12 transition-colors disabled:opacity-50"
                              >
                                {isUploading ? (
                                  <div className="w-2.5 h-2.5 border border-cream/20 border-t-cream/50 rounded-full animate-spin" />
                                ) : (
                                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                                Upload
                              </button>
                              <button
                                type="button"
                                onClick={() => { setShowUrlForm(showUrlForm === change.id ? null : change.id); setShowTextForm(null) }}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] text-cream/35 hover:text-cream/50 bg-cream/5 hover:bg-cream/8 transition-colors"
                              >
                                Add a link
                              </button>
                              <button
                                type="button"
                                onClick={() => { setShowTextForm(showTextForm === change.id ? null : change.id); setShowUrlForm(null) }}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] text-cream/35 hover:text-cream/50 bg-cream/5 hover:bg-cream/8 transition-colors"
                              >
                                Add Content
                              </button>
                            </div>
                          )}
                        </div>

                        {/* URL form */}
                        {showUrlForm === change.id && !readOnly && (
                          <div className="mb-2 p-2 rounded border border-cream/10 bg-stone-50 space-y-1.5">
                            <input type="text" value={urlLabelInput} onChange={(e) => setUrlLabelInput(e.target.value)} placeholder="Link name" className="w-full bg-stone-200 border border-cream/10 rounded px-2 py-1.5 text-xs text-cream/80 placeholder-cream/25 outline-none focus:border-sandstone/30" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleAddUrl(change.id); if (e.key === 'Escape') setShowUrlForm(null) }} />
                            <input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="URL" className="w-full bg-stone-200 border border-cream/10 rounded px-2 py-1 text-[11px] text-cream/50 placeholder-cream/25 outline-none focus:border-sandstone/30" onKeyDown={(e) => { if (e.key === 'Enter') handleAddUrl(change.id) }} />
                            <div className="flex gap-1.5 justify-end">
                              <button type="button" onClick={() => setShowUrlForm(null)} className="px-2 py-1 text-[10px] text-cream/35">Cancel</button>
                              <button type="button" onClick={() => handleAddUrl(change.id)} disabled={!urlInput.trim()} className="px-2 py-1 text-[10px] bg-sandstone/15 text-sandstone rounded disabled:opacity-30">Add</button>
                            </div>
                          </div>
                        )}

                        {/* Text form */}
                        {showTextForm === change.id && !readOnly && (
                          <div className="mb-2 p-2 rounded border border-cream/10 bg-stone-50 space-y-1.5">
                            <input type="text" value={textTitle} onChange={(e) => setTextTitle(e.target.value)} placeholder="Title" className="w-full bg-stone-200 border border-cream/10 rounded px-2 py-1.5 text-xs text-cream/80 placeholder-cream/25 outline-none focus:border-sandstone/30" autoFocus onKeyDown={(e) => { if (e.key === 'Escape') { setShowTextForm(null); setTextTitle(''); setTextBody('') } }} />
                            <textarea value={textBody} onChange={(e) => setTextBody(e.target.value)} placeholder="Content..." rows={3} className="w-full bg-stone-200 border border-cream/10 rounded px-2 py-1.5 text-[11px] text-cream/50 placeholder-cream/25 outline-none focus:border-sandstone/30 resize-y" />
                            <div className="flex gap-1.5 justify-end">
                              <button type="button" onClick={() => { setShowTextForm(null); setTextTitle(''); setTextBody('') }} className="px-2 py-1 text-[10px] text-cream/35">Cancel</button>
                              <button type="button" onClick={() => handleAddText(change.id)} disabled={!textTitle.trim()} className="px-2 py-1 text-[10px] bg-sandstone/15 text-sandstone rounded disabled:opacity-30">Add</button>
                            </div>
                          </div>
                        )}

                        {/* Attachment list */}
                        {attachments.length === 0 && showUrlForm !== change.id && showTextForm !== change.id && (
                          <p className="text-[10px] text-cream/25 italic">No files attached.</p>
                        )}
                        {attachments.length > 0 && (
                          <div className="space-y-1">
                            {attachments.map((att) => (
                              <div key={att.id} className="flex items-center gap-2 px-2 py-1.5 rounded border border-cream/8 bg-stone-50/50 group">
                                {att.type === 'text' ? (
                                  <svg className="w-3 h-3 text-sandstone/40 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                ) : att.type === 'file' ? (
                                  <svg className="w-3 h-3 text-cream/30 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" /><path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                ) : (
                                  <svg className="w-3 h-3 text-cream/30 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" strokeLinecap="round" strokeLinejoin="round" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                )}
                                <div className="flex-1 min-w-0">
                                  {att.url ? (
                                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-cream/60 hover:text-cream/80 truncate block transition-colors">
                                      {att.label}{att.fileSize ? ` (${formatFileSize(att.fileSize)})` : ''}
                                    </a>
                                  ) : (
                                    <span className="text-[11px] text-cream/60 truncate block">{att.label}</span>
                                  )}
                                  {att.type === 'text' && att.body && (
                                    <p className="text-[10px] text-cream/30 line-clamp-1 mt-0.5">{att.body}</p>
                                  )}
                                </div>
                                {!readOnly && (
                                  <button
                                    type="button"
                                    onClick={() => removeChangeAttachment(change.id, att.id)}
                                    className="shrink-0 text-cream/20 hover:text-red-400/50 transition-colors md:opacity-0 md:group-hover:opacity-100"
                                    title="Remove"
                                  >
                                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Metadata + actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-cream/6">
                        <div className="text-[10px] text-cream/25">
                          Added {new Date(change.created_at).toLocaleDateString()}
                          {change.created_by && ` by ${change.created_by}`}
                          {change.updated_at !== change.created_at && (
                            <> · Modified {new Date(change.updated_at).toLocaleDateString()}
                              {change.updated_by && ` by ${change.updated_by}`}
                            </>
                          )}
                        </div>
                        {!readOnly && (
                          confirmRemoveId === change.id ? (
                            <div className="flex items-center gap-1.5">
                              <button type="button" onClick={() => handleRemoveFromPlan(change.id, 'pending')} className="text-[10px] text-amber-400/70 hover:text-amber-400">To pending</button>
                              <button type="button" onClick={() => handleRemoveFromPlan(change.id, 'closed')} className="text-[10px] text-cream/40 hover:text-cream/60">Not needed</button>
                              <button type="button" onClick={() => setConfirmRemoveId(null)} className="text-[10px] text-cream/30">Cancel</button>
                            </div>
                          ) : (
                            <button type="button" onClick={() => setConfirmRemoveId(change.id)} className="text-[10px] text-cream/20 hover:text-cream/40 transition-colors">Remove from plan</button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
