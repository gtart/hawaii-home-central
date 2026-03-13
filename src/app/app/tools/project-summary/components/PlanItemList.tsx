'use client'

import { useState, useRef, useEffect } from 'react'
import type { PlanItem } from '@/data/project-summary'

interface PlanItemListProps {
  items: PlanItem[]
  onAdd: (text: string) => void
  onUpdate: (id: string, text: string) => void
  onDelete: (id: string) => void
  readOnly?: boolean
  emptyMessage?: string
  addPlaceholder?: string
}

export function PlanItemList({
  items,
  onAdd,
  onUpdate,
  onDelete,
  readOnly,
  emptyMessage = 'No items yet.',
  addPlaceholder = 'Add an item...',
}: PlanItemListProps) {
  const [newText, setNewText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
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

  function startEdit(item: PlanItem) {
    setEditingId(item.id)
    setEditDraft(item.text)
  }

  function saveEdit() {
    if (editingId) {
      const trimmed = editDraft.trim()
      if (trimmed && trimmed !== items.find((i) => i.id === editingId)?.text) {
        onUpdate(editingId, trimmed)
      }
      setEditingId(null)
    }
  }

  return (
    <div className="space-y-1">
      {items.length === 0 && readOnly && (
        <p className="text-xs text-cream/25 italic py-1">{emptyMessage}</p>
      )}

      {items.map((item) => (
        <div
          key={item.id}
          className="group flex items-start gap-2 rounded-md px-2 py-1.5 -mx-2 hover:bg-cream/[0.03] transition-colors"
        >
          <span className="text-cream/20 text-xs mt-0.5 shrink-0">•</span>

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
              className="flex-1 bg-cream/5 border border-cream/10 rounded-md px-2 py-0.5 text-sm text-cream/80 placeholder-cream/20 outline-none focus:border-sandstone/30"
            />
          ) : (
            <span
              className={`flex-1 text-sm text-cream/60 ${!readOnly ? 'cursor-text' : ''}`}
              onClick={readOnly ? undefined : () => startEdit(item)}
            >
              {item.text}
            </span>
          )}

          {!readOnly && editingId !== item.id && (
            confirmDeleteId === item.id ? (
              <div className="flex items-center gap-1 shrink-0 opacity-100" onClick={(e) => e.stopPropagation()}>
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
                  className="text-[10px] text-cream/30 hover:text-cream/50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDeleteId(item.id)}
                className="shrink-0 text-cream/10 hover:text-red-400/50 transition-colors opacity-0 group-hover:opacity-100"
                title="Remove item"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )
          )}
        </div>
      ))}

      {!readOnly && (
        <div className="flex items-center gap-2 mt-1">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder={addPlaceholder}
            className="flex-1 bg-transparent border-none text-sm text-cream/60 placeholder-cream/15 outline-none px-2 py-1"
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
