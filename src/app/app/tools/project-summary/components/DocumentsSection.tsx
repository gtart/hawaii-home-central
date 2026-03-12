'use client'

import { useState } from 'react'
import type { DocType } from '@/data/project-summary'
import { DOC_TYPE_LABELS } from '../constants'
import type { ProjectSummaryStateAPI } from '../useProjectSummaryState'
import { SectionHeader } from './SectionHeader'
import { InlineEdit } from './InlineEdit'

interface DocumentsSectionProps {
  api: ProjectSummaryStateAPI
}

export function DocumentsSection({ api }: DocumentsSectionProps) {
  const { payload, readOnly, addDocument, updateDocument, deleteDocument } = api
  const { documents } = payload
  const [showAddForm, setShowAddForm] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newDocType, setNewDocType] = useState<DocType | ''>('')
  const [newUrl, setNewUrl] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

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
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-cream/[0.02] border border-cream/[0.04] group"
          >
            {/* Doc icon */}
            <svg className="w-4 h-4 text-cream/25 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

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

              {doc.url && (
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-sandstone/50 hover:text-sandstone transition-colors truncate block mt-0.5"
                >
                  {doc.url}
                </a>
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
        ))}
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
            <select
              value={newDocType}
              onChange={(e) => setNewDocType(e.target.value as DocType | '')}
              className="bg-cream/5 border border-cream/10 rounded-md px-2 py-1.5 text-xs text-cream/60 outline-none focus:border-sandstone/30"
            >
              <option value="">Type (optional)</option>
              {Object.entries(DOC_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="URL (optional)"
              className="flex-1 bg-cream/5 border border-cream/10 rounded-md px-2 py-1.5 text-xs text-cream/60 placeholder-cream/20 outline-none focus:border-sandstone/30"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
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
