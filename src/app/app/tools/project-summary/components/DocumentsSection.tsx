'use client'

import { useState, useRef, useEffect } from 'react'
import type { DocType } from '@/data/project-summary'
import { DOC_TYPE_LABELS } from '../constants'
import type { ProjectSummaryStateAPI } from '../useProjectSummaryState'
import { uploadProjectSummaryFile } from '../uploadProjectSummaryFile'
import { InlineEdit } from './InlineEdit'
import { FileDetailPanel } from './FileDetailPanel'

interface DocumentsSectionProps {
  api: ProjectSummaryStateAPI
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

export function DocumentsSection({ api }: DocumentsSectionProps) {
  const { payload, readOnly, addDocument, updateDocument, deleteDocument, collectionId } = api
  const { documents } = payload
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showTextForm, setShowTextForm] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newDocType, setNewDocType] = useState<DocType | ''>('')
  const [newUrl, setNewUrl] = useState('')
  const [newTextTitle, setNewTextTitle] = useState('')
  const [newTextBody, setNewTextBody] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [docTypeOpen, setDocTypeOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const docTypeRef = useRef<HTMLDivElement>(null)
  const quickUploadRef = useRef<HTMLInputElement>(null)

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
      contentType: 'link',
      ...(newDocType ? { docType: newDocType } : {}),
      doc_scope: 'reference',
      ...(newUrl.trim() ? { url: newUrl.trim() } : {}),
      isCurrent: true,
    })
    setNewLabel('')
    setNewDocType('')
    setNewUrl('')
    setShowAddForm(false)
  }

  function handleAddText() {
    if (!newTextTitle.trim()) return
    addDocument({
      label: newTextTitle.trim(),
      contentType: 'text',
      body: newTextBody.trim() || undefined,
      doc_scope: 'reference',
      isCurrent: true,
    })
    setNewTextTitle('')
    setNewTextBody('')
    setShowTextForm(false)
  }

  async function handleQuickUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadError(null)

    try {
      const result = await uploadProjectSummaryFile(file)
      addDocument({
        label: file.name.replace(/\.[^.]+$/, ''),
        doc_scope: 'reference',
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

  // Separate current vs outdated
  const currentDocs = documents.filter((d) => d.isCurrent !== false)
  const outdatedDocs = documents.filter((d) => d.isCurrent === false)

  function renderFileIcon(mimeType?: string) {
    const iconType = fileTypeIcon(mimeType)
    if (iconType === 'pdf') {
      return (
        <svg className="w-5 h-5 text-red-400/50 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
          <text x="7" y="18" fontSize="6" fill="currentColor" stroke="none" fontWeight="bold">PDF</text>
        </svg>
      )
    }
    if (iconType === 'image') {
      return (
        <svg className="w-5 h-5 text-blue-400/50 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    }
    return (
      <svg className="w-5 h-5 text-cream/35 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  function renderTextIcon() {
    return (
      <svg className="w-5 h-5 text-sandstone/50 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  function renderDocActions(doc: typeof documents[0]) {
    if (readOnly) return null
    return (
      <div className="flex items-center gap-1 shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); updateDocument(doc.id, { isCurrent: false }) }}
          className="text-[10px] px-1.5 py-0.5 rounded text-cream/30 hover:text-cream/50 hover:bg-stone-200 transition-colors"
          title="Mark as outdated"
        >
          Archive
        </button>
        {confirmDelete === doc.id ? (
          <>
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
          </>
        ) : (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(doc.id) }}
            className="text-cream/20 hover:text-red-400/50 transition-colors"
            title="Delete"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
    )
  }

  function renderCurrentDoc(doc: typeof documents[0]) {
    const isTextEntry = doc.contentType === 'text'

    if (isTextEntry) {
      return (
        <div
          key={doc.id}
          className="px-4 py-3 rounded-lg bg-stone-50 border border-sandstone/10 group cursor-pointer hover:border-sandstone/20 transition-colors"
          onClick={() => setSelectedDocId(doc.id)}
        >
          <div className="flex items-start gap-3">
            {renderTextIcon()}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <InlineEdit
                  value={doc.label}
                  onSave={(label) => updateDocument(doc.id, { label })}
                  readOnly={readOnly}
                  displayClassName="text-sm text-cream/85 font-medium"
                  className="text-sm font-medium"
                />
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-sandstone/10 text-sandstone/60">Text</span>
              </div>
              {doc.body && (
                <p className="text-xs text-cream/50 mt-1 line-clamp-2 leading-relaxed">{doc.body}</p>
              )}
              {doc.sourceChangeTitle && (
                <span className="text-[10px] text-cream/35 block mt-1">
                  From change: <span className="text-cream/45">{doc.sourceChangeTitle}</span>
                </span>
              )}
              {doc.created_at && (
                <span className="text-[10px] text-cream/35 block mt-1">
                  Added {new Date(doc.created_at).toLocaleDateString()}
                </span>
              )}
            </div>
            {renderDocActions(doc)}
          </div>
        </div>
      )
    }

    return (
      <div
        key={doc.id}
        className="flex items-start gap-3 px-4 py-3 rounded-lg bg-stone-50 border border-emerald-400/10 group cursor-pointer hover:border-emerald-400/20 transition-colors"
        onClick={() => setSelectedDocId(doc.id)}
      >
        {renderFileIcon(doc.mimeType)}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <InlineEdit
              value={doc.label}
              onSave={(label) => updateDocument(doc.id, { label })}
              readOnly={readOnly}
              displayClassName="text-sm text-cream/85 font-medium"
              className="text-sm font-medium"
            />
            {doc.docType && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-200 text-cream/45">
                {DOC_TYPE_LABELS[doc.docType]}
              </span>
            )}
          </div>

          {doc.fileUrl && (
            <a
              href={doc.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[11px] text-sandstone/50 hover:text-sandstone transition-colors flex items-center gap-1 mt-0.5"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Download{doc.fileSize ? ` (${formatFileSize(doc.fileSize)})` : ''}
            </a>
          )}
          {doc.url && !doc.fileUrl && (
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[11px] text-sandstone/50 hover:text-sandstone transition-colors truncate block mt-0.5"
            >
              {doc.url}
            </a>
          )}

          {doc.uploadedAt && (
            <span className="text-[10px] text-cream/35 block mt-0.5">
              Added {new Date(doc.uploadedAt).toLocaleDateString()}
            </span>
          )}

          {doc.sourceChangeTitle && (
            <span className="text-[10px] text-cream/35 block mt-0.5">
              From change: <span className="text-cream/45">{doc.sourceChangeTitle}</span>
            </span>
          )}

          {(doc.note || !readOnly) && (
            <InlineEdit
              value={doc.note || ''}
              onSave={(note) => updateDocument(doc.id, { note: note || undefined })}
              placeholder="Add a description..."
              readOnly={readOnly}
              displayClassName="text-xs text-cream/50 mt-1"
              className="text-xs mt-1"
            />
          )}
        </div>

        {renderDocActions(doc)}
      </div>
    )
  }

  function renderOutdatedDoc(doc: typeof documents[0]) {
    const isTextEntry = doc.contentType === 'text'

    return (
      <div
        key={doc.id}
        className="flex items-center gap-3 px-3 py-2 rounded-lg bg-stone-50/50 border border-cream/8 group cursor-pointer hover:border-cream/12 transition-colors"
        onClick={() => setSelectedDocId(doc.id)}
      >
        {isTextEntry ? renderTextIcon() : renderFileIcon(doc.mimeType)}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-cream/50 truncate">{doc.label}</span>
            {isTextEntry && (
              <span className="text-[9px] px-1 py-0.5 rounded bg-sandstone/8 text-sandstone/40">Text</span>
            )}
          </div>
          {!isTextEntry && doc.docType && (
            <span className="text-[10px] text-cream/30">{DOC_TYPE_LABELS[doc.docType]}</span>
          )}
          {isTextEntry && doc.body && (
            <p className="text-[10px] text-cream/30 truncate mt-0.5">{doc.body}</p>
          )}
        </div>

        {/* Actions — visible on mobile, hover-reveal on desktop */}
        {!readOnly && (
          <div className="flex items-center gap-1 shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); updateDocument(doc.id, { isCurrent: true }) }}
              className="text-[10px] px-1.5 py-0.5 rounded text-cream/30 hover:text-emerald-400/70 hover:bg-emerald-400/8 transition-colors"
              title="Mark as current"
            >
              Restore
            </button>
            {confirmDelete === doc.id ? (
              <>
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
              </>
            ) : (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setConfirmDelete(doc.id) }}
                className="text-cream/20 hover:text-red-400/50 transition-colors"
                title="Delete"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  const selectedDoc = selectedDocId ? documents.find((d) => d.id === selectedDocId) : null

  const detailPanel = selectedDoc && collectionId ? (
    <FileDetailPanel
      document={selectedDoc}
      collectionId={collectionId}
      onClose={() => setSelectedDocId(null)}
      onUpdateNote={(note) => updateDocument(selectedDoc.id, { note: note || undefined })}
      onUpdateBody={(body) => updateDocument(selectedDoc.id, { body: body || undefined })}
      readOnly={readOnly}
    />
  ) : null

  return (
    <div className="space-y-3">
      {/* Hidden quick-upload input */}
      <input
        ref={quickUploadRef}
        type="file"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.heic,.heif,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf"
        onChange={handleQuickUpload}
        className="hidden"
        disabled={isUploading}
      />

      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-cream/50 uppercase tracking-wider">Plan&apos;s Files</h2>
        {!readOnly && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => quickUploadRef.current?.click()}
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
              onClick={() => { setShowAddForm(!showAddForm); setShowTextForm(false) }}
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
              onClick={() => { setShowTextForm(!showTextForm); setShowAddForm(false) }}
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

      {/* Empty state */}
      {documents.length === 0 && !showAddForm && (
        <div className="rounded-lg border border-dashed border-cream/12 px-4 py-6 text-center">
          <p className="text-sm text-cream/45 mb-1">No files yet</p>
          <p className="text-xs text-cream/30">Plans, contracts, agreed-upon images, and other reference files. Files from accepted changes are added here automatically.</p>
        </div>
      )}

      {uploadError && (
        <p className="text-[11px] text-red-400/70">{uploadError}</p>
      )}

      {/* Current files */}
      {currentDocs.length > 0 && (
        <div className="space-y-2">
          {currentDocs.map(renderCurrentDoc)}
        </div>
      )}

      {/* Outdated files — collapsed */}
      {outdatedDocs.length > 0 && (
        <details className="mt-2">
          <summary className="text-[10px] text-cream/30 cursor-pointer hover:text-cream/45 transition-colors select-none">
            {outdatedDocs.length} archived{outdatedDocs.length !== 1 ? '' : ''}
          </summary>
          <div className="mt-2 space-y-1.5">
            {outdatedDocs.map(renderOutdatedDoc)}
          </div>
        </details>
      )}

      {/* Add form (URL link) */}
      {showAddForm && !readOnly && (
        <div className="p-3 rounded-lg border border-cream/12 bg-stone-50 space-y-2">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Link name"
            className="w-full bg-stone-200 border border-cream/12 rounded-md px-3 py-2 text-sm text-cream/90 placeholder-cream/30 outline-none focus:border-sandstone/30"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowAddForm(false) }}
          />
          <div className="flex gap-2">
            <div className="relative" ref={docTypeRef}>
              <button
                type="button"
                onClick={() => setDocTypeOpen(!docTypeOpen)}
                className="bg-stone-200 border border-cream/12 rounded-md px-2 py-1.5 text-xs text-cream/60 outline-none hover:border-cream/25 transition-colors flex items-center gap-1 whitespace-nowrap"
              >
                {newDocType ? DOC_TYPE_LABELS[newDocType] : 'Type'}
                <svg className="w-3 h-3 text-cream/35" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {docTypeOpen && (
                <div className="absolute left-0 top-8 z-50 w-36 rounded-lg border border-cream/12 bg-basalt shadow-xl py-1">
                  <button
                    type="button"
                    onClick={() => { setNewDocType(''); setDocTypeOpen(false) }}
                    className={`w-full px-3 py-1.5 text-left text-xs transition-colors ${!newDocType ? 'text-sandstone' : 'text-cream/60 hover:bg-stone-hover'}`}
                  >
                    None
                  </button>
                  {Object.entries(DOC_TYPE_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => { setNewDocType(key as DocType); setDocTypeOpen(false) }}
                      className={`w-full px-3 py-1.5 text-left text-xs transition-colors ${newDocType === key ? 'text-sandstone' : 'text-cream/60 hover:bg-stone-hover'}`}
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
              placeholder="URL"
              className="flex-1 bg-stone-200 border border-cream/12 rounded-md px-2 py-1.5 text-xs text-cream/60 placeholder-cream/30 outline-none focus:border-sandstone/30"
            />
          </div>

          {uploadError && (
            <p className="text-[11px] text-red-400/70">{uploadError}</p>
          )}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => { setShowAddForm(false); setUploadError(null) }}
              className="px-3 py-1.5 text-xs text-cream/45 hover:text-cream/60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newLabel.trim()}
              className="px-3 py-1.5 text-xs bg-sandstone/15 text-sandstone hover:bg-sandstone/25 rounded-md transition-colors disabled:opacity-30"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Add text content form */}
      {showTextForm && !readOnly && (
        <div className="p-3 rounded-lg border border-cream/12 bg-stone-50 space-y-2">
          <input
            type="text"
            value={newTextTitle}
            onChange={(e) => setNewTextTitle(e.target.value)}
            placeholder="Title — e.g. 'Scope addendum' or 'Spec notes'"
            className="w-full bg-stone-200 border border-cream/12 rounded-md px-3 py-2 text-sm text-cream/90 placeholder-cream/30 outline-none focus:border-sandstone/30"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Escape') { setShowTextForm(false); setNewTextTitle(''); setNewTextBody('') } }}
          />
          <textarea
            value={newTextBody}
            onChange={(e) => setNewTextBody(e.target.value)}
            placeholder="Write your content here..."
            rows={6}
            className="w-full bg-stone-200 border border-cream/12 rounded-md px-3 py-2 text-xs text-cream/65 placeholder-cream/30 outline-none focus:border-sandstone/30 resize-y"
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => { setShowTextForm(false); setNewTextTitle(''); setNewTextBody('') }}
              className="px-3 py-1.5 text-xs text-cream/45 hover:text-cream/60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddText}
              disabled={!newTextTitle.trim()}
              className="px-3 py-1.5 text-xs bg-sandstone/15 text-sandstone hover:bg-sandstone/25 rounded-md transition-colors disabled:opacity-30"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {detailPanel}
    </div>
  )
}
