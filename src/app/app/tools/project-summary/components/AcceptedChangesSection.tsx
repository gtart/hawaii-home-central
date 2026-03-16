'use client'

import { useState, useMemo } from 'react'
import { CHANGE_LOG_STATUS_CONFIG } from '../constants'
import type { ChangeLogStatus } from '../constants'
import type { ProjectSummaryStateAPI } from '../useProjectSummaryState'

interface AcceptedChangesSectionProps {
  api: ProjectSummaryStateAPI
}

const ADDED_STATUSES = new Set(['approved_by_homeowner', 'accepted_by_contractor', 'done'])

export function AcceptedChangesSection({ api }: AcceptedChangesSectionProps) {
  const { payload, readOnly, updateChange, addChange } = api
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)

  const acceptedChanges = useMemo(
    () => payload.changes
      .filter((c) => ADDED_STATUSES.has(c.status))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [payload.changes]
  )

  function handleAddChange() {
    if (!newTitle.trim()) return
    addChange({
      title: newTitle.trim(),
      status: 'approved_by_homeowner',
    })
    setNewTitle('')
    setShowAddForm(false)
  }

  function handleRemoveFromPlan(changeId: string, target: 'pending' | 'closed') {
    const storageStatus = target === 'pending'
      ? CHANGE_LOG_STATUS_CONFIG['noted' as ChangeLogStatus].storageStatus
      : CHANGE_LOG_STATUS_CONFIG['superseded' as ChangeLogStatus].storageStatus
    updateChange(changeId, { status: storageStatus })
    setConfirmRemoveId(null)
  }

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold text-cream/50 uppercase tracking-wider">Changes Added to Plan</h2>
          {acceptedChanges.length > 0 && (
            <span className="text-[10px] text-cream/30 tabular-nums">{acceptedChanges.length}</span>
          )}
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-sandstone/70 hover:text-sandstone bg-sandstone/8 hover:bg-sandstone/12 transition-colors"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Add a change
          </button>
        )}
      </div>

      {/* Quick add form */}
      {showAddForm && !readOnly && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="What changed?"
            className="flex-1 bg-stone-200 border border-cream/12 rounded-md px-3 py-2 text-sm text-cream/90 placeholder-cream/30 outline-none focus:border-sandstone/30"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddChange()
              if (e.key === 'Escape') { setShowAddForm(false); setNewTitle('') }
            }}
          />
          <button type="button" onClick={handleAddChange} disabled={!newTitle.trim()} className="px-3 py-2 text-xs bg-sandstone/15 text-sandstone hover:bg-sandstone/25 rounded-md transition-colors disabled:opacity-30">Add</button>
          <button type="button" onClick={() => { setShowAddForm(false); setNewTitle('') }} className="px-2 py-2 text-xs text-cream/45 hover:text-cream/60 transition-colors">Cancel</button>
        </div>
      )}

      {/* Empty state */}
      {acceptedChanges.length === 0 && !showAddForm && (
        <p className="text-xs text-cream/30 italic">No changes added to the plan yet.</p>
      )}

      {/* Table */}
      {acceptedChanges.length > 0 && (
        <div className="rounded-lg border border-cream/8 overflow-hidden">
          {/* Desktop table */}
          <table className="w-full hidden md:table">
            <thead>
              <tr className="border-b border-cream/8">
                <th className="text-left text-[10px] text-cream/35 font-medium uppercase tracking-wider px-4 py-2">Change</th>
                <th className="text-left text-[10px] text-cream/35 font-medium uppercase tracking-wider px-3 py-2">Added</th>
                <th className="text-left text-[10px] text-cream/35 font-medium uppercase tracking-wider px-3 py-2">By</th>
                <th className="text-left text-[10px] text-cream/35 font-medium uppercase tracking-wider px-3 py-2">Last Modified</th>
                {!readOnly && <th className="w-20" />}
              </tr>
            </thead>
            <tbody>
              {acceptedChanges.map((change) => (
                <tr key={change.id} className="border-b border-cream/6 last:border-0 group hover:bg-stone-50/50 transition-colors">
                  <td className="px-4 py-2.5">
                    <span className="text-sm text-cream/80">{change.title}</span>
                    {change.description && (
                      <p className="text-[10px] text-cream/35 mt-0.5 line-clamp-1">{change.description}</p>
                    )}
                    {change.cost_impact && (
                      <span className="text-[10px] text-cream/40 tabular-nums">{change.cost_impact}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="text-[11px] text-cream/40 tabular-nums">
                      {new Date(change.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="text-[11px] text-cream/40">
                      {change.requested_by || change.updated_by || '—'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="text-[11px] text-cream/40 tabular-nums">
                      {change.updated_at !== change.created_at
                        ? new Date(change.updated_at).toLocaleDateString()
                        : '—'}
                    </span>
                  </td>
                  {!readOnly && (
                    <td className="px-2 py-2.5 text-right">
                      {confirmRemoveId === change.id ? (
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveFromPlan(change.id, 'pending')}
                            className="text-[10px] text-amber-400/70 hover:text-amber-400 transition-colors whitespace-nowrap"
                          >
                            To pending
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveFromPlan(change.id, 'closed')}
                            className="text-[10px] text-cream/40 hover:text-cream/60 transition-colors whitespace-nowrap"
                          >
                            Not needed
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmRemoveId(null)}
                            className="text-[10px] text-cream/30 hover:text-cream/50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmRemoveId(change.id)}
                          className="text-[10px] text-cream/20 hover:text-cream/40 transition-colors md:opacity-0 md:group-hover:opacity-100"
                          title="Remove from plan"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile list */}
          <div className="md:hidden divide-y divide-cream/6">
            {acceptedChanges.map((change) => (
              <div key={change.id} className="px-4 py-3 group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-cream/80 block">{change.title}</span>
                    {change.description && (
                      <p className="text-[10px] text-cream/35 mt-0.5 line-clamp-1">{change.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-cream/30">
                      <span className="tabular-nums">{new Date(change.created_at).toLocaleDateString()}</span>
                      {(change.requested_by || change.updated_by) && (
                        <span>by {change.requested_by || change.updated_by}</span>
                      )}
                      {change.cost_impact && (
                        <span className="tabular-nums">{change.cost_impact}</span>
                      )}
                    </div>
                  </div>
                  {!readOnly && (
                    confirmRemoveId === change.id ? (
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <button type="button" onClick={() => handleRemoveFromPlan(change.id, 'pending')} className="text-[10px] text-amber-400/70">To pending</button>
                        <button type="button" onClick={() => handleRemoveFromPlan(change.id, 'closed')} className="text-[10px] text-cream/40">Not needed</button>
                        <button type="button" onClick={() => setConfirmRemoveId(null)} className="text-[10px] text-cream/30">Cancel</button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmRemoveId(change.id)}
                        className="text-[10px] text-cream/20 hover:text-cream/40 transition-colors shrink-0"
                      >
                        Remove
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
