'use client'

import { useState, useRef, useMemo } from 'react'
import type { DecisionV3, DecisionFileV3 } from '@/data/finish-decisions'
import type { UploadFileResult } from '../uploadFile'

// ── Unified file entry (aggregated from decision.files + option.documents) ──

interface UnifiedFileEntry {
  id: string
  url: string
  thumbnailUrl?: string
  title: string
  fileName: string
  fileSize: number
  mimeType: string
  fileType: 'image' | 'document'
  optionId?: string
  optionName?: string
  source: 'decision-files' | 'option-documents'
  uploadedAt: string
  uploadedByName: string
  uploadedByEmail: string
}

// ── Helpers ──

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string | undefined) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function docTypeColor(mimeType: string | undefined): string {
  if (!mimeType) return 'text-cream/55'
  if (mimeType.startsWith('image/')) return 'text-purple-400'
  if (mimeType === 'application/pdf') return 'text-red-400'
  if (mimeType.includes('word') || mimeType === 'application/msword') return 'text-blue-400'
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'text-green-400'
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'text-orange-400'
  return 'text-cream/55'
}

function docTypeLabel(mimeType: string | undefined): string {
  if (!mimeType) return 'FILE'
  if (mimeType.startsWith('image/')) return 'IMG'
  if (mimeType === 'application/pdf') return 'PDF'
  if (mimeType.includes('word') || mimeType === 'application/msword') return 'DOC'
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'XLS'
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'PPT'
  if (mimeType === 'text/plain') return 'TXT'
  if (mimeType === 'text/csv') return 'CSV'
  return 'FILE'
}

function inferFileType(mimeType: string | undefined): 'image' | 'document' {
  if (mimeType?.startsWith('image/')) return 'image'
  return 'document'
}

// ── Component ──

interface Props {
  decision: DecisionV3
  readOnly: boolean
  userName: string
  userEmail: string
  onOpenOption?: (optionId: string) => void
  onUpdateDecision: (patch: Partial<DecisionV3>) => void
  onUploadFile: (file: File) => Promise<UploadFileResult>
}

export function DecisionFiles({
  decision,
  readOnly,
  userName,
  userEmail,
  onOpenOption,
  onUpdateDecision,
  onUploadFile,
}: Props) {
  const [expanded, setExpanded] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [attachTo, setAttachTo] = useState('')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Aggregate files from both sources
  const allFiles = useMemo(() => {
    const entries: UnifiedFileEntry[] = []
    const seen = new Set<string>()

    // 1) decision.files[]
    for (const f of (decision.files ?? [])) {
      entries.push({
        id: f.id,
        url: f.url,
        thumbnailUrl: f.thumbnailUrl,
        title: f.title,
        fileName: f.fileName,
        fileSize: f.fileSize,
        mimeType: f.mimeType,
        fileType: f.fileType,
        optionId: f.optionId,
        optionName: f.optionLabel,
        source: 'decision-files',
        uploadedAt: f.uploadedAt,
        uploadedByName: f.uploadedByName,
        uploadedByEmail: f.uploadedByEmail,
      })
      seen.add(f.id)
    }

    // 2) option.documents[]
    for (const opt of (decision.options ?? [])) {
      for (const doc of (opt.documents ?? [])) {
        if (seen.has(doc.id)) continue
        entries.push({
          id: doc.id,
          url: doc.url,
          thumbnailUrl: doc.thumbnailUrl,
          title: doc.title,
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          mimeType: doc.mimeType,
          fileType: inferFileType(doc.mimeType),
          optionId: opt.id,
          optionName: opt.name || 'Untitled',
          source: 'option-documents',
          uploadedAt: doc.uploadedAt,
          uploadedByName: doc.uploadedByName,
          uploadedByEmail: doc.uploadedByEmail,
        })
      }
    }

    entries.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    return entries
  }, [decision.files, decision.options])

  // Show even if empty when not readOnly (for Add File button)
  if (allFiles.length === 0 && readOnly) return null

  const visibleFiles = expanded ? allFiles : allFiles.slice(0, 4)

  // ── File upload handler ──

  async function handleUpload(file: File | null) {
    if (!file) return
    setUploadError('')
    setUploading(true)
    try {
      const result = await onUploadFile(file)
      const optionId = attachTo || undefined
      const optionLabel = optionId
        ? (decision.options.find((o) => o.id === optionId)?.name || 'Untitled')
        : undefined

      const newFile: DecisionFileV3 = {
        id: result.id,
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
        title: result.fileName.replace(/\.[^.]+$/, ''),
        fileName: result.fileName,
        fileSize: result.fileSize,
        mimeType: result.mimeType,
        fileType: result.fileType,
        optionId,
        optionLabel,
        uploadedAt: new Date().toISOString(),
        uploadedByName: userName,
        uploadedByEmail: userEmail,
      }

      onUpdateDecision({ files: [...(decision.files ?? []), newFile] })
      setShowAddForm(false)
      setAttachTo('')
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ── Attach/detach handlers (only for decision-files source) ──

  function handleAttach(fileId: string, optionId: string) {
    const option = decision.options.find((o) => o.id === optionId)
    const updated = (decision.files ?? []).map((f) =>
      f.id === fileId ? { ...f, optionId, optionLabel: option?.name || 'Untitled' } : f
    )
    onUpdateDecision({ files: updated })
    setMenuOpenId(null)
  }

  function handleDetach(fileId: string) {
    const updated = (decision.files ?? []).map((f) =>
      f.id === fileId ? { ...f, optionId: undefined, optionLabel: undefined } : f
    )
    onUpdateDecision({ files: updated })
    setMenuOpenId(null)
  }

  return (
    <div className="mt-6 bg-stone border border-cream/12 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-cream/12 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-cream/45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm font-medium text-cream/70">All Files</span>
          {allFiles.length > 0 && (
            <span className="text-[11px] text-cream/45">
              {allFiles.length} file{allFiles.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {!readOnly && (
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 text-xs text-sandstone/70 hover:text-sandstone transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Add File
          </button>
        )}
      </div>

      {/* Add File form */}
      {showAddForm && (
        <div className="px-4 py-3 border-b border-cream/12 bg-basalt/50">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf,.jpg,.jpeg,.png,.webp,.heic,.heif"
            className="hidden"
            onChange={(e) => handleUpload(e.target.files?.[0] ?? null)}
          />

          <div className="flex items-center gap-3 mb-3">
            <label className="text-xs text-cream/65">Attach to:</label>
            <select
              value={attachTo}
              onChange={(e) => setAttachTo(e.target.value)}
              className="flex-1 bg-basalt border border-cream/15 rounded-lg px-2.5 py-1.5 text-xs text-cream focus:outline-none focus:border-sandstone/50"
            >
              <option value="">Unattached</option>
              {decision.options.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.name || 'Untitled'}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-stone-200 hover:bg-cream/10 rounded-lg text-sm text-cream/55 hover:text-cream/70 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-cream/20 border-t-cream/70 rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round" />
                  <polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" />
                </svg>
                Choose file
              </>
            )}
          </button>

          {uploadError && <p className="text-sm text-red-400 mt-2">{uploadError}</p>}
        </div>
      )}

      {/* File list */}
      {allFiles.length > 0 && (
        <div className="divide-y divide-cream/5">
          {visibleFiles.map((entry) => (
            <div
              key={entry.id}
              className="px-4 py-3 flex items-center gap-3 hover:bg-stone-hover transition-colors"
            >
              {/* Thumbnail or type badge */}
              {entry.fileType === 'image' && entry.thumbnailUrl ? (
                <img
                  src={entry.thumbnailUrl}
                  alt={entry.title}
                  className="w-7 h-7 rounded object-cover shrink-0"
                />
              ) : (
                <span className={`text-[10px] font-bold uppercase shrink-0 w-8 text-center ${docTypeColor(entry.mimeType)}`}>
                  {docTypeLabel(entry.mimeType)}
                </span>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-cream/90 truncate">{entry.title}</p>
                <p className="text-[11px] text-cream/45 mt-0.5">
                  {entry.optionId && entry.optionName ? (
                    <button
                      type="button"
                      onClick={() => onOpenOption?.(entry.optionId!)}
                      className="text-sandstone/60 hover:text-sandstone transition-colors"
                    >
                      {entry.optionName}
                    </button>
                  ) : (
                    <span className="text-cream/35">Unattached</span>
                  )}
                  {' · '}{formatFileSize(entry.fileSize)}
                  {' · '}{entry.uploadedByName}
                  {' · '}{formatDate(entry.uploadedAt)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Download */}
                <a
                  href={entry.url}
                  download={entry.fileName}
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 text-cream/45 hover:text-sandstone transition-colors"
                  title="Download"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round" />
                    <polyline points="7 10 12 15 17 10" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round" />
                  </svg>
                </a>

                {/* Attach/detach menu (only for decision-files) */}
                {!readOnly && entry.source === 'decision-files' && (
                  <div className="relative" ref={menuOpenId === entry.id ? menuRef : undefined}>
                    <button
                      type="button"
                      onClick={() => setMenuOpenId(menuOpenId === entry.id ? null : entry.id)}
                      className="p-2 text-cream/45 hover:text-cream/70 transition-colors"
                      title="More actions"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="5" r="1.5" />
                        <circle cx="12" cy="12" r="1.5" />
                        <circle cx="12" cy="19" r="1.5" />
                      </svg>
                    </button>

                    {menuOpenId === entry.id && (
                      <div className="absolute right-0 top-full mt-1 z-30 bg-stone border border-cream/15 rounded-lg shadow-xl py-1 min-w-[160px]">
                        {entry.optionId ? (
                          <button
                            type="button"
                            onClick={() => handleDetach(entry.id)}
                            className="w-full text-left px-3 py-1.5 text-xs text-cream/70 hover:bg-stone-hover transition-colors"
                          >
                            Detach from option
                          </button>
                        ) : (
                          decision.options.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleAttach(entry.id, opt.id)}
                              className="w-full text-left px-3 py-1.5 text-xs text-cream/70 hover:bg-stone-hover transition-colors truncate"
                            >
                              Attach to {opt.name || 'Untitled'}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {allFiles.length === 0 && !showAddForm && (
        <div className="px-4 py-6 text-center">
          <p className="text-xs text-cream/45">No files yet</p>
        </div>
      )}

      {/* Show more */}
      {allFiles.length > 4 && (
        <div className="px-4 py-2 border-t border-cream/10">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-cream/55 hover:text-cream/70 transition-colors"
          >
            {expanded ? 'Show less' : `Show all ${allFiles.length} files`}
          </button>
        </div>
      )}
    </div>
  )
}
