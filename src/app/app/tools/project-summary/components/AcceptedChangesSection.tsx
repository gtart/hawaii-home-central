'use client'

import { useState, useMemo } from 'react'
import type { SummaryChange } from '@/data/project-summary'
import { toChangeLogStatus } from '../constants'
import type { ProjectSummaryStateAPI } from '../useProjectSummaryState'
import { InlineEdit } from './InlineEdit'

interface AcceptedChangesSectionProps {
  api: ProjectSummaryStateAPI
}

/** Changes with status added_to_plan (approved_by_homeowner, accepted_by_contractor, done) */
const ADDED_STATUSES = new Set(['approved_by_homeowner', 'accepted_by_contractor', 'done'])

export function AcceptedChangesSection({ api }: AcceptedChangesSectionProps) {
  const { payload, readOnly, updateChange } = api
  const [editingId, setEditingId] = useState<string | null>(null)

  const acceptedChanges = useMemo(
    () => payload.changes
      .filter((c) => ADDED_STATUSES.has(c.status))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [payload.changes]
  )

  if (acceptedChanges.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-xs font-semibold text-cream/50 uppercase tracking-wider">Changes Added to Plan</h2>
        <span className="text-[10px] text-cream/30 tabular-nums">{acceptedChanges.length}</span>
      </div>

      <div className="space-y-2">
        {acceptedChanges.map((change) => {
          const isEditing = editingId === change.id

          return (
            <div
              key={change.id}
              className="rounded-lg border border-emerald-400/8 bg-stone-50/60 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Title */}
                  {isEditing ? (
                    <InlineEdit
                      value={change.title}
                      onSave={(title) => updateChange(change.id, { title })}
                      readOnly={false}
                      displayClassName="text-sm text-cream/80 font-medium leading-snug"
                      className="text-sm font-medium"
                    />
                  ) : (
                    <p className="text-sm text-cream/80 font-medium leading-snug">{change.title}</p>
                  )}

                  {/* Description */}
                  {isEditing ? (
                    <div className="mt-1">
                      <InlineEdit
                        value={change.description || ''}
                        onSave={(v) => updateChange(change.id, { description: v || undefined })}
                        readOnly={false}
                        multiline
                        displayClassName="text-sm text-cream/55 leading-relaxed"
                        className="text-sm leading-relaxed"
                      />
                    </div>
                  ) : change.description ? (
                    <p className="text-sm text-cream/55 leading-relaxed mt-1">{change.description}</p>
                  ) : null}

                  {/* Cost + timeline inline */}
                  {(change.cost_impact || change.schedule_impact) && !isEditing && (
                    <div className="flex items-center gap-3 mt-1.5">
                      {change.cost_impact && (
                        <span className="text-[10px] text-cream/40 tabular-nums">Cost: {change.cost_impact}</span>
                      )}
                      {change.schedule_impact && (
                        <span className="text-[10px] text-cream/40">Timeline: {change.schedule_impact}</span>
                      )}
                    </div>
                  )}

                  {isEditing && (
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-cream/25">Cost:</span>
                        <InlineEdit
                          value={change.cost_impact || ''}
                          onSave={(v) => updateChange(change.id, { cost_impact: v || undefined })}
                          placeholder="e.g. +$2,500"
                          readOnly={false}
                          displayClassName="text-[10px] text-cream/45 tabular-nums"
                          className="text-[10px]"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-cream/25">Timeline:</span>
                        <InlineEdit
                          value={change.schedule_impact || ''}
                          onSave={(v) => updateChange(change.id, { schedule_impact: v || undefined })}
                          placeholder="e.g. +2 weeks"
                          readOnly={false}
                          displayClassName="text-[10px] text-cream/45"
                          className="text-[10px]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Edit toggle */}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => setEditingId(isEditing ? null : change.id)}
                    className={`shrink-0 p-1 rounded transition-colors ${
                      isEditing
                        ? 'text-sandstone/70 bg-sandstone/10'
                        : 'text-cream/25 hover:text-cream/45'
                    }`}
                    title={isEditing ? 'Done editing' : 'Edit'}
                  >
                    {isEditing ? (
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
