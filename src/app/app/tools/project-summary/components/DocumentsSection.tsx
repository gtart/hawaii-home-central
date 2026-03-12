'use client'

import { useState, useRef, useEffect } from 'react'
import type { DocType } from '@/data/project-summary'
import { DOC_TYPE_LABELS } from '../constants'
import type { ProjectSummaryStateAPI } from '../useProjectSummaryState'
import { uploadProjectSummaryFile } from '../uploadProjectSummaryFile'
import { SectionHeader } from './SectionHeader'
import { InlineEdit } from './InlineEdit'

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
  const { payload, readOnly, addDocument, updateDocument, deleteDocument } = api
  const { documents } = payload
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

  return (
    <SectionHeader
      title="Key Plan Documents"
      count={documents.length}
      onAdd={() => setShowAddForm(!showAddForm)}
      addLabel="Add Document"
      readOnly={readOnly}
    >
      {documents.length === 0 && !showAddForm && (
        <p className="text-sm text-cream/30 italic">No documents added yet.</p>
      )}

      <div className="space-y-2">
        {documents.map((doc) => {
          const iconType = fileTypeIcon(doc.mimeType)
          return (
            <div
              key={doc.id}
              className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-cream/[0.02] border border-cream/[0.04] group"
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
                <svg className="w-4 h-4 text-cream/25 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
                    displayClassName="text-sm text-cream/70 font-medium"
                    className="text-sm font-medium"
                  />
                  {doc.docType && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cream/5 text-cream/35">
                      {DOC_TYPE_LABELS[doc.docType]}
                    </span>
                  )}
                  {doc.isCurrent && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-400/10 text-emerald-400/70">
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
                  <span className="text-[10px] text-cream/20 block mt-0.5">
                    Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                    {doc.uploadedBy ? ` by ${doc.uploadedBy}` : ''}
                  </span>
                )}

                {(doc.note || !readOnly) && (
                  <InlineEdit
                    value={doc.note || ''}
                    onSave={(note) => updateDocument(doc.id, { note: note || undefined })}
                    placeholder="Add a note..."
                    readOnly={readOnly}
                    displayClassName="text-xs text-cream/40 mt-1"
                    className="text-xs mt-1"
                  />
                )}
              </div>

              {/* Current toggle */}
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => updateDocument(doc.id, { isCurrent: !doc.isCurrent })}
                  className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                    doc.isCurrent
                      ? 'bg-emerald-400/10 text-emerald-400/70 hover:bg-emerald-400/20'
                      : 'bg-cream/5 text-cream/25 hover:text-cream/40'
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
                      onClick={() => { deleteDocument(doc.id); setConfirmDelete(null) }}
                      className="text-[10px] text-red-400/70 hover:text-red-400 transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(null)}
                      className="text-[10px] text-cream/30 hover:text-cream/50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(doc.id)}
                    className="shrink-0 text-cream/15 hover:text-red-400/50 transition-colors opacity-0 group-hover:opacity-100"
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

      {/* Add form */}
      {showAddForm && !readOnly && (
        <div className="mt-3 p-3 rounded-lg border border-cream/10 bg-cream/[0.03] space-y-2">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Document name"
            className="w-full bg-cream/5 border border-cream/10 rounded-md px-3 py-2 text-sm text-cream/80 placeholder-cream/20 outline-none focus:border-sandstone/30"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowAddForm(false) }}
          />
          <div className="flex gap-2">
            <div className="relative" ref={docTypeRef}>
              <button
                type="button"
                onClick={() => setDocTypeOpen(!docTypeOpen)}
                className="bg-cream/5 border border-cream/10 rounded-md px-2 py-1.5 text-xs text-cream/60 outline-none hover:border-cream/20 transition-colors flex items-center gap-1 whitespace-nowrap"
              >
                {newDocType ? DOC_TYPE_LABELS[newDocType] : 'Type (optional)'}
                <svg className="w-3 h-3 text-cream/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {docTypeOpen && (
                <div className="absolute left-0 top-8 z-50 w-36 rounded-lg border border-cream/10 bg-[#1a1a1a] shadow-xl py-1">
                  <button
                    type="button"
                    onClick={() => { setNewDocType(''); setDocTypeOpen(false) }}
                    className={`w-full px-3 py-1.5 text-left text-xs transition-colors ${!newDocType ? 'text-sandstone' : 'text-cream/60 hover:bg-cream/5'}`}
                  >
                    None
                  </button>
                  {Object.entries(DOC_TYPE_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => { setNewDocType(key as DocType); setDocTypeOpen(false) }}
                      className={`w-full px-3 py-1.5 text-left text-xs transition-colors ${newDocType === key ? 'text-sandstone' : 'text-cream/60 hover:bg-cream/5'}`}
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
              className="flex-1 bg-cream/5 border border-cream/10 rounded-md px-2 py-1.5 text-xs text-cream/60 placeholder-cream/20 outline-none focus:border-sandstone/30"
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
              className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-cream/40 hover:text-cream/60 bg-cream/5 hover:bg-cream/8 border border-cream/10 rounded-md transition-colors disabled:opacity-50"
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
            <span className="text-[10px] text-cream/20">PDF, DOC, DOCX, images — max 20MB</span>
          </div>

          {uploadError && (
            <p className="text-[11px] text-red-400/70">{uploadError}</p>
          )}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => { setShowAddForm(false); setUploadError(null) }}
              className="px-3 py-1.5 text-xs text-cream/40 hover:text-cream/60 transition-colors"
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
    </SectionHeader>
  )
}
