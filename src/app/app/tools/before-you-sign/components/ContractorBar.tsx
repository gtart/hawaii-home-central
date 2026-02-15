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
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const addInputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isAdding) addInputRef.current?.focus()
  }, [isAdding])

  useEffect(() => {
    if (editingId) editInputRef.current?.focus()
  }, [editingId])

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpenId) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpenId])

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
    setMenuOpenId(null)
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
        <div key={c.id} className="relative shrink-0 flex items-center">
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
          ) : (
            <button
              type="button"
              onClick={() => onSelect(c.id)}
              onContextMenu={(e) => {
                e.preventDefault()
                setMenuOpenId(menuOpenId === c.id ? null : c.id)
              }}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                activeContractorId === c.id
                  ? 'bg-sandstone text-basalt'
                  : 'bg-basalt-50 text-cream/50 border border-cream/10 hover:border-cream/30 hover:text-cream/70'
              )}
            >
              {c.name}
            </button>
          )}

          {/* Three-dot menu button */}
          {editingId !== c.id && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpenId(menuOpenId === c.id ? null : c.id)
              }}
              className="ml-0.5 shrink-0 p-1 text-cream/20 hover:text-cream/50 transition-colors"
              aria-label={`Options for ${c.name}`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>
          )}

          {/* Dropdown menu */}
          {menuOpenId === c.id && (
            <div
              ref={menuRef}
              className="absolute top-full left-0 mt-1 z-20 bg-basalt-50 border border-cream/15 rounded-lg shadow-lg py-1 min-w-[120px]"
            >
              <button
                type="button"
                onClick={() => handleStartEdit(c)}
                className="w-full text-left px-3 py-1.5 text-sm text-cream/70 hover:bg-cream/5 transition-colors"
              >
                Rename
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpenId(null)
                  onRemove(c.id)
                }}
                className="w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-cream/5 transition-colors"
              >
                Remove
              </button>
            </div>
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
