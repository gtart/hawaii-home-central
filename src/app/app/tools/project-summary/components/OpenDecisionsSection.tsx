'use client'

import { useState, useEffect, useRef } from 'react'
import type { DecisionStatus } from '@/data/project-summary'
import { DECISION_STATUS_CONFIG, DECISION_STATUS_CYCLE } from '../constants'
import type { ProjectSummaryStateAPI } from '../useProjectSummaryState'
import { SectionHeader } from './SectionHeader'
import { InlineEdit } from './InlineEdit'
import { StatusBadge } from './StatusBadge'
import { LinkPills } from './LinkPills'
import { AttachMenu } from './AttachMenu'

interface OpenDecisionsSectionProps {
  api: ProjectSummaryStateAPI
  commentCounts?: Map<string, number>
  /** Entry ID to auto-expand and scroll to (from ?focus= query param) */
  focusEntryId?: string
}

export function OpenDecisionsSection({ api, commentCounts, focusEntryId }: OpenDecisionsSectionProps) {
  const { payload, readOnly, addDecision, updateDecision, deleteDecision, addLink, removeLink } = api
  const { openDecisions } = payload
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const focusRef = useRef<HTMLDivElement>(null)

  // Auto-expand and scroll to focused entry
  useEffect(() => {
    if (!focusEntryId) return
    const exists = openDecisions.some((d) => d.id === focusEntryId)
    if (exists) {
      setExpandedId(focusEntryId)
      requestAnimationFrame(() => {
        focusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    }
  }, [focusEntryId, openDecisions])

  // Sort by status priority: active statuses first, closed last
  const STATUS_SORT_ORDER: Record<DecisionStatus, number> = {
    open: 0,
    pending_homeowner: 1,
    pending_contractor: 2,
    approved: 3,
    closed: 4,
  }
  const sortedDecisions = [...openDecisions].sort((a, b) => {
    return (STATUS_SORT_ORDER[a.status] ?? 99) - (STATUS_SORT_ORDER[b.status] ?? 99)
  })

  const activeCount = openDecisions.filter((d) => d.status !== 'closed' && d.status !== 'approved').length

  function handleAdd() {
    if (!newTitle.trim()) return
    addDecision({ title: newTitle.trim() })
    setNewTitle('')
    setShowAddForm(false)
  }

  function cycleStatus(decision: { id: string; status: DecisionStatus }) {
    const idx = DECISION_STATUS_CYCLE.indexOf(decision.status)
    const next = DECISION_STATUS_CYCLE[(idx + 1) % DECISION_STATUS_CYCLE.length]
    updateDecision(decision.id, { status: next })
  }

  return (
    <SectionHeader
      title="Open Decisions"
      count={activeCount}
      onAdd={() => setShowAddForm(!showAddForm)}
      addLabel="Add Decision"
      readOnly={readOnly}
    >
      {sortedDecisions.length === 0 && !showAddForm && (
        <p className="text-sm text-cream/30 italic">No open decisions.</p>
      )}

      <div className="space-y-2">
        {sortedDecisions.map((decision) => {
          const config = DECISION_STATUS_CONFIG[decision.status]
          const isExpanded = expandedId === decision.id
          const commentCount = commentCounts?.get(decision.id) || 0

          return (
            <div
              key={decision.id}
              ref={decision.id === focusEntryId ? focusRef : undefined}
              className={`rounded-lg border group ${
                decision.id === focusEntryId
                  ? 'bg-cream/[0.02] border-sandstone/30 ring-1 ring-sandstone/20'
                  : decision.status === 'closed'
                    ? 'bg-cream/[0.01] border-cream/[0.03] opacity-70'
                    : 'bg-cream/[0.02] border-cream/[0.04]'
              }`}
            >
              {/* Header row */}
              <div
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : decision.id)}
              >
                <svg
                  className={`w-3 h-3 text-cream/20 transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <polyline points="9 18 15 12 9 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>

                <span className={`text-sm flex-1 truncate ${
                  decision.status === 'closed' ? 'text-cream/40 line-through' : 'text-cream/70'
                }`}>
                  {decision.title}
                </span>

                <StatusBadge
                  label={config.label}
                  color={config.color}
                  bgColor={config.bgColor}
                  onClick={readOnly ? undefined : () => cycleStatus(decision)}
                  readOnly={readOnly}
                />

                {commentCount > 0 && (
                  <span className="text-[10px] text-cream/25 shrink-0">
                    {commentCount} comment{commentCount !== 1 ? 's' : ''}
                  </span>
                )}

                {!readOnly && (
                  confirmDelete === decision.id ? (
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => { deleteDecision(decision.id); setConfirmDelete(null) }}
                        className="text-[10px] text-red-400/70 hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(null)}
                        className="text-[10px] text-cream/30 hover:text-cream/50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(decision.id) }}
                      className="shrink-0 text-cream/15 hover:text-red-400/50 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete decision"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  )
                )}
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="px-3 pb-3 pt-1 border-t border-cream/[0.04] space-y-2">
                  <div>
                    <label className="text-[10px] text-cream/30 block mb-0.5">Details</label>
                    <InlineEdit
                      value={decision.description || ''}
                      onSave={(v) => updateDecision(decision.id, { description: v || undefined })}
                      placeholder="Any context on this decision..."
                      readOnly={readOnly}
                      multiline
                      displayClassName="text-xs text-cream/50"
                      className="text-xs"
                    />
                  </div>

                  {(decision.status === 'approved' || decision.status === 'closed' || decision.resolution) && (
                    <div>
                      <label className="text-[10px] text-cream/30 block mb-0.5">Resolution</label>
                      <InlineEdit
                        value={decision.resolution || ''}
                        onSave={(v) => updateDecision(decision.id, { resolution: v || undefined })}
                        placeholder="What was decided?"
                        readOnly={readOnly}
                        displayClassName="text-xs text-emerald-400/60"
                        className="text-xs"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <LinkPills
                      links={decision.links}
                      onRemove={readOnly ? undefined : (linkId) => removeLink('openDecisions', decision.id, linkId)}
                      readOnly={readOnly}
                    />
                    <AttachMenu
                      readOnly={readOnly}
                      onAttach={(link) => addLink('openDecisions', decision.id, link)}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add form */}
      {showAddForm && !readOnly && (
        <div className="mt-3 p-3 rounded-lg border border-cream/10 bg-cream/[0.03] space-y-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="What still needs to be decided?"
            className="w-full bg-cream/5 border border-cream/10 rounded-md px-3 py-2 text-sm text-cream/80 placeholder-cream/20 outline-none focus:border-sandstone/30"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowAddForm(false) }}
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs text-cream/40 hover:text-cream/60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newTitle.trim()}
              className="px-3 py-1.5 text-xs bg-sandstone/20 text-sandstone hover:bg-sandstone/30 rounded-md transition-colors disabled:opacity-30"
            >
              Add Decision
            </button>
          </div>
        </div>
      )}
    </SectionHeader>
  )
}
