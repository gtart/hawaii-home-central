'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { BYSContractor } from '../types'

interface ContractorBarProps {
  contractors: BYSContractor[]
  selectedContractorIds: string[]
  onToggle: (id: string) => void
  onAdd: (name: string) => string
  onRemove: (id: string) => void
  onUpdate: (id: string, updates: Partial<BYSContractor>) => void
  readOnly?: boolean
}

const MAX_SELECTED = 4

export function ContractorBar({
  contractors,
  selectedContractorIds,
  onToggle,
  onAdd,
  onRemove,
  onUpdate,
  readOnly = false,
}: ContractorBarProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [showMaxMessage, setShowMaxMessage] = useState(false)
  const [isManaging, setIsManaging] = useState(false)
  const [managePanelNames, setManagePanelNames] = useState<Record<string, string>>({})
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const addInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isAdding) addInputRef.current?.focus()
  }, [isAdding])

  function handleAdd() {
    const trimmed = newName.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setNewName('')
    setIsAdding(false)
  }

  function openManagePanel() {
    const names: Record<string, string> = {}
    contractors.forEach((c) => {
      names[c.id] = c.name
    })
    setManagePanelNames(names)
    setDeleteConfirmId(null)
    setIsManaging(true)
  }

  function closeManagePanel() {
    // Save any pending name changes on close
    Object.entries(managePanelNames).forEach(([id, name]) => {
      const original = contractors.find((c) => c.id === id)
      if (original && name.trim() && name.trim() !== original.name) {
        onUpdate(id, { name: name.trim() })
      }
    })
    setIsManaging(false)
    setDeleteConfirmId(null)
  }

  return (
    <div>
      <p className="text-xs text-cream/50 mb-2">{readOnly ? 'Select contractors to view' : 'Add or select contractors to compare'}</p>
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {/* Contractor pills */}
        {contractors.map((c) => {
          const isSelected = selectedContractorIds.includes(c.id)
          const atMax = selectedContractorIds.length >= MAX_SELECTED && !isSelected

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                if (atMax) {
                  setShowMaxMessage(true)
                  setTimeout(() => setShowMaxMessage(false), 3000)
                  return
                }
                setShowMaxMessage(false)
                onToggle(c.id)
              }}
              className={cn(
                'shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                isSelected
                  ? 'bg-sandstone text-basalt'
                  : atMax
                  ? 'bg-basalt-50 text-cream/30 border border-cream/5 cursor-not-allowed'
                  : 'bg-basalt-50 text-cream/70 border border-cream/10 hover:border-cream/30 hover:text-cream'
              )}
            >
              {c.name}
            </button>
          )
        })}

        {/* Add contractor (hidden for readOnly) */}
        {!readOnly && (
          isAdding ? (
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
          )
        )}

        {/* Manage toggle (hidden for readOnly) */}
        {!readOnly && contractors.length > 0 && (
          <button
            type="button"
            onClick={() => (isManaging ? closeManagePanel() : openManagePanel())}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              isManaging
                ? 'bg-sandstone/20 text-sandstone border border-sandstone/30'
                : 'text-cream/40 border border-cream/10 hover:text-cream/60 hover:border-cream/20'
            )}
          >
            {isManaging ? 'Done' : 'Manage'}
          </button>
        )}

        {/* Max selection message */}
        {showMaxMessage && (
          <span className="shrink-0 text-xs text-sandstone/70 pl-1">
            You can compare up to 4 at a time. Deselect one to switch.
          </span>
        )}
      </div>

      {/* Manage panel */}
      {isManaging && (
        <div className="mt-3 bg-basalt-50 rounded-lg border border-cream/10 p-4">
          <p className="text-xs text-cream/40 mb-3">
            Rename contractors or remove ones you no longer need. Removing a contractor deletes all their answers.
          </p>
          <div className="space-y-2">
            {contractors.map((c) => (
              <div key={c.id} className="flex items-center gap-2">
                {deleteConfirmId === c.id ? (
                  <>
                    <span className="flex-1 text-sm text-cream/70">
                      Delete <span className="font-medium text-cream">{c.name}</span>?
                      All their data will be removed.
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onRemove(c.id)
                        setDeleteConfirmId(null)
                        setManagePanelNames((prev) => {
                          const next = { ...prev }
                          delete next[c.id]
                          return next
                        })
                        // Close panel if no contractors remain
                        if (contractors.length <= 1) {
                          setIsManaging(false)
                        }
                      }}
                      className="shrink-0 px-3 py-1 text-xs font-medium text-red-400 border border-red-400/30 rounded-full hover:bg-red-400/10 transition-colors"
                    >
                      Yes, delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(null)}
                      className="shrink-0 px-3 py-1 text-xs text-cream/40 hover:text-cream/60 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      value={managePanelNames[c.id] ?? c.name}
                      onChange={(e) =>
                        setManagePanelNames((prev) => ({ ...prev, [c.id]: e.target.value }))
                      }
                      onBlur={() => {
                        const trimmed = (managePanelNames[c.id] ?? '').trim()
                        if (trimmed && trimmed !== c.name) {
                          onUpdate(c.id, { name: trimmed })
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          ;(e.target as HTMLInputElement).blur()
                        }
                      }}
                      className={cn(
                        'flex-1 px-3 py-1.5 rounded-lg text-sm',
                        'bg-basalt border border-cream/15 text-cream',
                        'placeholder:text-cream/30',
                        'focus:outline-none focus:border-sandstone focus:ring-1 focus:ring-sandstone',
                        'min-w-0'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(c.id)}
                      className="shrink-0 p-1.5 text-cream/30 hover:text-red-400 transition-colors"
                      aria-label={`Delete ${c.name}`}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18" />
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
