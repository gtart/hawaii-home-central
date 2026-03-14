'use client'

import { useState, useMemo, useCallback } from 'react'
import { PLAN_STATUS_CONFIG } from '../constants'
import type { ProjectSummaryStateAPI } from '../useProjectSummaryState'
import { InlineEdit } from './InlineEdit'
import { PlanItemList } from './PlanItemList'
import { OpenItemsList } from './OpenItemsList'

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

/** Edit intervention dialog — shown when user tries to edit an approved plan (PCV1-003) */
function ApprovedPlanInterventionDialog({
  onUnlock,
  onCreateChange,
  onDismiss,
}: {
  onUnlock: () => void
  onCreateChange: () => void
  onDismiss: () => void
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-xl border border-cream/10 bg-[#1a1a1a] p-6 shadow-2xl space-y-4">
        <h3 className="text-base font-semibold text-cream">This plan is approved</h3>
        <p className="text-sm text-cream/60 leading-relaxed">
          Your plan is locked to protect the agreed-upon scope. To make changes, you can either
          unlock the plan for direct editing or create a formal change record.
        </p>
        <div className="space-y-2">
          <button
            type="button"
            onClick={onUnlock}
            className="w-full text-left px-4 py-3 rounded-lg border border-amber-400/20 bg-amber-400/5 hover:bg-amber-400/10 transition-colors"
          >
            <div className="text-sm font-medium text-amber-400">Unlock Plan for Revision</div>
            <div className="text-xs text-cream/40 mt-0.5">
              Temporarily unlock the plan so you can edit it directly. You can re-approve it when done.
            </div>
          </button>
          <button
            type="button"
            onClick={onCreateChange}
            className="w-full text-left px-4 py-3 rounded-lg border border-emerald-400/20 bg-emerald-400/5 hover:bg-emerald-400/10 transition-colors"
          >
            <div className="text-sm font-medium text-emerald-400">Create a Change Instead</div>
            <div className="text-xs text-cream/40 mt-0.5">
              Log a formal change to the plan. The plan stays locked while the change is reviewed and approved.
            </div>
          </button>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="w-full text-center text-xs text-cream/30 hover:text-cream/50 transition-colors py-1"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

/** Approval warning — shown when approving with unresolved open items (PCV1-013) */
function ApproveWithOpenItemsWarning({
  unresolvedCount,
  onProceed,
  onDismiss,
}: {
  unresolvedCount: number
  onProceed: () => void
  onDismiss: () => void
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-cream/10 bg-[#1a1a1a] p-5 shadow-2xl space-y-3">
        <h3 className="text-sm font-semibold text-cream flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" />
            <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" />
          </svg>
          Unresolved Open Items
        </h3>
        <p className="text-xs text-cream/50 leading-relaxed">
          This plan has <strong className="text-amber-400">{unresolvedCount} unresolved open item{unresolvedCount !== 1 ? 's' : ''}</strong>.
          You can still approve, but these items will remain visible and tracked.
        </p>
        <div className="flex gap-2 justify-end pt-1">
          <button
            type="button"
            onClick={onDismiss}
            className="text-xs text-cream/30 hover:text-cream/50 transition-colors px-3 py-1.5"
          >
            Go Back
          </button>
          <button
            type="button"
            onClick={onProceed}
            className="text-xs font-medium text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 transition-colors px-3 py-1.5 rounded-lg"
          >
            Approve Anyway
          </button>
        </div>
      </div>
    </div>
  )
}

export function CurrentPlanSection({ api, onScrollToChanges }: CurrentPlanSectionProps) {
  const {
    payload, readOnly,
    updatePlanScope,
    approvePlan, unlockPlan, reapprovePlan,
    addPlanItem, updatePlanItem, deletePlanItem,
    addOpenItem, updateOpenItem, resolveOpenItem, deleteOpenItem,
    updateBudget,
  } = api
  const { plan, budget, changes } = payload

  const [showBudget, setShowBudget] = useState(
    Boolean(budget.baseline_amount || budget.budget_note)
  )
  const [showIntervention, setShowIntervention] = useState(false)
  const [showUnlockPrompt, setShowUnlockPrompt] = useState(false)
  const [unlockReason, setUnlockReason] = useState('')

  const isApproved = plan.status === 'approved'
  const isUnlocked = plan.status === 'unlocked'

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

  // Open items readiness (PCV1-014)
  const unresolvedOpenItems = useMemo(
    () => plan.open_items.filter((i) => i.status === 'open' || i.status === 'waiting'),
    [plan.open_items]
  )

  const [showApproveWarning, setShowApproveWarning] = useState(false)

  const statusConfig = PLAN_STATUS_CONFIG[plan.status]

  // Intercept edit attempts on approved plan (PCV1-003)
  const handleEditAttempt = useCallback(() => {
    if (isApproved && !readOnly) {
      setShowIntervention(true)
    }
  }, [isApproved, readOnly])

  const handleUnlock = useCallback(() => {
    setShowIntervention(false)
    setUnlockReason('')
    setShowUnlockPrompt(true)
  }, [])

  const handleCreateChange = useCallback(() => {
    setShowIntervention(false)
    onScrollToChanges?.()
  }, [onScrollToChanges])

  return (
    <div className={`rounded-xl border p-5 md:p-6 space-y-5 ${
      isApproved
        ? 'border-emerald-400/20 bg-emerald-400/[0.02] shadow-[0_0_24px_rgba(52,211,153,0.03)]'
        : isUnlocked
          ? 'border-amber-400/20 bg-amber-400/[0.02]'
          : 'border-cream/[0.06] bg-cream/[0.02]'
    }`}>
      {/* Intervention dialog (PCV1-003) */}
      {showIntervention && (
        <ApprovedPlanInterventionDialog
          onUnlock={handleUnlock}
          onCreateChange={handleCreateChange}
          onDismiss={() => setShowIntervention(false)}
        />
      )}

      {/* Approval warning dialog (PCV1-013) */}
      {showApproveWarning && (
        <ApproveWithOpenItemsWarning
          unresolvedCount={unresolvedOpenItems.length}
          onProceed={() => {
            plan.status === 'unlocked' ? reapprovePlan() : approvePlan()
            setShowApproveWarning(false)
          }}
          onDismiss={() => setShowApproveWarning(false)}
        />
      )}

      {/* Unlock reason prompt (Codex audit issue #3) */}
      {showUnlockPrompt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-xl border border-cream/10 bg-[#1a1a1a] p-5 shadow-2xl space-y-3">
            <h3 className="text-sm font-semibold text-cream flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 11V7a5 5 0 019.9-1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Unlock Plan
            </h3>
            <p className="text-xs text-cream/50 leading-relaxed">
              Unlocking lets you edit the plan directly. Add a short note so you remember why you unlocked it.
            </p>
            <div>
              <textarea
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                placeholder="Why are you unlocking? e.g. Contractor revised scope..."
                rows={2}
                className="w-full bg-cream/5 border border-cream/10 rounded-md px-3 py-2 text-xs text-cream/60 placeholder-cream/20 outline-none focus:border-sandstone/30 resize-none"
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button type="button" onClick={() => setShowUnlockPrompt(false)} className="text-xs text-cream/30 hover:text-cream/50 transition-colors px-3 py-1.5">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => { unlockPlan(undefined, unlockReason.trim() || undefined); setShowUnlockPrompt(false) }}
                className="text-xs font-medium text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 transition-colors px-3 py-1.5 rounded-lg"
              >
                Unlock Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header with plan status */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className={`font-semibold ${isApproved ? 'text-base text-cream' : 'text-sm text-cream/80'}`}>Official Plan</h2>
          {isApproved && (
            <svg className="w-4 h-4 text-emerald-400/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Approve / Re-approve button (PCV1-013: checks unresolved items) */}
          {!readOnly && (plan.status === 'working' || plan.status === 'unlocked') && (
            <button
              type="button"
              onClick={() => {
                if (unresolvedOpenItems.length > 0) {
                  setShowApproveWarning(true)
                } else {
                  plan.status === 'unlocked' ? reapprovePlan() : approvePlan()
                }
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 transition-colors"
            >
              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {plan.status === 'unlocked' ? 'Re-approve Plan' : 'Approve Plan'}
            </button>
          )}

          {/* Unlock button (when approved) */}
          {!readOnly && isApproved && (
            <button
              type="button"
              onClick={() => { setUnlockReason(''); setShowUnlockPrompt(true) }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium text-amber-400/70 bg-amber-400/5 hover:bg-amber-400/10 transition-colors"
            >
              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 11V7a5 5 0 019.9-1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Unlock
            </button>
          )}

          {/* Status badge */}
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium ${statusConfig.color} ${statusConfig.bgColor}`}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Approved plan banner */}
      {isApproved && (
        <div className="text-[11px] text-emerald-400/60 bg-emerald-400/5 rounded-lg px-3 py-2 flex items-center gap-2">
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>
            Your plan is approved and locked. If something changes, create a change record below so you have a clear paper trail. You can also unlock the plan if you need to edit it directly.
          </span>
        </div>
      )}

      {/* Unlocked banner */}
      {isUnlocked && (
        <div className="text-[11px] text-amber-400/60 bg-amber-400/5 rounded-lg px-3 py-2 flex items-center gap-2">
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 11V7a5 5 0 019.9-1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Your plan is unlocked so you can make edits. When you&apos;re done, re-approve it to lock things back in place.</span>
        </div>
      )}

      {/* Unresolved open items readiness indicator (PCV1-014) */}
      {unresolvedOpenItems.length > 0 && (
        <div className="text-[11px] text-amber-400/50 bg-amber-400/5 rounded-lg px-3 py-2 flex items-center gap-2">
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" strokeLinecap="round" />
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" />
          </svg>
          <span>
            {unresolvedOpenItems.length} open item{unresolvedOpenItems.length !== 1 ? 's' : ''} still unresolved
            {unresolvedOpenItems.filter((i) => i.status === 'waiting').length > 0 && (
              <span className="text-cream/30">
                {' '}({unresolvedOpenItems.filter((i) => i.status === 'waiting').length} waiting)
              </span>
            )}
          </span>
        </div>
      )}

      {/* Changed-since indicator */}
      {plan.content_changed_since_status && plan.status_changed_at && (
        <div className="text-[10px] text-amber-400/50 flex items-center gap-1.5">
          <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" />
            <line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round" />
          </svg>
          Plan content changed since last marked as {statusConfig.label.toLowerCase()}
        </div>
      )}

      {/* Unincorporated changes banner */}
      {unincorporatedCount > 0 && (
        <div className="text-[10px] text-teal-400/60 bg-teal-400/5 rounded-lg px-3 py-2 flex items-center gap-2">
          <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          {unincorporatedCount} approved change{unincorporatedCount !== 1 ? 's' : ''} not yet added to official plan
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
      <div onClick={isApproved ? handleEditAttempt : undefined}>
        <label className="text-[10px] text-cream/30 uppercase tracking-wider font-medium block mb-1.5">Scope</label>
        <InlineEdit
          value={plan.scope}
          onSave={(text) => updatePlanScope(text)}
          placeholder="What work is being done? Describe the overall project so everyone's on the same page."
          readOnly={readOnly || isApproved}
          multiline
          displayClassName="text-sm text-cream/70 leading-relaxed"
          className="text-sm leading-relaxed"
        />
      </div>

      {/* Structured lists */}
      <div className="space-y-4" onClick={isApproved ? handleEditAttempt : undefined}>
        <div>
          <label className="text-[10px] text-cream/30 uppercase tracking-wider font-medium block mb-1.5">
            What&apos;s Included
          </label>
          <PlanItemList
            items={plan.included}
            onAdd={(text) => addPlanItem('included', text)}
            onUpdate={(id, text) => updatePlanItem(id, { text })}
            onDelete={deletePlanItem}
            readOnly={readOnly || isApproved}
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
            readOnly={readOnly || isApproved}
            emptyMessage="Nothing excluded yet."
            addPlaceholder="Add excluded item..."
          />
        </div>

        <div>
          <label className="text-[10px] text-cream/30 uppercase tracking-wider font-medium block mb-1.5">
            Plan Open Items
          </label>
          <OpenItemsList
            items={plan.open_items}
            onAdd={(text) => addOpenItem(text)}
            onUpdate={(id, updates) => updateOpenItem(id, updates)}
            onResolve={(id, note) => resolveOpenItem(id, note)}
            onDelete={deleteOpenItem}
            readOnly={readOnly || isApproved}
            emptyMessage="No open items — all decisions made."
            addPlaceholder="Add something that needs deciding..."
          />
        </div>
      </div>

      {/* Budget */}
      {!showBudget && !readOnly && !isApproved && (
        <button
          type="button"
          onClick={() => setShowBudget(true)}
          className="text-[11px] text-cream/30 hover:text-cream/50 transition-colors"
        >
          + Add budget details
        </button>
      )}

      {showBudget && (
        <div className="pt-4 border-t border-cream/[0.06]" onClick={isApproved ? handleEditAttempt : undefined}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] text-cream/40 uppercase tracking-wider font-medium">Budget Overview</span>
            {!readOnly && !isApproved && !budget.baseline_amount && !budget.budget_note && approvedChanges.length === 0 && (
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
                readOnly={readOnly || isApproved}
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
              readOnly={readOnly || isApproved}
              displayClassName="text-xs text-cream/50"
              className="text-xs"
            />
          </div>
        </div>
      )}

      {/* Primary CTA when approved — bias toward Create Change (PCV1-053) */}
      {isApproved && !readOnly && onScrollToChanges && (
        <div className="pt-3 border-t border-cream/[0.04]">
          <button
            type="button"
            onClick={onScrollToChanges}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-sandstone bg-sandstone/10 hover:bg-sandstone/20 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Create a Change
          </button>
          <p className="text-[10px] text-cream/25 mt-1">
            Something changed? Log it here so you have a record of what was agreed.
          </p>
        </div>
      )}

      {/* Approval metadata */}
      {plan.approved_at && (
        <div className="text-[10px] text-cream/25 pt-2 border-t border-cream/[0.04]">
          {isApproved ? 'Approved' : 'Last approved'} on {new Date(plan.approved_at).toLocaleDateString()}
          {plan.approved_by && ` by ${plan.approved_by}`}
          {plan.revision_number != null && plan.revision_number > 0 && ` (revision ${plan.revision_number})`}
        </div>
      )}
    </div>
  )
}
