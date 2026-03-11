'use client'

import { useState } from 'react'
import type { AlignmentStateAPI } from '../useAlignmentState'
import { AlignmentCreateForm } from './AlignmentCreateForm'

export function AlignmentEmptyState({ readOnly, api }: { readOnly: boolean; api: AlignmentStateAPI }) {
  const [showCreate, setShowCreate] = useState(false)

  if (showCreate) {
    return (
      <div className="max-w-2xl mx-auto">
        <AlignmentCreateForm
          api={api}
          onClose={() => setShowCreate(false)}
        />
      </div>
    )
  }

  return (
    <div className="text-center py-16 px-6 max-w-lg mx-auto">
      <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-sandstone/10 flex items-center justify-center">
        <svg className="w-7 h-7 text-sandstone/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 12h6M12 9v6" strokeLinecap="round" />
          <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="font-serif text-xl text-cream mb-2">No alignment items yet</h3>
      <p className="text-sm text-cream/50 mb-2 leading-relaxed">
        Track scope questions, mismatches, and disagreements with your contractor.
        Use this when something is unclear, changed, or needs reconciliation.
      </p>
      <p className="text-xs text-cream/30 mb-6 leading-relaxed">
        Choosing materials or products? That&apos;s <span className="text-cream/50">Selections</span>.
        Something built wrong or needs fixing? That&apos;s <span className="text-cream/50">Fix List</span>.
      </p>
      {!readOnly && (
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-sandstone text-basalt hover:bg-sandstone/90 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Add First Item
        </button>
      )}
    </div>
  )
}
