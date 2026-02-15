'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { BYSContractor } from '../types'

interface ContractorSummaryCardProps {
  contractor: BYSContractor
  onUpdate: (id: string, updates: Partial<BYSContractor>) => void
}

export function ContractorSummaryCard({
  contractor,
  onUpdate,
}: ContractorSummaryCardProps) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState(contractor.name)
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditingName) nameInputRef.current?.focus()
  }, [isEditingName])

  function saveName() {
    const trimmed = editName.trim()
    if (trimmed && trimmed !== contractor.name) {
      onUpdate(contractor.id, { name: trimmed })
    } else {
      setEditName(contractor.name)
    }
    setIsEditingName(false)
  }

  return (
    <div className="bg-basalt-50 rounded-lg border border-cream/10 px-4 py-3">
      <div className="flex items-center gap-3">
        {/* Editable name */}
        {isEditingName ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              saveName()
            }}
            className="flex-1 min-w-0"
          >
            <input
              ref={nameInputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setEditName(contractor.name)
                  setIsEditingName(false)
                }
              }}
              className="w-full px-2 py-1 text-sm font-medium bg-basalt border border-sandstone rounded text-cream outline-none"
            />
          </form>
        ) : (
          <button
            type="button"
            onClick={() => {
              setEditName(contractor.name)
              setIsEditingName(true)
            }}
            className="flex-1 min-w-0 text-left text-sm font-medium text-cream hover:text-sandstone transition-colors truncate"
            title="Click to rename"
          >
            {contractor.name}
          </button>
        )}
      </div>

      {/* Notes */}
      <textarea
        value={contractor.notes}
        onChange={(e) => onUpdate(contractor.id, { notes: e.target.value })}
        placeholder="Add notes about this contractor..."
        className={cn(
          'w-full mt-2 px-3 py-2 rounded-lg text-sm leading-relaxed',
          'bg-basalt border border-cream/15 text-cream',
          'placeholder:text-cream/30',
          'hover:border-cream/25',
          'focus:outline-none focus:border-sandstone focus:ring-1 focus:ring-sandstone',
          'resize-y min-h-[2.5rem]'
        )}
        rows={1}
      />
    </div>
  )
}
