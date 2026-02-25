'use client'

import { useState, useEffect } from 'react'
import type { DecisionV3 } from '@/data/finish-decisions'

export function AssignToSelectionModal({
  optionName,
  selections,
  onAssign,
  onClose,
}: {
  optionName: string
  selections: DecisionV3[]
  onAssign: (targetDecisionId: string) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const filtered = search.trim()
    ? selections.filter((d) => d.title.toLowerCase().includes(search.toLowerCase()))
    : selections

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-basalt-50 border-t sm:border border-cream/10 rounded-t-xl sm:rounded-xl w-full sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-cream/10 px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-medium text-cream">Assign to selection</h2>
            <p className="text-xs text-cream/40 mt-0.5">
              Move &ldquo;{optionName || 'Untitled'}&rdquo; to a selection
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-cream/40 hover:text-cream transition-colors shrink-0 ml-4"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Search (only if many selections) */}
        {selections.length > 5 && (
          <div className="px-5 pt-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search selections..."
              autoFocus
              className="w-full px-3 py-2 bg-basalt border border-cream/15 text-cream text-sm rounded-lg placeholder:text-cream/25 focus:outline-none focus:border-sandstone/50"
            />
          </div>
        )}

        {/* Selection tiles */}
        <div className="flex-1 overflow-y-auto p-5 pt-3">
          {filtered.length === 0 ? (
            <p className="text-sm text-cream/40 text-center py-4">
              {search ? 'No matching selections.' : 'No selections available.'}
            </p>
          ) : (
            <div className="space-y-2">
              {filtered.map((decision) => (
                <button
                  key={decision.id}
                  type="button"
                  onClick={() => onAssign(decision.id)}
                  className="w-full text-left px-4 py-3 bg-basalt rounded-lg border border-cream/8 hover:border-cream/25 hover:bg-basalt/50 transition-all"
                >
                  <p className="text-sm font-medium text-cream">{decision.title}</p>
                  <p className="text-[11px] text-cream/30 mt-0.5">
                    {decision.options.length} idea{decision.options.length !== 1 ? 's' : ''}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
