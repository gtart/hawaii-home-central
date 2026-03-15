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
  const [newLabel, setNewLabel] = useState('')
  const [newDocType, setNewDocType] = useState<DocType | ''>('')
  const [newUrl, setNewUrl] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [docTypeOpen, setDocTypeOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const docTypeRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
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
        doc_scope: 'reference',
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
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
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

  function renderDocRow(doc: typeof documents[0]) {
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

          {doc.uploadedAt && (
            <span className="text-[10px] text-cream/45 block mt-0.5">
              Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
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

        {/* Current / Outdated toggle */}
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
              title="Delete file"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )
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
      readOnly={readOnly}
    />
  ) : null

  return (
    <div className="space-y-4">
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
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-semibold text-cream/90">Latest Reference Files</h2>
          {documents.length > 0 && (
            <span className="text-[11px] text-cream/45 tabular-nums">{documents.length}</span>
          )}
        </div>
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-sandstone/80 hover:text-sandstone bg-sandstone/10 hover:bg-sandstone/15 transition-colors disabled:opacity-50"
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

      {documents.length === 0 && !showAddForm && (
        <p className="text-sm text-cream/50">
          No reference files yet. Upload the files you&apos;re currently working from — plans, specs, contracts, photos.
        </p>
      )}

      {uploadError && (
        <p className="text-[11px] text-red-400/70">{uploadError}</p>
      )}

      {/* Current files */}
      {currentDocs.length > 0 && (
        <div className="space-y-2">
          {currentDocs.map(renderDocRow)}
        </div>
      )}

      {/* Outdated files — collapsed */}
      {outdatedDocs.length > 0 && (
        <details>
          <summary className="text-[10px] text-cream/40 cursor-pointer hover:text-cream/55 transition-colors select-none">
            {outdatedDocs.length} outdated file{outdatedDocs.length !== 1 ? 's' : ''}
          </summary>
          <div className="mt-2 space-y-2">
            {outdatedDocs.map(renderDocRow)}
          </div>
        </details>
      )}

      {/* Add form */}
      {showAddForm && !readOnly && (
        <div className="p-3 rounded-lg border border-cream/15 bg-stone-50 space-y-2">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="File name"
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
              placeholder="URL"
              className="flex-1 bg-stone-200 border border-cream/15 rounded-md px-2 py-1.5 text-xs text-cream/70 placeholder-cream/35 outline-none focus:border-sandstone/30"
            />
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
              {isUploading ? 'Uploading...' : 'Or Upload File'}
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
              Add File
            </button>
          </div>
        </div>
      )}

      {detailPanel}
    </div>
  )
}
