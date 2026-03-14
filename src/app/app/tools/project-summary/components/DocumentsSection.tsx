'use client'

import { useState, useRef, useEffect } from 'react'
import type { DocType, DocScope } from '@/data/project-summary'
import { DOC_TYPE_LABELS } from '../constants'
import type { ProjectSummaryStateAPI } from '../useProjectSummaryState'
import { uploadProjectSummaryFile } from '../uploadProjectSummaryFile'
import { SectionHeader } from './SectionHeader'
import { InlineEdit } from './InlineEdit'
import { FileDetailPanel } from './FileDetailPanel'

interface DocumentsSectionProps {
  api: ProjectSummaryStateAPI
  /** When true, renders content without the SectionHeader card wrapper (for embedding inside another card) */
  inline?: boolean
  /** Plan approval timestamp — used to show "Added after approval" badge */
  planApprovedAt?: string | null
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileTypeIcon(mimeType?: string): string {
  if (!mimeType) return 'doc'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType === 'application/pdf') return 'pdf'
  return 'doc'
}

export function DocumentsSection({ api, inline, planApprovedAt }: DocumentsSectionProps) {
  const { payload, readOnly, addDocument, updateDocument, deleteDocument, collectionId } = api
  const { documents } = payload
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newDocType, setNewDocType] = useState<DocType | ''>('')
  const [newDocScope, setNewDocScope] = useState<DocScope>('plan')
  const [newUrl, setNewUrl] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [docTypeOpen, setDocTypeOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const docTypeRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const quickUploadRef = useRef<HTMLInputElement>(null)

  // Close doc type dropdown on outside click
  useEffect(() => {
    if (!docTypeOpen) return
    function handleClick(e: MouseEvent) {
      if (docTypeRef.current && !docTypeRef.current.contains(e.target as Node)) {
        setDocTypeOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [docTypeOpen])

  function handleAdd() {
    if (!newLabel.trim()) return
    addDocument({
      label: newLabel.trim(),
      ...(newDocType ? { docType: newDocType } : {}),
      doc_scope: newDocScope,
      ...(newUrl.trim() ? { url: newUrl.trim() } : {}),
      isCurrent: true,
    })
    setNewLabel('')
    setNewDocType('')
    setNewDocScope('plan')
    setNewUrl('')
    setShowAddForm(false)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadError(null)

    try {
      const result = await uploadProjectSummaryFile(file)
      addDocument({
        label: newLabel.trim() || file.name.replace(/\.[^.]+$/, ''),
        ...(newDocType ? { docType: newDocType } : {}),
        doc_scope: newDocScope,
        fileUrl: result.url,
        fileName: result.fileName,
        fileSize: result.fileSize,
        mimeType: result.mimeType,
        uploadedAt: new Date().toISOString(),
        isCurrent: true,
      })
      setNewLabel('')
      setNewDocType('')
      setNewUrl('')
      setShowAddForm(false)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  /** Quick upload — bypasses the add form, uses filename as label */
  async function handleQuickUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadError(null)

    try {
      const result = await uploadProjectSummaryFile(file)
      addDocument({
        label: file.name.replace(/\.[^.]+$/, ''),
        doc_scope: 'plan',
        fileUrl: result.url,
        fileName: result.fileName,
        fileSize: result.fileSize,
        mimeType: result.mimeType,
        uploadedAt: new Date().toISOString(),
        isCurrent: true,
      })
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
      if (quickUploadRef.current) quickUploadRef.current.value = ''
    }
  }

  // Split documents by scope (PCV1-015, PCV1-017, PCV1-018)
  const planDocs = documents.filter((d) => !d.doc_scope || d.doc_scope === 'plan')
  const referenceDocs = documents.filter((d) => d.doc_scope === 'reference')

  const content = (
    <>
      {documents.length === 0 && !showAddForm && (
        <p className="text-sm text-cream/55 italic">No documents added yet.</p>
      )}

      {/* Plan Documents */}
      {planDocs.length > 0 && (
        <div className="mb-1">
          <span className="text-[10px] text-cream/50 uppercase tracking-wider font-medium">Plan Documents</span>
        </div>
      )}
      <div className="space-y-2">
        {planDocs.map((doc) => {
          const iconType = fileTypeIcon(doc.mimeType)
          return (
            <div
              key={doc.id}
              className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-stone-50 border border-cream/12 group cursor-pointer hover:border-cream/15 transition-colors"
              onClick={() => setSelectedDocId(doc.id)}
            >
              {/* Doc icon — varies by file type */}
              {iconType === 'pdf' ? (
                <svg className="w-4 h-4 text-red-400/40 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
                  <text x="7" y="18" fontSize="6" fill="currentColor" stroke="none" fontWeight="bold">PDF</text>
                </svg>
              ) : iconType === 'image' ? (
                <svg className="w-4 h-4 text-blue-400/40 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-cream/40 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <InlineEdit
                    value={doc.label}
                    onSave={(label) => updateDocument(doc.id, { label })}
                    readOnly={readOnly}
                    displayClassName="text-sm text-cream/80 font-medium"
                    className="text-sm font-medium"
                  />
                  {doc.docType && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-200 text-cream/50">
                      {DOC_TYPE_LABELS[doc.docType]}
                    </span>
                  )}
                  {doc.isCurrent && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-400/12 text-emerald-400/70">
                      Current
                    </span>
                  )}
                </div>

                {/* File link or URL */}
                {doc.fileUrl && (
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-sandstone/50 hover:text-sandstone transition-colors flex items-center gap-1 mt-0.5"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {doc.fileName || 'Download'}
                    {doc.fileSize ? ` (${formatFileSize(doc.fileSize)})` : ''}
                  </a>
                )}
                {doc.url && !doc.fileUrl && (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-sandstone/50 hover:text-sandstone transition-colors truncate block mt-0.5"
                  >
                    {doc.url}
                  </a>
                )}

                {/* Upload metadata */}
                {doc.uploadedAt && (
                  <span className="text-[10px] text-cream/45 block mt-0.5">
                    Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                    {doc.uploadedBy ? ` by ${doc.uploadedBy}` : ''}
                  </span>
                )}

                {/* Post-approval indicator */}
                {planApprovedAt && doc.uploadedAt && new Date(doc.uploadedAt) > new Date(planApprovedAt) && (
                  <span className="text-[10px] text-sandstone/60 italic block mt-0.5">
                    Added after approval
                  </span>
                )}

                {(doc.note || !readOnly) && (
                  <InlineEdit
                    value={doc.note || ''}
                    onSave={(note) => updateDocument(doc.id, { note: note || undefined })}
                    placeholder="Add a note..."
                    readOnly={readOnly}
                    displayClassName="text-xs text-cream/55 mt-1"
                    className="text-xs mt-1"
                  />
                )}
              </div>

              {/* Scope + Current toggles */}
              {!readOnly && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); updateDocument(doc.id, { doc_scope: 'reference' }) }}
                  className="shrink-0 text-[10px] text-cream/30 hover:text-cream/45 transition-colors opacity-0 group-hover:opacity-100"
                  title="Move to Reference Documents"
                >
                  Ref
                </button>
              )}
              {!readOnly && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); updateDocument(doc.id, { isCurrent: !doc.isCurrent }) }}
                  className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                    doc.isCurrent
                      ? 'bg-emerald-400/12 text-emerald-400/70 hover:bg-emerald-400/20'
                      : 'bg-stone-200 text-cream/40 hover:text-cream/55'
                  }`}
                  title={doc.isCurrent ? 'Mark as outdated' : 'Mark as current'}
                >
                  {doc.isCurrent ? 'Current' : 'Outdated'}
                </button>
              )}

              {/* Delete */}
              {!readOnly && (
                confirmDelete === doc.id ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); deleteDocument(doc.id); setConfirmDelete(null) }}
                      className="text-[10px] text-red-400/70 hover:text-red-400 transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(null) }}
                      className="text-[10px] text-cream/45 hover:text-cream/50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(doc.id) }}
                    className="shrink-0 text-cream/30 hover:text-red-400/50 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete document"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )
              )}
            </div>
          )
        })}
      </div>

      {/* Reference Documents (PCV1-018) */}
      {referenceDocs.length > 0 && (
        <>
          <div className="mt-4 mb-1">
            <span className="text-[10px] text-cream/50 uppercase tracking-wider font-medium">Reference Documents</span>
            <span className="text-[10px] text-cream/30 ml-2">Shared across plan and changes</span>
          </div>
          <div className="space-y-2">
            {referenceDocs.map((doc) => {
              const iconType = fileTypeIcon(doc.mimeType)
              return (
                <div
                  key={doc.id}
                  className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-stone-50 border border-cream/12 group cursor-pointer hover:border-cream/15 transition-colors"
                  onClick={() => setSelectedDocId(doc.id)}
                >
                  {iconType === 'pdf' ? (
                    <svg className="w-4 h-4 text-red-400/40 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
                      <text x="7" y="18" fontSize="6" fill="currentColor" stroke="none" fontWeight="bold">PDF</text>
                    </svg>
                  ) : iconType === 'image' ? (
                    <svg className="w-4 h-4 text-blue-400/40 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-cream/40 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  <div className="flex-1 min-w-0">
                    <InlineEdit
                      value={doc.label}
                      onSave={(label) => updateDocument(doc.id, { label })}
                      readOnly={readOnly}
                      displayClassName="text-sm text-cream/80 font-medium"
                      className="text-sm font-medium"
                    />
                    {doc.fileUrl && (
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-sandstone/50 hover:text-sandstone transition-colors flex items-center gap-1 mt-0.5">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {doc.fileName || 'Download'}
                        {doc.fileSize ? ` (${formatFileSize(doc.fileSize)})` : ''}
                      </a>
                    )}
                    {doc.url && !doc.fileUrl && (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-sandstone/50 hover:text-sandstone transition-colors truncate block mt-0.5">
                        {doc.url}
                      </a>
                    )}
                  </div>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); updateDocument(doc.id, { doc_scope: 'plan' }) }}
                      className="shrink-0 text-[10px] text-cream/35 hover:text-cream/55 transition-colors"
                      title="Move to Plan Documents"
                    >
                      Move to Plan
                    </button>
                  )}
                  {!readOnly && (
                    confirmDelete === doc.id ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <button type="button" onClick={(e) => { e.stopPropagation(); deleteDocument(doc.id); setConfirmDelete(null) }} className="text-[10px] text-red-400/70 hover:text-red-400 transition-colors">Delete</button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setConfirmDelete(null) }} className="text-[10px] text-cream/45 hover:text-cream/50 transition-colors">Cancel</button>
                      </div>
                    ) : (
                      <button type="button" onClick={(e) => { e.stopPropagation(); setConfirmDelete(doc.id) }} className="shrink-0 text-cream/30 hover:text-red-400/50 transition-colors opacity-0 group-hover:opacity-100" title="Delete document">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    )
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Add form */}
      {showAddForm && !readOnly && (
        <div className="mt-3 p-3 rounded-lg border border-cream/15 bg-stone-50 space-y-2">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Document name"
            className="w-full bg-stone-200 border border-cream/15 rounded-md px-3 py-2 text-sm text-cream/90 placeholder-cream/35 outline-none focus:border-sandstone/30"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowAddForm(false) }}
          />
          <div className="flex gap-2">
            <div className="relative" ref={docTypeRef}>
              <button
                type="button"
                onClick={() => setDocTypeOpen(!docTypeOpen)}
                className="bg-stone-200 border border-cream/15 rounded-md px-2 py-1.5 text-xs text-cream/70 outline-none hover:border-cream/35 transition-colors flex items-center gap-1 whitespace-nowrap"
              >
                {newDocType ? DOC_TYPE_LABELS[newDocType] : 'Type (optional)'}
                <svg className="w-3 h-3 text-cream/45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {docTypeOpen && (
                <div className="absolute left-0 top-8 z-50 w-36 rounded-lg border border-cream/15 bg-basalt shadow-xl py-1">
                  <button
                    type="button"
                    onClick={() => { setNewDocType(''); setDocTypeOpen(false) }}
                    className={`w-full px-3 py-1.5 text-left text-xs transition-colors ${!newDocType ? 'text-sandstone' : 'text-cream/70 hover:bg-stone-hover'}`}
                  >
                    None
                  </button>
                  {Object.entries(DOC_TYPE_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => { setNewDocType(key as DocType); setDocTypeOpen(false) }}
                      className={`w-full px-3 py-1.5 text-left text-xs transition-colors ${newDocType === key ? 'text-sandstone' : 'text-cream/70 hover:bg-stone-hover'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="URL (optional)"
              className="flex-1 bg-stone-200 border border-cream/15 rounded-md px-2 py-1.5 text-xs text-cream/70 placeholder-cream/35 outline-none focus:border-sandstone/30"
            />
          </div>

          {/* Document scope toggle (PCV1-015, PCV1-018) */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-cream/45">Belongs to:</span>
            <button
              type="button"
              onClick={() => setNewDocScope('plan')}
              className={`text-[10px] px-2 py-1 rounded transition-colors ${
                newDocScope === 'plan' ? 'bg-cream/15 text-cream/80' : 'text-cream/40 hover:text-cream/55'
              }`}
            >
              Plan
            </button>
            <button
              type="button"
              onClick={() => setNewDocScope('reference')}
              className={`text-[10px] px-2 py-1 rounded transition-colors ${
                newDocScope === 'reference' ? 'bg-cream/15 text-cream/80' : 'text-cream/40 hover:text-cream/55'
              }`}
            >
              Reference (shared)
            </button>
          </div>

          {/* File upload */}
          <div className="flex items-center gap-2">
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
              className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-cream/55 hover:text-cream/70 bg-stone-200 hover:bg-stone-hover border border-cream/15 rounded-md transition-colors disabled:opacity-50"
            >
              {isUploading ? (
                <div className="w-3 h-3 border border-cream/20 border-t-cream/50 rounded-full animate-spin" />
              ) : (
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {isUploading ? 'Uploading...' : 'Upload File'}
            </button>
            <span className="text-[10px] text-cream/35">PDF, DOC, DOCX, images — max 20MB</span>
          </div>

          {uploadError && (
            <p className="text-[11px] text-red-400/70">{uploadError}</p>
          )}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => { setShowAddForm(false); setUploadError(null) }}
              className="px-3 py-1.5 text-xs text-cream/55 hover:text-cream/70 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newLabel.trim()}
              className="px-3 py-1.5 text-xs bg-sandstone/20 text-sandstone hover:bg-sandstone/30 rounded-md transition-colors disabled:opacity-30"
            >
              Add Document
            </button>
          </div>
        </div>
      )}
    </>
  )

  const selectedDoc = selectedDocId ? documents.find((d) => d.id === selectedDocId) : null

  const detailPanel = selectedDoc && collectionId ? (
    <FileDetailPanel
      document={selectedDoc}
      collectionId={collectionId}
      onClose={() => setSelectedDocId(null)}
      onUpdateNote={(note) => updateDocument(selectedDoc.id, { note: note || undefined })}
      readOnly={readOnly}
    />
  ) : null

  if (inline) {
    return (
      <div className="pt-4 border-t border-cream/12">
        {/* Hidden quick-upload input */}
        <input
          ref={quickUploadRef}
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.heic,.heif,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf"
          onChange={handleQuickUpload}
          className="hidden"
          disabled={isUploading}
        />
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] text-cream/55 uppercase tracking-wider font-medium">Documents &amp; Files</span>
          {!readOnly && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="text-[10px] text-cream/35 hover:text-cream/55 transition-colors"
              >
                Link URL
              </button>
              <button
                type="button"
                onClick={() => quickUploadRef.current?.click()}
                disabled={isUploading}
                className="inline-flex items-center gap-1 text-[10px] text-cream/55 hover:text-cream/70 bg-stone-200 hover:bg-stone-hover border border-cream/15 rounded-md px-2 py-1 transition-colors disabled:opacity-50"
                title="Upload file"
              >
                {isUploading ? (
                  <div className="w-3 h-3 border border-cream/20 border-t-cream/50 rounded-full animate-spin" />
                ) : (
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {isUploading ? 'Uploading...' : 'Upload File'}
              </button>
            </div>
          )}
        </div>
        {uploadError && (
          <p className="text-[11px] text-red-400/70 mb-2">{uploadError}</p>
        )}
        {content}
        {detailPanel}
      </div>
    )
  }

  return (
    <SectionHeader
      title="Documents"
      count={documents.length}
      onAdd={!readOnly ? () => quickUploadRef.current?.click() : undefined}
      addLabel="Upload File"
      readOnly={readOnly}
      extraActions={!readOnly ? (
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-[10px] text-cream/35 hover:text-cream/55 transition-colors"
        >
          Link URL
        </button>
      ) : undefined}
    >
      <input
        ref={quickUploadRef}
        type="file"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.heic,.heif,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf"
        onChange={handleQuickUpload}
        className="hidden"
        disabled={isUploading}
      />
      {uploadError && (
        <p className="text-[11px] text-red-400/70 mb-2">{uploadError}</p>
      )}
      {content}
      {detailPanel}
    </SectionHeader>
  )
}
