'use client'

import { useState, useMemo } from 'react'
import type { ProjectSummaryStateAPI } from '../useProjectSummaryState'
import { InlineEdit } from './InlineEdit'

/** Normalize a cost string into dollar format if it looks like a number */
function formatCost(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return trimmed
  if (trimmed.includes('$')) return trimmed
  const match = trimmed.match(/^([+-]?)\s*([0-9][0-9,]*\.?\d*)$/)
  if (!match) return trimmed
  const sign = match[1]
  const num = parseFloat(match[2].replace(/,/g, ''))
  if (isNaN(num)) return trimmed
  return `${sign}$${num.toLocaleString()}`
}

interface SummarySectionProps {
  api: ProjectSummaryStateAPI
  /** Scroll to Changes section and open the add form */
  onScrollToChanges?: () => void
}

export function SummarySection({ api, onScrollToChanges }: SummarySectionProps) {
  const { payload, readOnly, updateSummary } = api
  const { summary } = payload
  const [showBudget, setShowBudget] = useState(
    Boolean(summary.baseline_amount || summary.current_total || summary.budget_note)
  )

  const approvedChanges = useMemo(
    () => payload.changes.filter((c) => c.status === 'approved'),
    [payload.changes]
  )

  // Best-effort sum of parseable cost_impact values from approved changes
  const approvedCostSum = useMemo(() => {
    let sum = 0
    let hasParseable = false
    for (const c of approvedChanges) {
      if (c.cost_impact) {
        const num = parseFloat(c.cost_impact.replace(/[^0-9.\-+]/g, ''))
        if (!isNaN(num)) {
          sum += num
          hasParseable = true
        }
      }
    }
    return hasParseable ? sum : null
  }, [approvedChanges])

  // Parse baseline amount for auto-computing current total
  const baselineNum = useMemo(() => {
    if (!summary.baseline_amount) return null
    const num = parseFloat(summary.baseline_amount.replace(/[^0-9.\-+]/g, ''))
    return isNaN(num) ? null : num
  }, [summary.baseline_amount])

  // Auto-computed current total = baseline + approved changes cost
  const computedTotal = useMemo(() => {
    if (baselineNum === null) return null
    return baselineNum + (approvedCostSum ?? 0)
  }, [baselineNum, approvedCostSum])

  return (
    <div className="rounded-xl border border-cream/[0.06] bg-cream/[0.02] p-5">
      <h2 className="text-sm font-semibold text-cream/80 mb-3">Project Summary</h2>

      <InlineEdit
        value={summary.text}
        onSave={(text) => updateSummary({ text })}
        placeholder="Describe the renovation or project."
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
            {!readOnly && !summary.baseline_amount && !summary.current_total && !summary.budget_note && approvedChanges.length === 0 && (
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
                onSave={(v) => updateSummary({ baseline_amount: v ? formatCost(v) : undefined })}
                placeholder="e.g. $85,000"
                readOnly={readOnly}
                displayClassName="text-sm text-cream/60"
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] text-cream/30 block mb-1">Approved Changes</label>
              <div className="flex items-baseline gap-2">
                {approvedChanges.length > 0 ? (
                  <span className="text-sm text-emerald-400/70">
                    {approvedChanges.length} approved
                    {approvedCostSum !== null && (
                      <span className="text-cream/40 ml-1">
                        ({approvedCostSum >= 0 ? '+' : ''}${Math.abs(approvedCostSum).toLocaleString()})
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-sm text-cream/30">None yet</span>
                )}
                {onScrollToChanges && (
                  <button
                    type="button"
                    onClick={onScrollToChanges}
                    className="text-[10px] text-sandstone/50 hover:text-sandstone transition-colors"
                  >
                    {approvedChanges.length > 0 ? 'See Changes' : '+ Add Change'}
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-cream/30 block mb-1">Current Total</label>
              {computedTotal !== null ? (
                <div>
                  <span className="text-sm text-cream/70 font-medium">
                    ${computedTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                  <p className="text-[9px] text-cream/25 mt-0.5 leading-tight">
                    Auto-calculated from baseline{approvedCostSum ? ' + approved changes' : ''}. May not reflect all costs.
                  </p>
                </div>
              ) : (
                <span className="text-sm text-cream/30 italic">
                  {summary.baseline_amount ? 'Enter parseable amounts' : 'Set baseline first'}
                </span>
              )}
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
