'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { BYSContractor } from '../types'

interface ContractorBarProps {
  contractors: BYSContractor[]
  selectedContractorIds: string[]
  onToggle: (id: string) => void
  onAdd: (name: string) => string
}

const MAX_SELECTED = 4

export function ContractorBar({
  contractors,
  selectedContractorIds,
  onToggle,
  onAdd,
}: ContractorBarProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [showMaxMessage, setShowMaxMessage] = useState(false)
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

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
      {/* Contractor pills (multi-select toggles) */}
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
      {/* Max selection message */}
      {showMaxMessage && (
        <span className="shrink-0 text-xs text-sandstone/70 pl-1">
          You can compare up to 4 at a time. Deselect one to switch.
        </span>
      )}
    </div>
  )
}
