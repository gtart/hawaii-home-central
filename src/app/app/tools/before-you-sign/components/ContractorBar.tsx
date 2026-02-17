'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { BYSContractor } from '../types'

interface ContractorBarProps {
  contractors: BYSContractor[]
  activeContractorId: string
  onSelect: (id: string) => void
  onAdd: (name: string) => string
  onRemove: (id: string) => void
  onUpdate: (id: string, updates: Partial<BYSContractor>) => void
}

export function ContractorBar({
  contractors,
  activeContractorId,
  onSelect,
  onAdd,
  onRemove,
  onUpdate,
}: ContractorBarProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const addInputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isAdding) addInputRef.current?.focus()
  }, [isAdding])

  useEffect(() => {
    if (editingId) editInputRef.current?.focus()
  }, [editingId])

  function handleAdd() {
    const trimmed = newName.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setNewName('')
    setIsAdding(false)
  }

  function handleStartEdit(c: BYSContractor) {
    setEditingId(c.id)
    setEditName(c.name)
  }

  function handleDelete(id: string) {
    if (deleteConfirmId === id) {
      onRemove(id)
      setDeleteConfirmId(null)
    } else {
      setDeleteConfirmId(id)
    }
  }

  function handleSaveEdit() {
    if (editingId && editName.trim()) {
      onUpdate(editingId, { name: editName.trim() })
    }
    setEditingId(null)
    setEditName('')
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
      {/* "All" pill — compare mode */}
      <button
        type="button"
        onClick={() => onSelect('all')}
        className={cn(
          'shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
          activeContractorId === 'all'
            ? 'bg-sandstone text-basalt'
            : 'bg-basalt-50 text-cream/50 border border-cream/10 hover:border-cream/30 hover:text-cream/70'
        )}
      >
        All
      </button>

      {/* Contractor pills */}
      {contractors.map((c) => (
        <div key={c.id} className="relative shrink-0 flex items-center group">
          {editingId === c.id ? (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSaveEdit()
              }}
              className="flex items-center"
            >
              <input
                ref={editInputRef}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleSaveEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setEditingId(null)
                    setEditName('')
                  }
                }}
                className="px-3 py-1.5 rounded-full text-sm bg-basalt border border-sandstone text-cream outline-none w-32"
              />
            </form>
          ) : deleteConfirmId === c.id ? (
            <div className="flex items-center gap-1 bg-red-900/20 border border-red-400/30 rounded-full px-3 py-1.5">
              <span className="text-xs text-red-300">Delete?</span>
              <button
                type="button"
                onClick={() => handleDelete(c.id)}
                className="text-xs text-red-400 hover:text-red-300 font-medium"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="text-xs text-cream/60 hover:text-cream/80"
              >
                No
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  activeContractorId === c.id
                    ? 'bg-sandstone text-basalt'
                    : 'bg-basalt-50 text-cream/50 border border-cream/10 hover:border-cream/30 hover:text-cream/70'
                )}
              >
                {c.name}
              </button>

              {/* Edit and delete icons (show on hover) */}
              <div className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStartEdit(c)
                  }}
                  className="p-1 text-cream/40 hover:text-sandstone transition-colors"
                  aria-label={`Rename ${c.name}`}
                  title="Rename"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(c.id)
                  }}
                  className="p-1 text-cream/40 hover:text-red-400 transition-colors"
                  aria-label={`Delete ${c.name}`}
                  title="Delete"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      ))}

      {/* Add contractor */}
      {isAdding ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleAdd()
          }}
          className="shrink-0 flex items-center gap-1"
        >
          <input
            ref={addInputRef}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={() => {
              if (!newName.trim()) setIsAdding(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsAdding(false)
                setNewName('')
              }
            }}
            placeholder="Contractor name"
            className="px-3 py-1.5 rounded-full text-sm bg-basalt border border-cream/15 text-cream placeholder:text-cream/30 outline-none focus:border-sandstone w-36"
          />
          <button
            type="submit"
            className="shrink-0 px-2 py-1.5 text-sm text-sandstone hover:text-sandstone/80 transition-colors"
          >
            Add
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="shrink-0 px-3 py-1.5 rounded-full text-sm text-cream/40 border border-dashed border-cream/15 hover:border-cream/30 hover:text-cream/60 transition-colors"
        >
          + Add
        </button>
      )}
    </div>
  )
}
