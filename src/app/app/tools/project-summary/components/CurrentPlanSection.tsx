'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { PLAN_STATUS_CONFIG } from '../constants'
import type { ProjectSummaryStateAPI } from '../useProjectSummaryState'
import { InlineEdit } from './InlineEdit'
import { OpenItemsList } from './OpenItemsList'
import { DocumentsSection } from './DocumentsSection'

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
          Unresolved Items
        </h3>
        <p className="text-xs text-cream/50 leading-relaxed">
          This plan has <strong className="text-amber-400">{unresolvedCount} unresolved item{unresolvedCount !== 1 ? 's' : ''}</strong>.
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
    addOpenItem, updateOpenItem, resolveOpenItem, deleteOpenItem,
    updateBudget,
  } = api
  const { plan, budget, changes } = payload

  const [showBudget, setShowBudget] = useState(
    Boolean(budget.baseline_amount || budget.budget_note)
  )
  const [showIncorporated, setShowIncorporated] = useState(false)
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

  // Incorporated changes — shown inline in plan card
  const incorporatedChanges = useMemo(
    () => changes.filter((c) => c.incorporated),
    [changes]
  )

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
    <div className={`rounded-xl border p-4 md:p-5 space-y-3 ${
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

      {/* Unlock reason prompt */}
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

      {/* Header: title + status + actions — compact single line */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-cream/80">Official Plan</h2>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${statusConfig.color} ${statusConfig.bgColor}`}>
            {isApproved && (
              <svg className="w-2.5 h-2.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {statusConfig.label}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
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
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 transition-colors"
            >
              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {plan.status === 'unlocked' ? 'Re-approve' : 'Approve'}
            </button>
          )}

          {!readOnly && isApproved && (
            <button
              type="button"
              onClick={() => { setUnlockReason(''); setShowUnlockPrompt(true) }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium text-amber-400/70 bg-amber-400/5 hover:bg-amber-400/10 transition-colors"
            >
              Unlock
            </button>
          )}

          {isApproved && !readOnly && onScrollToChanges && (
            <button
              type="button"
              onClick={onScrollToChanges}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium text-sandstone/70 bg-sandstone/10 hover:bg-sandstone/20 transition-colors"
            >
              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              New Change
            </button>
          )}
        </div>
      </div>

      {/* Compact status line — replaces separate banners */}
      {(isApproved || isUnlocked || unresolvedOpenItems.length > 0 || unincorporatedCount > 0 || (plan.content_changed_since_status && plan.status_changed_at)) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px]">
          {isApproved && (
            <span className="text-emerald-400/50">Locked — create a change to modify</span>
          )}
          {isUnlocked && (
            <span className="text-amber-400/50">Unlocked for editing — re-approve when done</span>
          )}
          {unresolvedOpenItems.length > 0 && (
            <span className="text-amber-400/50">
              {unresolvedOpenItems.length} unresolved item{unresolvedOpenItems.length !== 1 ? 's' : ''}
              {unresolvedOpenItems.filter((i) => i.status === 'waiting').length > 0 && (
                <span className="text-cream/25"> ({unresolvedOpenItems.filter((i) => i.status === 'waiting').length} waiting)</span>
              )}
            </span>
          )}
          {unincorporatedCount > 0 && (
            <span className="text-teal-400/50">
              {unincorporatedCount} change{unincorporatedCount !== 1 ? 's' : ''} not yet incorporated
              {onScrollToChanges && (
                <button type="button" onClick={onScrollToChanges} className="ml-1 text-teal-400/70 hover:text-teal-400 underline">view</button>
              )}
            </span>
          )}
          {plan.content_changed_since_status && plan.status_changed_at && (
            <span className="text-amber-400/40">Content changed since {statusConfig.label.toLowerCase()}</span>
          )}
        </div>
      )}

      {/* 1. Scope */}
      <div onClick={isApproved ? handleEditAttempt : undefined}>
        <label className="text-[10px] text-cream/30 uppercase tracking-wider font-medium block mb-1">Scope</label>
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

      {/* 2. Documents & Files */}
      <DocumentsSection api={api} inline planApprovedAt={plan.approved_at} />

      {/* 3. Unresolved Items */}
      <div onClick={isApproved ? handleEditAttempt : undefined}>
        <label className="text-[10px] text-cream/30 uppercase tracking-wider font-medium block mb-1">
          Unresolved Items
        </label>
        <OpenItemsList
          items={plan.open_items}
          onAdd={(text) => addOpenItem(text)}
          onUpdate={(id, updates) => updateOpenItem(id, updates)}
          onResolve={(id, note) => resolveOpenItem(id, note)}
          onDelete={deleteOpenItem}
          readOnly={readOnly || isApproved}
          emptyMessage="No unresolved items — all decisions made."
          addPlaceholder="Add something that needs deciding..."
        />
      </div>

      {/* 4. Budget — compact inline */}
      {!showBudget && !readOnly && !isApproved && (
        <button
          type="button"
          onClick={() => setShowBudget(true)}
          className="text-[10px] text-cream/25 hover:text-cream/40 transition-colors"
        >
          + Add budget details
        </button>
      )}

      {showBudget && (
        <div className="pt-3 border-t border-cream/[0.04]" onClick={isApproved ? handleEditAttempt : undefined}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-cream/30 uppercase tracking-wider font-medium">Budget</span>
            {!readOnly && !isApproved && !budget.baseline_amount && !budget.budget_note && approvedChanges.length === 0 && (
              <button type="button" onClick={() => setShowBudget(false)} className="text-[10px] text-cream/20 hover:text-cream/40 transition-colors">Hide</button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-cream/25 block mb-0.5">Baseline</label>
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
              <label className="text-[10px] text-cream/25 block mb-0.5">Changes</label>
              <div className="flex items-baseline gap-1.5">
                {approvedChanges.length > 0 ? (
                  <span className="text-sm text-emerald-400/70">
                    {approvedChanges.length} approved
                    {approvedCostSum !== null && (
                      <span className="text-cream/40 ml-1">({approvedCostSum >= 0 ? '+' : ''}${Math.abs(approvedCostSum).toLocaleString()})</span>
                    )}
                  </span>
                ) : (
                  <span className="text-sm text-cream/30">None</span>
                )}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-cream/25 block mb-0.5">Total</label>
              {computedTotal !== null ? (
                <span className="text-sm text-cream/70 font-medium">
                  ${computedTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              ) : (
                <span className="text-sm text-cream/25 italic">
                  {budget.baseline_amount ? 'Enter amounts' : 'Set baseline'}
                </span>
              )}
            </div>
          </div>
          {(budget.budget_note || (!readOnly && !isApproved)) && (
            <div className="mt-2">
              <InlineEdit
                value={budget.budget_note || ''}
                onSave={(v) => updateBudget({ budget_note: v || undefined })}
                placeholder="Budget notes..."
                readOnly={readOnly || isApproved}
                displayClassName="text-xs text-cream/40"
                className="text-xs"
              />
            </div>
          )}
        </div>
      )}

      {/* Legacy: included / not-included (read-only, shown only when data exists) */}
      {(plan.included.length > 0 || plan.not_included.length > 0) && (
        <details className="pt-3 border-t border-cream/[0.04]">
          <summary className="text-[10px] text-cream/25 cursor-pointer hover:text-cream/40 transition-colors select-none">
            Legacy Plan Details ({plan.included.length + plan.not_included.length} items)
          </summary>
          <div className="mt-2 space-y-2">
            {plan.included.length > 0 && (
              <div>
                <span className="text-[10px] text-cream/30 uppercase tracking-wider font-medium block mb-1">What&apos;s Included</span>
                <ul className="space-y-0.5">
                  {plan.included.map((item) => (
                    <li key={item.id} className="text-xs text-cream/40 pl-2 border-l border-cream/10">{item.text}</li>
                  ))}
                </ul>
              </div>
            )}
            {plan.not_included.length > 0 && (
              <div>
                <span className="text-[10px] text-cream/30 uppercase tracking-wider font-medium block mb-1">Not Included</span>
                <ul className="space-y-0.5">
                  {plan.not_included.map((item) => (
                    <li key={item.id} className="text-xs text-cream/40 pl-2 border-l border-cream/10">{item.text}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </details>
      )}

      {/* 5. Incorporated Changes — collapsed by default */}
      {incorporatedChanges.length > 0 && (
        <div className="pt-3 border-t border-cream/[0.04]">
          <button
            type="button"
            onClick={() => setShowIncorporated(!showIncorporated)}
            className="flex items-center gap-2 w-full text-left"
          >
            <svg
              className={`w-3 h-3 text-cream/20 transition-transform ${showIncorporated ? 'rotate-90' : ''}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <polyline points="9 18 15 12 9 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[10px] text-cream/30 uppercase tracking-wider font-medium">
              Incorporated Changes
            </span>
            <span className="text-[10px] text-cream/20">{incorporatedChanges.length}</span>
          </button>

          {showIncorporated && (
            <div className="mt-2 space-y-1.5">
              {incorporatedChanges.map((c) => (
                <div key={c.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-teal-400/[0.03] border border-teal-400/[0.06]">
                  <svg className="w-3 h-3 text-teal-400/40 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-xs text-cream/60 flex-1 truncate">{c.title}</span>
                  {c.cost_impact && (
                    <span className="text-[10px] text-cream/30 shrink-0">{c.cost_impact}</span>
                  )}
                  {c.incorporated_at && (
                    <span className="text-[10px] text-cream/20 shrink-0 hidden md:inline">
                      {new Date(c.incorporated_at).toLocaleDateString()}
                    </span>
                  )}
                  {api.collectionId && (
                    <Link
                      href={`/app/tools/project-summary/${api.collectionId}/change/${c.id}`}
                      className="text-[10px] text-sandstone/30 hover:text-sandstone transition-colors shrink-0"
                    >
                      View
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Approval metadata */}
      {plan.approved_at && (
        <div className="text-[10px] text-cream/20 pt-2 border-t border-cream/[0.04]">
          {isApproved ? 'Approved' : 'Last approved'} {new Date(plan.approved_at).toLocaleDateString()}
          {plan.approved_by && ` by ${plan.approved_by}`}
          {plan.revision_number != null && plan.revision_number > 0 && ` (rev ${plan.revision_number})`}
        </div>
      )}
    </div>
  )
}
