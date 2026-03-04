'use client'

import { useState } from 'react'
import type { DecisionV3, OptionDocumentV3 } from '@/data/finish-decisions'

interface DecisionFileEntry {
  doc: OptionDocumentV3
  optionName: string
  optionId: string
}

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
  if (mimeType === 'application/pdf') return 'text-red-400'
  if (mimeType.includes('word') || mimeType === 'application/msword') return 'text-blue-400'
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'text-green-400'
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'text-orange-400'
  return 'text-cream/40'
}

function docTypeLabel(mimeType: string | undefined): string {
  if (!mimeType) return 'FILE'
  if (mimeType === 'application/pdf') return 'PDF'
  if (mimeType.includes('word') || mimeType === 'application/msword') return 'DOC'
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'XLS'
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'PPT'
  if (mimeType === 'text/plain') return 'TXT'
  if (mimeType === 'text/csv') return 'CSV'
  return 'FILE'
}

export function DecisionFiles({
  decision,
  onOpenOption,
}: {
  decision: DecisionV3
  onOpenOption?: (optionId: string) => void
}) {
  const [expanded, setExpanded] = useState(false)

  // Gather all files from all options
  const allFiles: DecisionFileEntry[] = []
  for (const opt of (decision.options ?? [])) {
    if (opt.documents && opt.documents.length > 0) {
      for (const doc of opt.documents) {
        allFiles.push({ doc, optionName: opt.name || 'Untitled', optionId: opt.id })
      }
    }
  }

  if (allFiles.length === 0) return null

  // Sort by most recent first
  allFiles.sort((a, b) => new Date(b.doc.uploadedAt).getTime() - new Date(a.doc.uploadedAt).getTime())

  const visibleFiles = expanded ? allFiles : allFiles.slice(0, 4)

  return (
    <div className="mt-6 bg-basalt-50 border border-cream/8 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-cream/8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-cream/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm font-medium text-cream/60">
            All Files
          </span>
          <span className="text-[11px] text-cream/30">
            {allFiles.length} file{allFiles.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* File list */}
      <div className="divide-y divide-cream/5">
        {visibleFiles.map((entry) => (
          <div
            key={entry.doc.id}
            className="px-4 py-3 flex items-center gap-3 hover:bg-cream/3 transition-colors"
          >
            {/* File type badge */}
            <span className={`text-[10px] font-bold uppercase shrink-0 w-8 text-center ${docTypeColor(entry.doc.mimeType)}`}>
              {docTypeLabel(entry.doc.mimeType)}
            </span>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-cream/80 truncate">{entry.doc.title}</p>
              <p className="text-[11px] text-cream/30 mt-0.5">
                <button
                  type="button"
                  onClick={() => onOpenOption?.(entry.optionId)}
                  className="text-sandstone/60 hover:text-sandstone transition-colors"
                >
                  {entry.optionName}
                </button>
                {' · '}{formatFileSize(entry.doc.fileSize)}
                {' · '}{entry.doc.uploadedByName}
                {' · '}{formatDate(entry.doc.uploadedAt)}
              </p>
            </div>

            {/* Download */}
            <a
              href={entry.doc.url}
              download={entry.doc.fileName}
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
        ))}
      </div>

      {/* Show more */}
      {allFiles.length > 4 && (
        <div className="px-4 py-2 border-t border-cream/5">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-cream/40 hover:text-cream/60 transition-colors"
          >
            {expanded ? 'Show less' : `Show all ${allFiles.length} files`}
          </button>
        </div>
      )}
    </div>
  )
}
