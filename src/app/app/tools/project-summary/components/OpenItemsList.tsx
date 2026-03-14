'use client'

import { useState, useRef, useEffect } from 'react'
import type { OpenItem, OpenItemStatus } from '@/data/project-summary'

const STATUS_CONFIG: Record<OpenItemStatus, { label: string; color: string; bgColor: string }> = {
  open: { label: 'Open', color: 'text-cream/65', bgColor: 'bg-cream/8' },
  waiting: { label: 'Waiting', color: 'text-amber-400', bgColor: 'bg-amber-400/12' },
  resolved: { label: 'Resolved', color: 'text-emerald-400', bgColor: 'bg-emerald-400/12' },
  closed: { label: 'Closed', color: 'text-cream/45', bgColor: 'bg-stone-50' },
}

interface OpenItemsListProps {
  items: OpenItem[]
  onAdd: (text: string) => void
  onUpdate: (id: string, updates: { text?: string; status?: OpenItemStatus; waiting_on?: string }) => void
  onResolve: (id: string, note?: string) => void
  onDelete: (id: string) => void
  readOnly?: boolean
  emptyMessage?: string
  addPlaceholder?: string
}

function ResolveDialog({
  item,
  onResolve,
  onDismiss,
}: {
  item: OpenItem
  onResolve: (note?: string) => void
  onDismiss: () => void
}) {
  const [note, setNote] = useState('')

  const dialogContent = (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-cream">Resolve Item</h3>
      <p className="text-xs text-cream/65 leading-relaxed">{item.text}</p>
      <div>
        <label className="text-[10px] text-cream/55 block mb-1">Resolution Note (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="How was this resolved?"
          rows={2}
          className="w-full bg-stone-200 border border-cream/15 rounded-lg px-3 py-2 text-sm text-cream/90 placeholder-cream/35 outline-none focus:border-sandstone/30 resize-none"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs text-cream/45 hover:text-cream/65 transition-colors px-3 py-1.5"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onResolve(note.trim() || undefined)}
          className="text-xs font-medium text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 transition-colors px-3 py-1.5 rounded-lg"
        >
          Mark Resolved
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[60] bg-black/50" onClick={onDismiss} />

      {/* Desktop: centered modal */}
      <div className="hidden md:flex fixed inset-0 z-[61] items-center justify-center px-4 pointer-events-none">
        <div className="w-full max-w-sm rounded-xl border border-cream/15 bg-basalt p-5 shadow-2xl pointer-events-auto">
          {dialogContent}
        </div>
      </div>

      {/* Mobile: bottom sheet */}
      <div className="md:hidden fixed inset-x-0 bottom-0 z-[61] bg-basalt border-t border-cream/14 rounded-t-2xl shadow-2xl">
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-cream/30" />
        </div>
        <div className="p-5 pb-8">
          {dialogContent}
        </div>
      </div>
    </>
  )
}

export function OpenItemsList({
  items,
  onAdd,
  onUpdate,
  onResolve,
  onDelete,
  readOnly,
  emptyMessage = 'No unresolved items.',
  addPlaceholder = 'Add an unresolved item...',
}: OpenItemsListProps) {
  const [newText, setNewText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [resolvingItem, setResolvingItem] = useState<OpenItem | null>(null)
  const [statusMenuId, setStatusMenuId] = useState<string | null>(null)
  const editRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingId && editRef.current) {
      editRef.current.focus()
    }
  }, [editingId])

  function handleAdd() {
    const trimmed = newText.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setNewText('')
  }

  function startEdit(item: OpenItem) {
    setEditingId(item.id)
    setEditDraft(item.text)
  }

  function saveEdit() {
    if (editingId) {
      const trimmed = editDraft.trim()
      if (trimmed && trimmed !== items.find((i) => i.id === editingId)?.text) {
        onUpdate(editingId, { text: trimmed })
      }
      setEditingId(null)
    }
  }

  // Separate active (open/waiting) from resolved/closed
  const activeItems = items.filter((i) => i.status === 'open' || i.status === 'waiting')
  const resolvedItems = items.filter((i) => i.status === 'resolved' || i.status === 'closed')

  function renderItem(item: OpenItem) {
    const config = STATUS_CONFIG[item.status]
    const isResolved = item.status === 'resolved' || item.status === 'closed'

    return (
      <div
        key={item.id}
        className={`group flex items-start gap-2 rounded-md px-2 py-1.5 -mx-2 hover:bg-stone-hover transition-colors ${
          isResolved ? 'opacity-50' : ''
        }`}
      >
        {/* Status indicator dot */}
        <button
          type="button"
          className={`mt-1 shrink-0 w-2 h-2 rounded-full ${
            item.status === 'open' ? 'bg-cream/45' :
            item.status === 'waiting' ? 'bg-amber-400/60' :
            item.status === 'resolved' ? 'bg-emerald-400/60' :
            'bg-cream/30'
          } ${!readOnly ? 'cursor-pointer hover:ring-2 hover:ring-cream/35' : ''}`}
          onClick={readOnly ? undefined : () => setStatusMenuId(statusMenuId === item.id ? null : item.id)}
          title={config.label}
        />

        {/* Status dropdown */}
        {statusMenuId === item.id && !readOnly && (
          <div className="absolute z-50 mt-5 ml-0 w-44 rounded-lg border border-cream/15 bg-basalt shadow-xl py-1">
            {(Object.entries(STATUS_CONFIG) as [OpenItemStatus, typeof config][]).map(([status, cfg]) => (
              <button
                key={status}
                type="button"
                onClick={() => {
                  if (status === 'resolved') {
                    setResolvingItem(item)
                  } else {
                    onUpdate(item.id, { status })
                  }
                  setStatusMenuId(null)
                }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-stone-hover transition-colors ${
                  item.status === status ? 'text-sandstone' : 'text-cream/70'
                }`}
              >
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                  status === 'open' ? 'bg-cream/45' :
                  status === 'waiting' ? 'bg-amber-400/60' :
                  status === 'resolved' ? 'bg-emerald-400/60' :
                  'bg-cream/30'
                }`} />
                {cfg.label}
              </button>
            ))}
          </div>
        )}

        {/* Text */}
        {editingId === item.id ? (
          <input
            ref={editRef}
            type="text"
            value={editDraft}
            onChange={(e) => setEditDraft(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit()
              if (e.key === 'Escape') setEditingId(null)
            }}
            className="flex-1 bg-stone-200 border border-cream/15 rounded-md px-2 py-0.5 text-sm text-cream/90 placeholder-cream/35 outline-none focus:border-sandstone/30"
          />
        ) : (
          <div className="flex-1 min-w-0">
            <span
              className={`text-sm ${isResolved ? 'text-cream/55 line-through' : 'text-cream/80'} ${!readOnly && !isResolved ? 'cursor-text' : ''}`}
              onClick={readOnly || isResolved ? undefined : () => startEdit(item)}
            >
              {item.text}
            </span>
            {/* Status badge for non-open statuses */}
            {item.status !== 'open' && (
              <span className={`ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium ${config.color} ${config.bgColor}`}>
                {config.label}
                {item.status === 'waiting' && item.waiting_on && (
                  <span className="ml-1 text-cream/45">on {item.waiting_on}</span>
                )}
              </span>
            )}
            {/* Resolution note */}
            {item.resolution_note && (
              <p className="text-[10px] text-cream/50 mt-0.5 leading-tight">
                Resolved: {item.resolution_note}
                {item.resolved_at && (
                  <span className="ml-1">({new Date(item.resolved_at).toLocaleDateString()})</span>
                )}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        {!readOnly && editingId !== item.id && !isResolved && (
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Quick resolve button */}
            <button
              type="button"
              onClick={() => setResolvingItem(item)}
              className="text-emerald-400/30 hover:text-emerald-400/70 transition-colors"
              title="Resolve"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {/* Delete */}
            {confirmDeleteId === item.id ? (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => { onDelete(item.id); setConfirmDeleteId(null) }}
                  className="text-[10px] text-red-400/70 hover:text-red-400 transition-colors"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className="text-[10px] text-cream/45 hover:text-cream/65 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDeleteId(item.id)}
                className="text-cream/25 hover:text-red-400/50 transition-colors"
                title="Remove item"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-1 relative">
      {/* Resolve dialog */}
      {resolvingItem && (
        <ResolveDialog
          item={resolvingItem}
          onResolve={(note) => {
            onResolve(resolvingItem.id, note)
            setResolvingItem(null)
          }}
          onDismiss={() => setResolvingItem(null)}
        />
      )}

      {/* Active items */}
      {activeItems.length === 0 && resolvedItems.length === 0 && readOnly && (
        <p className="text-xs text-cream/50 italic py-1">{emptyMessage}</p>
      )}

      {activeItems.map(renderItem)}

      {/* Resolved/closed items (collapsed by default if there are active items) */}
      {resolvedItems.length > 0 && (
        <details className="mt-2" open={activeItems.length === 0}>
          <summary className="text-[10px] text-cream/50 cursor-pointer hover:text-cream/65 transition-colors select-none">
            {resolvedItems.length} resolved
          </summary>
          <div className="mt-1">
            {resolvedItems.map(renderItem)}
          </div>
        </details>
      )}

      {/* Add new item */}
      {!readOnly && (
        <div className="flex items-center gap-2 mt-1">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder={addPlaceholder}
            className="flex-1 bg-transparent border-none text-sm text-cream/70 placeholder-cream/30 outline-none px-2 py-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
            }}
          />
          {newText.trim() && (
            <button
              type="button"
              onClick={handleAdd}
              className="shrink-0 text-[10px] text-sandstone/60 hover:text-sandstone transition-colors px-2 py-1"
            >
              Add
            </button>
          )}
        </div>
      )}
    </div>
  )
}
