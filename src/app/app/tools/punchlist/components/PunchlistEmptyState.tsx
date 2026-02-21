'use client'

import { useState } from 'react'
import type { PunchlistStateAPI } from '../usePunchlistState'
import { PunchlistItemForm } from './PunchlistItemForm'

interface Props {
  readOnly: boolean
  api: PunchlistStateAPI
}

export function PunchlistEmptyState({ readOnly, api }: Props) {
  const [showForm, setShowForm] = useState(false)

  return (
    <>
      <div className="bg-basalt-50 rounded-card p-8 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-sandstone/10 flex items-center justify-center">
          <svg className="w-7 h-7 text-sandstone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinecap="round" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <path d="M9 14l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="font-serif text-2xl text-cream mb-2">
          No fixes yet
        </h2>
        <p className="text-cream/50 text-sm mb-6 max-w-md mx-auto">
          Add your first item to start tracking fixes.
        </p>
        {!readOnly && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-sandstone text-basalt font-medium rounded-lg hover:bg-sandstone-light transition-colors"
          >
            Add First Item
          </button>
        )}
      </div>

      {showForm && (
        <PunchlistItemForm
          api={api}
          onClose={() => setShowForm(false)}
        />
      )}
    </>
  )
}
