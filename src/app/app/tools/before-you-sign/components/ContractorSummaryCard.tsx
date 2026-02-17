'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { BYSContractor, ContractType } from '../types'

function contractTypeLabel(type: ContractType): string {
  const labels: Record<ContractType, string> = {
    'fixed': 'Fixed Price',
    'time_materials': 'Time & Materials',
    'cost_plus': 'Cost Plus',
    'not_sure': 'Not sure',
    '': '',
  }
  return labels[type] || type
}

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

      {/* Contract details */}
      {(contractor.totalValue || contractor.contractType) && (
        <div className="mt-3 pt-3 border-t border-cream/5">
          <h3 className="text-xs font-medium text-cream/60 mb-2">Contract Details</h3>
          <div className="flex flex-wrap gap-4">
            {contractor.totalValue && (
              <div>
                <span className="text-xs text-cream/50">Total Value:</span>
                <span className="ml-1.5 text-sm text-cream/80 font-medium">
                  {contractor.totalValue}
                </span>
              </div>
            )}
            {contractor.contractType && contractTypeLabel(contractor.contractType) && (
              <div>
                <span className="text-xs text-cream/50">Type:</span>
                <span className="ml-1.5 text-sm text-cream/80">
                  {contractTypeLabel(contractor.contractType)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      <label className="block text-xs text-cream/40 mt-3 mb-1">
        Private notes (only you can see this)
      </label>
      <textarea
        value={contractor.notes}
        onChange={(e) => onUpdate(contractor.id, { notes: e.target.value })}
        placeholder="e.g., Met on-site Jan 15. Seemed thorough. Asked about permits..."
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
