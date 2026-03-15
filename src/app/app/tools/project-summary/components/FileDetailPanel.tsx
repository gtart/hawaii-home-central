'use client'

import { useState, useEffect, useRef } from 'react'
import type { SummaryDocument } from '@/data/project-summary'
import { DOC_TYPE_LABELS } from '../constants'
import { useComments, type CommentRow } from '@/hooks/useComments'

interface FileDetailPanelProps {
  document: SummaryDocument
  collectionId: string
  onClose: () => void
  onUpdateNote: (note: string) => void
  onUpdateBody?: (body: string) => void
  readOnly?: boolean
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function FileIcon({ mimeType, className }: { mimeType?: string; className?: string }) {
  const cls = className || 'w-8 h-8'
  if (mimeType?.startsWith('image/')) {
    return (
      <svg className={`${cls} text-blue-400/60`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (mimeType === 'application/pdf') {
    return (
      <svg className={`${cls} text-red-400/60`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
        <text x="7" y="18" fontSize="6" fill="currentColor" stroke="none" fontWeight="bold">PDF</text>
      </svg>
    )
  }
  return (
    <svg className={`${cls} text-cream/30`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CommentThread({
  comments,
  isLoading,
  onAdd,
  onDelete,
  onEdit,
  readOnly,
}: {
  comments: CommentRow[]
  isLoading: boolean
  onAdd: (text: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onEdit: (id: string, text: string) => Promise<void>
  readOnly?: boolean
}) {
  const [newText, setNewText] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSubmit() {
    if (!newText.trim() || sending) return
    setSending(true)
    try {
      await onAdd(newText.trim())
      setNewText('')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-3">
      <span className="text-[10px] text-cream/30 uppercase tracking-wider font-medium">Discussion</span>

      {isLoading && comments.length === 0 && (
        <p className="text-xs text-cream/20 italic">Loading...</p>
      )}

      {!isLoading && comments.length === 0 && (
        <p className="text-xs text-cream/20 italic">No discussion yet.</p>
      )}

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {comments.map((c) => (
          <div key={c.id} className="text-xs bg-cream/[0.03] rounded-lg px-3 py-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-cream/50 font-medium">{c.authorName}</span>
              <span className="text-cream/15">{formatDate(c.createdAt)}</span>
            </div>
            <p className="text-cream/60 whitespace-pre-wrap">{c.text}</p>
          </div>
        ))}
      </div>

      {!readOnly && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-cream/5 border border-cream/10 rounded-md px-3 py-1.5 text-xs text-cream/70 placeholder-cream/20 outline-none focus:border-sandstone/30"
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!newText.trim() || sending}
            className="px-3 py-1.5 text-xs bg-sandstone/20 text-sandstone hover:bg-sandstone/30 rounded-md transition-colors disabled:opacity-30"
          >
            Send
          </button>
        </div>
      )}
    </div>
  )
}

export function FileDetailPanel({ document: doc, collectionId, onClose, onUpdateNote, onUpdateBody, readOnly }: FileDetailPanelProps) {
  const [editingNote, setEditingNote] = useState(false)
  const [noteValue, setNoteValue] = useState(doc.note || '')
  const [editingBody, setEditingBody] = useState(false)
  const [bodyValue, setBodyValue] = useState(doc.body || '')
  const backdropRef = useRef<HTMLDivElement>(null)
  const isTextEntry = doc.contentType === 'text'

  const { comments, isLoading, addComment, deleteComment, editComment } = useComments({
    collectionId,
    targetType: 'document',
    targetId: doc.id,
  })

  // Sync note/body when doc changes
  useEffect(() => {
    setNoteValue(doc.note || '')
    setEditingNote(false)
    setBodyValue(doc.body || '')
    setEditingBody(false)
  }, [doc.id, doc.note, doc.body])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  function handleSaveNote() {
    onUpdateNote(noteValue.trim())
    setEditingNote(false)
  }

  const isImage = doc.mimeType?.startsWith('image/')

  const panelContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-cream/[0.06]">
        <h3 className="text-sm font-semibold text-cream/80 truncate pr-2">{doc.label}</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-cream/30 hover:text-cream/60 transition-colors shrink-0"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Body — scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Preview / icon / text body */}
        {isTextEntry ? (
          <div className="space-y-2">
            <span className="text-[10px] text-cream/30 uppercase tracking-wider font-medium">Content</span>
            {editingBody ? (
              <div className="space-y-2">
                <textarea
                  value={bodyValue}
                  onChange={(e) => setBodyValue(e.target.value)}
                  rows={10}
                  className="w-full bg-cream/5 border border-cream/10 rounded-md px-3 py-2 text-xs text-cream/70 placeholder-cream/20 outline-none focus:border-sandstone/30 resize-y"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => { setBodyValue(doc.body || ''); setEditingBody(false) }}
                    className="px-2 py-1 text-[10px] text-cream/40 hover:text-cream/60 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => { onUpdateBody?.(bodyValue.trim()); setEditingBody(false) }}
                    className="px-2 py-1 text-[10px] bg-sandstone/20 text-sandstone hover:bg-sandstone/30 rounded transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={!readOnly ? () => setEditingBody(true) : undefined}
                className={`text-xs leading-relaxed whitespace-pre-wrap ${doc.body ? 'text-cream/60' : 'text-cream/20 italic'} ${!readOnly ? 'cursor-pointer hover:text-cream/70' : ''}`}
              >
                {doc.body || (readOnly ? 'No content.' : 'Click to add content...')}
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center">
            {isImage && doc.fileUrl ? (
              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={doc.fileUrl}
                  alt={doc.label}
                  className="max-h-48 rounded-lg border border-cream/10 object-contain"
                />
              </a>
            ) : (
              <FileIcon mimeType={doc.mimeType} className="w-16 h-16" />
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-cream/30 uppercase tracking-wider font-medium">Details</span>
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
            {doc.fileName && (
              <>
                <span className="text-cream/30">Original filename</span>
                <span className="text-cream/60 break-all">{doc.fileName}</span>
              </>
            )}
            {doc.docType && (
              <>
                <span className="text-cream/30">Type</span>
                <span className="text-cream/60">{DOC_TYPE_LABELS[doc.docType]}</span>
              </>
            )}
            {doc.fileSize && (
              <>
                <span className="text-cream/30">Size</span>
                <span className="text-cream/60">{formatFileSize(doc.fileSize)}</span>
              </>
            )}
            {doc.mimeType && (
              <>
                <span className="text-cream/30">Format</span>
                <span className="text-cream/60">{doc.mimeType}</span>
              </>
            )}
            {doc.uploadedAt && (
              <>
                <span className="text-cream/30">Uploaded</span>
                <span className="text-cream/60">
                  {formatDate(doc.uploadedAt)}
                  {doc.uploadedBy ? ` by ${doc.uploadedBy}` : ''}
                </span>
              </>
            )}
            {doc.created_at && (
              <>
                <span className="text-cream/30">Added</span>
                <span className="text-cream/60">{formatDate(doc.created_at)}</span>
              </>
            )}
            <span className="text-cream/30">Status</span>
            <span className={doc.isCurrent ? 'text-emerald-400/70' : 'text-cream/40'}>
              {doc.isCurrent ? 'Current' : 'Outdated'}
            </span>
          </div>
        </div>

        {/* Download link */}
        {(doc.fileUrl || doc.url) && (
          <a
            href={doc.fileUrl || doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-sandstone/60 hover:text-sandstone transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {doc.fileUrl ? (doc.fileName || 'Download file') : 'Open link'}
          </a>
        )}

        {/* Description */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-cream/30 uppercase tracking-wider font-medium">Description</span>
          {editingNote ? (
            <div className="space-y-2">
              <textarea
                value={noteValue}
                onChange={(e) => setNoteValue(e.target.value)}
                rows={3}
                className="w-full bg-cream/5 border border-cream/10 rounded-md px-3 py-2 text-xs text-cream/70 placeholder-cream/20 outline-none focus:border-sandstone/30 resize-none"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => { setNoteValue(doc.note || ''); setEditingNote(false) }}
                  className="px-2 py-1 text-[10px] text-cream/40 hover:text-cream/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveNote}
                  className="px-2 py-1 text-[10px] bg-sandstone/20 text-sandstone hover:bg-sandstone/30 rounded transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={!readOnly ? () => setEditingNote(true) : undefined}
              className={`text-xs ${doc.note ? 'text-cream/60' : 'text-cream/20 italic'} ${!readOnly ? 'cursor-pointer hover:text-cream/70' : ''} whitespace-pre-wrap`}
            >
              {doc.note || (readOnly ? 'No description.' : 'Click to add a description...')}
            </div>
          )}
        </div>

        {/* Comments */}
        <CommentThread
          comments={comments}
          isLoading={isLoading}
          onAdd={(text) => addComment({ text, entityTitle: doc.label })}
          onDelete={deleteComment}
          onEdit={editComment}
          readOnly={readOnly}
        />
      </div>
    </div>
  )

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={(e) => { if (e.target === backdropRef.current) onClose() }}
      />

      {/* Desktop: slide-in sidebar from right */}
      <div className="hidden md:block fixed inset-y-0 right-0 z-50 w-[380px] max-w-full bg-[#1a1a1a] border-l border-cream/[0.08] shadow-2xl animate-in slide-in-from-right duration-200">
        {panelContent}
      </div>

      {/* Mobile: bottom sheet */}
      <div className="md:hidden fixed inset-x-0 bottom-0 z-50 max-h-[85vh] bg-[#1a1a1a] border-t border-cream/[0.08] rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-200">
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-cream/15" />
        </div>
        {panelContent}
      </div>
    </>
  )
}
