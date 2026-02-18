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
  onDelete: (id: string) => void
}

export function ContractorSummaryCard({
  contractor,
  onUpdate,
  onDelete,
}: ContractorSummaryCardProps) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState(contractor.name)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
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

      {/* Notes preview */}
      {contractor.notes && (
        <div className="mt-3 pt-3 border-t border-cream/5">
          <p className="text-xs text-cream/40 mb-1">Notes</p>
          <p className="text-sm text-cream/60 line-clamp-2">{contractor.notes}</p>
        </div>
      )}

      {/* Delete button */}
      <div className="mt-4 pt-4 border-t border-cream/5">
        {showDeleteConfirm ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-cream/60">Delete this contractor?</span>
            <button
              type="button"
              onClick={() => {
                onDelete(contractor.id)
                setShowDeleteConfirm(false)
              }}
              className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 font-medium transition-colors"
            >
              Yes, delete
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3 py-1.5 text-sm text-cream/60 hover:text-cream/80 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-sm text-cream/40 hover:text-red-400 transition-colors"
          >
            Delete contractor
          </button>
        )}
      </div>
    </div>
  )
}
