'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import type { PlanStatus } from '@/data/project-summary'
import { PLAN_STATUS_CONFIG, PLAN_STATUS_ORDER } from '../constants'
import type { ProjectSummaryStateAPI } from '../useProjectSummaryState'
import { InlineEdit } from './InlineEdit'
import { PlanItemList } from './PlanItemList'

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

interface CurrentPlanSectionProps {
  api: ProjectSummaryStateAPI
  onScrollToChanges?: () => void
}

export function CurrentPlanSection({ api, onScrollToChanges }: CurrentPlanSectionProps) {
  const {
    payload, readOnly,
    updatePlanScope, updatePlanStatus,
    addPlanItem, updatePlanItem, deletePlanItem,
    updateBudget,
  } = api
  const { plan, budget, changes } = payload

  const [showBudget, setShowBudget] = useState(
    Boolean(budget.baseline_amount || budget.budget_note)
  )
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const statusDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!statusDropdownOpen) return
    function handleClick(e: MouseEvent) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setStatusDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [statusDropdownOpen])

  // Budget: approved changes with parseable costs
  const approvedStatuses = new Set(['approved_by_homeowner', 'accepted_by_contractor', 'done'])
  const approvedChanges = useMemo(
    () => changes.filter((c) => approvedStatuses.has(c.status)),
    [changes]
  )

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

  const baselineNum = useMemo(() => {
    if (!budget.baseline_amount) return null
    const num = parseFloat(budget.baseline_amount.replace(/[^0-9.\-+]/g, ''))
    return isNaN(num) ? null : num
  }, [budget.baseline_amount])

  const computedTotal = useMemo(() => {
    if (baselineNum === null) return null
    return baselineNum + (approvedCostSum ?? 0)
  }, [baselineNum, approvedCostSum])

  // Unincorporated accepted changes
  const unincorporatedCount = useMemo(
    () => changes.filter((c) =>
      (c.status === 'accepted_by_contractor' || c.status === 'done') && !c.incorporated
    ).length,
    [changes]
  )

  const statusConfig = PLAN_STATUS_CONFIG[plan.status]

  return (
    <div className="rounded-xl border border-cream/[0.06] bg-cream/[0.02] p-5 space-y-5">
      {/* Header with plan status */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-cream/80">Current Plan</h2>

        <div className="relative" ref={statusDropdownRef}>
          <button
            type="button"
            onClick={readOnly ? undefined : () => setStatusDropdownOpen(!statusDropdownOpen)}
            disabled={readOnly}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium ${statusConfig.color} ${statusConfig.bgColor} ${
              readOnly ? '' : 'hover:opacity-80 transition-opacity cursor-pointer'
            }`}
            title={readOnly ? statusConfig.label : 'Change plan status'}
          >
            {statusConfig.label}
            {!readOnly && (
              <svg className="w-2.5 h-2.5 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>

          {statusDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-lg border border-cream/10 bg-[#1a1a1a] shadow-xl py-1">
              {PLAN_STATUS_ORDER.map((status) => {
                const cfg = PLAN_STATUS_CONFIG[status]
                const isActive = status === plan.status
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      if (status !== plan.status) {
                        updatePlanStatus(status)
                      }
                      setStatusDropdownOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors ${
                      isActive ? 'bg-cream/5' : 'hover:bg-cream/5'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${cfg.bgColor} ${isActive ? 'ring-1 ring-cream/20' : ''}`} />
                    <span className={cfg.color}>{cfg.label}</span>
                    {isActive && <span className="text-cream/20 ml-auto text-[10px]">Current</span>}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Changed-since indicator */}
      {plan.content_changed_since_status && plan.status_changed_at && (
        <div className="text-[10px] text-amber-400/50 flex items-center gap-1.5">
          <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" />
            <line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round" />
          </svg>
          Plan content changed since last marked as {PLAN_STATUS_CONFIG[plan.status].label.toLowerCase()}
        </div>
      )}

      {/* Unincorporated changes banner */}
      {unincorporatedCount > 0 && (
        <div className="text-[10px] text-teal-400/60 bg-teal-400/5 rounded-lg px-3 py-2 flex items-center gap-2">
          <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          {unincorporatedCount} accepted change{unincorporatedCount !== 1 ? 's' : ''} not yet incorporated into plan
          {onScrollToChanges && (
            <button
              type="button"
              onClick={onScrollToChanges}
              className="ml-auto text-teal-400/80 hover:text-teal-400 transition-colors underline"
            >
              View
            </button>
          )}
        </div>
      )}

      {/* Scope */}
      <div>
        <label className="text-[10px] text-cream/30 uppercase tracking-wider font-medium block mb-1.5">Scope</label>
        <InlineEdit
          value={plan.scope}
          onSave={(text) => updatePlanScope(text)}
          placeholder="Describe the renovation or project scope."
          readOnly={readOnly}
          multiline
          displayClassName="text-sm text-cream/70 leading-relaxed"
          className="text-sm leading-relaxed"
        />
      </div>

      {/* Structured lists */}
      <div className="space-y-4">
        <div>
          <label className="text-[10px] text-cream/30 uppercase tracking-wider font-medium block mb-1.5">
            What&apos;s Included
          </label>
          <PlanItemList
            items={plan.included}
            onAdd={(text) => addPlanItem('included', text)}
            onUpdate={(id, text) => updatePlanItem(id, { text })}
            onDelete={deletePlanItem}
            readOnly={readOnly}
            emptyMessage="No items listed yet."
            addPlaceholder="Add included item..."
          />
        </div>

        <div>
          <label className="text-[10px] text-cream/30 uppercase tracking-wider font-medium block mb-1.5">
            What&apos;s Not Included
          </label>
          <PlanItemList
            items={plan.not_included}
            onAdd={(text) => addPlanItem('not_included', text)}
            onUpdate={(id, text) => updatePlanItem(id, { text })}
            onDelete={deletePlanItem}
            readOnly={readOnly}
            emptyMessage="Nothing excluded yet."
            addPlaceholder="Add excluded item..."
          />
        </div>

        <div>
          <label className="text-[10px] text-cream/30 uppercase tracking-wider font-medium block mb-1.5">
            Still to Decide
          </label>
          <PlanItemList
            items={plan.still_to_decide}
            onAdd={(text) => addPlanItem('still_to_decide', text)}
            onUpdate={(id, text) => updatePlanItem(id, { text })}
            onDelete={deletePlanItem}
            readOnly={readOnly}
            emptyMessage="All decisions made."
            addPlaceholder="Add something that needs deciding..."
          />
        </div>
      </div>

      {/* Budget */}
      {!showBudget && !readOnly && (
        <button
          type="button"
          onClick={() => setShowBudget(true)}
          className="text-[11px] text-cream/30 hover:text-cream/50 transition-colors"
        >
          + Add budget details
        </button>
      )}

      {showBudget && (
        <div className="pt-4 border-t border-cream/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] text-cream/40 uppercase tracking-wider font-medium">Budget Overview</span>
            {!readOnly && !budget.baseline_amount && !budget.budget_note && approvedChanges.length === 0 && (
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
                value={budget.baseline_amount || ''}
                onSave={(v) => updateBudget({ baseline_amount: v ? formatCost(v) : undefined })}
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
                  {budget.baseline_amount ? 'Enter parseable amounts' : 'Set baseline first'}
                </span>
              )}
            </div>
          </div>
          <div>
            <label className="text-[10px] text-cream/30 block mb-1">Budget Note</label>
            <InlineEdit
              value={budget.budget_note || ''}
              onSave={(v) => updateBudget({ budget_note: v || undefined })}
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
