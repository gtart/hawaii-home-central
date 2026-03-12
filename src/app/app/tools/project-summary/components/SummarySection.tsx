'use client'

import { useState } from 'react'
import type { ProjectSummaryStateAPI } from '../useProjectSummaryState'
import { InlineEdit } from './InlineEdit'

interface SummarySectionProps {
  api: ProjectSummaryStateAPI
}

export function SummarySection({ api }: SummarySectionProps) {
  const { payload, readOnly, updateSummary } = api
  const { summary } = payload
  const [showBudget, setShowBudget] = useState(
    Boolean(summary.baseline_amount || summary.approved_changes_total || summary.current_total || summary.budget_note)
  )

  return (
    <div className="rounded-xl border border-cream/[0.06] bg-cream/[0.02] p-5">
      <h2 className="text-sm font-semibold text-cream/80 mb-3">Current Project Summary</h2>

      <InlineEdit
        value={summary.text}
        onSave={(text) => updateSummary({ text })}
        placeholder="Describe the current state of your project in plain language..."
        readOnly={readOnly}
        multiline
        displayClassName="text-sm text-cream/70 leading-relaxed"
        className="text-sm leading-relaxed"
      />

      {/* Budget toggle */}
      {!showBudget && !readOnly && (
        <button
          type="button"
          onClick={() => setShowBudget(true)}
          className="mt-4 text-[11px] text-cream/30 hover:text-cream/50 transition-colors"
        >
          + Add budget details
        </button>
      )}
      {!showBudget && readOnly && !summary.baseline_amount && !summary.current_total && null}

      {showBudget && (
        <div className="mt-4 pt-4 border-t border-cream/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] text-cream/40 uppercase tracking-wider font-medium">Budget Overview</span>
            {!readOnly && !summary.baseline_amount && !summary.approved_changes_total && !summary.current_total && !summary.budget_note && (
              <button
                type="button"
                onClick={() => setShowBudget(false)}
                className="text-[10px] text-cream/20 hover:text-cream/40 transition-colors"
              >
                Hide
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="text-[10px] text-cream/30 block mb-1">Baseline Amount</label>
              <InlineEdit
                value={summary.baseline_amount || ''}
                onSave={(v) => updateSummary({ baseline_amount: v || undefined })}
                placeholder="e.g. $85,000"
                readOnly={readOnly}
                displayClassName="text-sm text-cream/60"
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] text-cream/30 block mb-1">Approved Changes</label>
              <InlineEdit
                value={summary.approved_changes_total || ''}
                onSave={(v) => updateSummary({ approved_changes_total: v || undefined })}
                placeholder="e.g. +$4,200"
                readOnly={readOnly}
                displayClassName="text-sm text-cream/60"
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] text-cream/30 block mb-1">Current Total</label>
              <InlineEdit
                value={summary.current_total || ''}
                onSave={(v) => updateSummary({ current_total: v || undefined })}
                placeholder="e.g. $89,200"
                readOnly={readOnly}
                displayClassName="text-sm text-cream/60"
                className="text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-cream/30 block mb-1">Budget Note</label>
            <InlineEdit
              value={summary.budget_note || ''}
              onSave={(v) => updateSummary({ budget_note: v || undefined })}
              placeholder="Any additional budget context..."
              readOnly={readOnly}
              displayClassName="text-xs text-cream/50"
              className="text-xs"
            />
          </div>
        </div>
      )}
    </div>
  )
}
