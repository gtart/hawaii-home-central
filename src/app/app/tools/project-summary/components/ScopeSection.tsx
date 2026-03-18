'use client'

import { useState, useRef, useEffect } from 'react'
import type { ScopeObject, ScopeStatus, ChangeAttachment } from '@/data/project-summary'
import { SCOPE_STATUS_CONFIG, SCOPE_STATUS_ORDER } from '../constants'
import { StatusBadge } from './StatusBadge'
import { InlineEdit } from './InlineEdit'
import { uploadProjectSummaryFile } from '../uploadProjectSummaryFile'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface ScopeSectionProps {
  scope: ScopeObject
  onTextChange: (text: string) => void
  onSave: () => void
  onStatusChange: (status: ScopeStatus) => void
  onAddAttachment: (att: Omit<ChangeAttachment, 'id'>) => void
  onRemoveAttachment: (id: string) => void
  readOnly: boolean
  isLocked?: boolean
}

export function ScopeSection({
  scope,
  onTextChange,
  onSave,
  onStatusChange,
  onAddAttachment,
  onRemoveAttachment,
  readOnly,
  isLocked,
}: ScopeSectionProps) {
  const [statusOpen, setStatusOpen] = useState(false)
  const statusRef = useRef<HTMLDivElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [showUrlForm, setShowUrlForm] = useState(false)
  const [showTextForm, setShowTextForm] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [urlLabelInput, setUrlLabelInput] = useState('')
  const [textTitle, setTextTitle] = useState('')
  const [textBody, setTextBody] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const disabled = readOnly || isLocked
  const statusConfig = SCOPE_STATUS_CONFIG[scope.status]

  // Close status dropdown on outside click
  useEffect(() => {
    if (!statusOpen) return
    function handleClick(e: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [statusOpen])

  // Determine if Save button should be enabled
  const lastSnapshot = scope.snapshots[scope.snapshots.length - 1]
  const hasUnsavedChanges = scope.text.length > 0 && (!lastSnapshot || lastSnapshot.text !== scope.text)

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    setUploadError(null)
    try {
      const result = await uploadProjectSummaryFile(file)
      onAddAttachment({
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
    if (!urlInput.trim()) return
    onAddAttachment({
      type: 'url',
      url: urlInput.trim(),
      label: urlLabelInput.trim() || urlInput.trim(),
    })
    setUrlInput('')
    setUrlLabelInput('')
    setShowUrlForm(false)
  }

  function handleAddText() {
    if (!textTitle.trim()) return
    onAddAttachment({
      type: 'text',
      label: textTitle.trim(),
      body: textBody.trim() || undefined,
    })
    setTextTitle('')
    setTextBody('')
    setShowTextForm(false)
  }

  return (
    <div>
      {/* Header row: label + status badge + save button */}
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold text-cream/65 uppercase tracking-wider">Scope of Work</label>
        <div className="flex items-center gap-2">
          {/* Status dropdown */}
          <div className="relative" ref={statusRef}>
            <StatusBadge
              label={statusConfig.label}
              color={statusConfig.color}
              bgColor={statusConfig.bgColor}
              onClick={disabled ? undefined : () => setStatusOpen(!statusOpen)}
              readOnly={disabled}
            />
            {statusOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 min-w-[150px] rounded-lg border border-cream/12 bg-basalt shadow-xl py-1">
                {SCOPE_STATUS_ORDER.map((s) => {
                  const cfg = SCOPE_STATUS_CONFIG[s]
                  const isActive = s === scope.status
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (s !== scope.status) onStatusChange(s)
                        setStatusOpen(false)
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

          {/* Save button */}
          {!disabled && (
            <button
              type="button"
              onClick={onSave}
              disabled={!hasUnsavedChanges}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-sandstone/70 hover:text-sandstone bg-sandstone/8 hover:bg-sandstone/12 transition-colors disabled:opacity-30 disabled:cursor-default disabled:hover:text-sandstone/70 disabled:hover:bg-sandstone/8"
            >
              Save
            </button>
          )}
        </div>
      </div>

      {/* Scope text */}
      <InlineEdit
        value={scope.text}
        onSave={onTextChange}
        placeholder="What are you renovating? e.g. 'Full kitchen and master bath remodel'"
        readOnly={disabled}
        multiline
        displayClassName="text-sm text-cream/80 leading-relaxed"
        className="text-sm leading-relaxed"
      />

      {/* Last saved metadata */}
      {scope.saved_at && (
        <p className="text-[10px] text-cream/40 mt-1.5">
          Last saved {new Date(scope.saved_at).toLocaleDateString()}
          {scope.saved_by && ` by ${scope.saved_by}`}
        </p>
      )}

      {/* Attachments */}
      <div className="mt-4">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.heic,.heif,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf"
          className="hidden"
          onChange={handleFileUpload}
        />

        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] text-cream/50 uppercase tracking-wider">Files</label>
          {!disabled && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
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
                onClick={() => { setShowUrlForm(!showUrlForm); setShowTextForm(false) }}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] text-cream/35 hover:text-cream/50 bg-cream/5 hover:bg-cream/8 transition-colors"
              >
                Add a link
              </button>
              <button
                type="button"
                onClick={() => { setShowTextForm(!showTextForm); setShowUrlForm(false) }}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] text-cream/35 hover:text-cream/50 bg-cream/5 hover:bg-cream/8 transition-colors"
              >
                Add Content
              </button>
            </div>
          )}
        </div>

        {uploadError && (
          <p className="text-[11px] text-red-400/70 mb-2">{uploadError}</p>
        )}

        {/* URL form */}
        {showUrlForm && !disabled && (
          <div className="mb-2 p-2 rounded border border-cream/10 bg-stone-50 space-y-1.5">
            <input type="text" value={urlLabelInput} onChange={(e) => setUrlLabelInput(e.target.value)} placeholder="Link name" className="w-full bg-stone-200 border border-cream/10 rounded px-2 py-1.5 text-xs text-cream/80 placeholder-cream/25 outline-none focus:border-sandstone/30" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleAddUrl(); if (e.key === 'Escape') setShowUrlForm(false) }} />
            <input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="URL" className="w-full bg-stone-200 border border-cream/10 rounded px-2 py-1 text-[11px] text-cream/50 placeholder-cream/25 outline-none focus:border-sandstone/30" onKeyDown={(e) => { if (e.key === 'Enter') handleAddUrl() }} />
            <div className="flex gap-1.5 justify-end">
              <button type="button" onClick={() => setShowUrlForm(false)} className="px-2 py-1 text-[10px] text-cream/35">Cancel</button>
              <button type="button" onClick={handleAddUrl} disabled={!urlInput.trim()} className="px-2 py-1 text-[10px] bg-sandstone/15 text-sandstone rounded disabled:opacity-30">Add</button>
            </div>
          </div>
        )}

        {/* Text form */}
        {showTextForm && !disabled && (
          <div className="mb-2 p-2 rounded border border-cream/10 bg-stone-50 space-y-1.5">
            <input type="text" value={textTitle} onChange={(e) => setTextTitle(e.target.value)} placeholder="Title" className="w-full bg-stone-200 border border-cream/10 rounded px-2 py-1.5 text-xs text-cream/80 placeholder-cream/25 outline-none focus:border-sandstone/30" autoFocus onKeyDown={(e) => { if (e.key === 'Escape') { setShowTextForm(false); setTextTitle(''); setTextBody('') } }} />
            <textarea value={textBody} onChange={(e) => setTextBody(e.target.value)} placeholder="Content..." rows={3} className="w-full bg-stone-200 border border-cream/10 rounded px-2 py-1.5 text-[11px] text-cream/50 placeholder-cream/25 outline-none focus:border-sandstone/30 resize-y" />
            <div className="flex gap-1.5 justify-end">
              <button type="button" onClick={() => { setShowTextForm(false); setTextTitle(''); setTextBody('') }} className="px-2 py-1 text-[10px] text-cream/35">Cancel</button>
              <button type="button" onClick={handleAddText} disabled={!textTitle.trim()} className="px-2 py-1 text-[10px] bg-sandstone/15 text-sandstone rounded disabled:opacity-30">Add</button>
            </div>
          </div>
        )}

        {/* Attachment list */}
        {scope.attachments.length === 0 && !showUrlForm && !showTextForm && (
          <p className="text-[10px] text-cream/25 italic">No files attached.</p>
        )}
        {scope.attachments.length > 0 && (
          <div className="space-y-1">
            {scope.attachments.map((att) => (
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
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => onRemoveAttachment(att.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-cream/25 hover:text-red-400/60 transition-all"
                    title="Remove"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Version History */}
      {scope.snapshots.length > 0 && (
        <details className="mt-4 group">
          <summary className="text-[10px] text-cream/45 uppercase tracking-wider font-medium cursor-pointer hover:text-cream/60 transition-colors select-none list-none flex items-center gap-1.5">
            <svg className="w-3 h-3 transition-transform group-open:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Version History ({scope.snapshots.length})
          </summary>
          <div className="mt-2 space-y-2 pl-1">
            {[...scope.snapshots].reverse().map((snap, i) => (
              <div key={`${snap.saved_at}-${i}`} className="border-l-2 border-cream/8 pl-3 py-1">
                <p className="text-[10px] text-cream/45 tabular-nums">
                  {new Date(snap.saved_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  {snap.saved_by && <span className="text-cream/30"> by {snap.saved_by}</span>}
                </p>
                <p className="text-[11px] text-cream/55 leading-relaxed mt-0.5 line-clamp-2">{snap.text}</p>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
