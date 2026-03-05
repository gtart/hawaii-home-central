'use client'

import { useState, useMemo } from 'react'
import type { RoomV3 } from '@/data/finish-decisions'

// ── Unified file entry for room-level aggregation ──

interface RoomFileEntry {
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
  decisionId: string
  decisionTitle: string
  uploadedAt: string
  uploadedByName: string
}

type FilterMode = 'all' | 'images' | 'documents' | 'unattached'

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
  if (!mimeType) return 'text-cream/40'
  if (mimeType.startsWith('image/')) return 'text-purple-400'
  if (mimeType === 'application/pdf') return 'text-red-400'
  if (mimeType.includes('word') || mimeType === 'application/msword') return 'text-blue-400'
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'text-green-400'
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'text-orange-400'
  return 'text-cream/40'
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
  room: RoomV3
  onClose: () => void
  onNavigateToDecision: (decisionId: string) => void
}

export function RoomFilesPanel({ room, onClose, onNavigateToDecision }: Props) {
  const [filter, setFilter] = useState<FilterMode>('all')

  const allFiles = useMemo(() => {
    const entries: RoomFileEntry[] = []
    const seen = new Set<string>()

    for (const d of room.decisions) {
      const dTitle = d.title || 'Untitled'

      // decision.files[]
      for (const f of (d.files ?? [])) {
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
          decisionId: d.id,
          decisionTitle: dTitle,
          uploadedAt: f.uploadedAt,
          uploadedByName: f.uploadedByName,
        })
        seen.add(f.id)
      }

      // option.documents[]
      for (const opt of (d.options ?? [])) {
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
            decisionId: d.id,
            decisionTitle: dTitle,
            uploadedAt: doc.uploadedAt,
            uploadedByName: doc.uploadedByName,
          })
        }
      }
    }

    entries.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    return entries
  }, [room.decisions])

  const filtered = useMemo(() => {
    switch (filter) {
      case 'images': return allFiles.filter((f) => f.fileType === 'image')
      case 'documents': return allFiles.filter((f) => f.fileType === 'document')
      case 'unattached': return allFiles.filter((f) => !f.optionId)
      default: return allFiles
    }
  }, [allFiles, filter])

  const filters: { key: FilterMode; label: string }[] = [
    { key: 'all', label: `All (${allFiles.length})` },
    { key: 'images', label: 'Images' },
    { key: 'documents', label: 'Documents' },
    { key: 'unattached', label: 'Unattached' },
  ]

  return (
    <>
      {/* Desktop: right side panel */}
      <div className="hidden md:block fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        <div className="absolute inset-y-0 right-0 w-[420px] bg-basalt-50 border-l border-cream/10 shadow-xl overflow-y-auto">
          <div className="sticky top-0 bg-basalt-50 border-b border-cream/10 z-10">
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="text-lg font-medium text-cream">All Files</h2>
              <button
                type="button"
                onClick={onClose}
                className="text-cream/40 hover:text-cream transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Filters */}
            <div className="flex gap-1.5 px-5 pb-3">
              {filters.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`text-[11px] px-2.5 py-1 rounded-full transition-colors ${
                    filter === f.key
                      ? 'bg-sandstone/20 text-sandstone font-medium'
                      : 'text-cream/40 hover:text-cream/60 bg-cream/5'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5">
            {filtered.length === 0 ? (
              <p className="text-sm text-cream/30 text-center py-8">
                {allFiles.length === 0 ? 'No files in this area yet' : 'No files match this filter'}
              </p>
            ) : (
              <div className="space-y-2">
                {filtered.map((entry) => (
                  <FileRow key={entry.id} entry={entry} onNavigateToDecision={onNavigateToDecision} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: bottom sheet */}
      <div className="md:hidden fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="absolute inset-x-0 bottom-0 bg-basalt-50 border-t border-cream/10 rounded-t-xl max-h-[85vh] overflow-y-auto">
          <div className="sticky top-0 bg-basalt-50 border-b border-cream/10 z-10">
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="text-lg font-medium text-cream">All Files</h2>
              <button
                type="button"
                onClick={onClose}
                className="text-cream/40 hover:text-cream transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Filters */}
            <div className="flex gap-1.5 px-5 pb-3 overflow-x-auto">
              {filters.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`text-[11px] px-2.5 py-1 rounded-full transition-colors whitespace-nowrap ${
                    filter === f.key
                      ? 'bg-sandstone/20 text-sandstone font-medium'
                      : 'text-cream/40 hover:text-cream/60 bg-cream/5'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5">
            {filtered.length === 0 ? (
              <p className="text-sm text-cream/30 text-center py-8">
                {allFiles.length === 0 ? 'No files in this area yet' : 'No files match this filter'}
              </p>
            ) : (
              <div className="space-y-2">
                {filtered.map((entry) => (
                  <FileRow key={entry.id} entry={entry} onNavigateToDecision={onNavigateToDecision} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ── File row sub-component ──

function FileRow({
  entry,
  onNavigateToDecision,
}: {
  entry: RoomFileEntry
  onNavigateToDecision: (decisionId: string) => void
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-cream/3 transition-colors">
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
        <p className="text-sm text-cream/80 truncate">{entry.title}</p>
        <p className="text-[11px] text-cream/30 mt-0.5">
          <button
            type="button"
            onClick={() => onNavigateToDecision(entry.decisionId)}
            className="text-sandstone/60 hover:text-sandstone transition-colors"
          >
            {entry.decisionTitle}
          </button>
          {entry.optionName && (
            <span className="text-cream/20"> / {entry.optionName}</span>
          )}
          {!entry.optionId && (
            <span className="text-cream/20"> / Unattached</span>
          )}
          {' · '}{formatFileSize(entry.fileSize)}
          {' · '}{formatDate(entry.uploadedAt)}
        </p>
      </div>

      {/* Download */}
      <a
        href={entry.url}
        download={entry.fileName}
        onClick={(e) => e.stopPropagation()}
        className="p-2 text-cream/30 hover:text-sandstone transition-colors shrink-0"
        title="Download"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round" />
          <polyline points="7 10 12 15 17 10" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round" />
        </svg>
      </a>
    </div>
  )
}
