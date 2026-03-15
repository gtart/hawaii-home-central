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

/** Unlock reason prompt — shown when user wants to correct the plan */
function UnlockPrompt({
  onUnlock,
  onDismiss,
}: {
  onUnlock: (reason?: string) => void
  onDismiss: () => void
}) {
  const [reason, setReason] = useState('')

  const dialogContent = (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-cream flex items-center gap-2">
        <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 11V7a5 5 0 019.9-1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Unlock Plan to Make Corrections
      </h3>
      <p className="text-xs text-cream/65 leading-relaxed">
        Unlocking lets you edit the plan directly. When you&apos;re done, re-lock it to keep it as your source of truth.
      </p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="What needs correcting? e.g. Updated scope after site visit..."
        rows={2}
        className="w-full bg-stone-200 border border-cream/15 rounded-md px-3 py-2 text-xs text-cream/70 placeholder-cream/35 outline-none focus:border-sandstone/30 resize-none"
        autoFocus
      />
      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onDismiss} className="text-xs text-cream/45 hover:text-cream/65 transition-colors px-3 py-1.5">
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onUnlock(reason.trim() || undefined)}
          className="text-xs font-medium text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 transition-colors px-3 py-1.5 rounded-lg"
        >
          Unlock Plan
        </button>
      </div>
    </div>
  )

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/50" onClick={onDismiss} />
      <div className="hidden md:flex fixed inset-0 z-[61] items-center justify-center px-4 pointer-events-none">
        <div className="w-full max-w-sm rounded-xl border border-cream/15 bg-basalt p-5 shadow-2xl pointer-events-auto">
          {dialogContent}
        </div>
      </div>
      <div className="md:hidden fixed inset-x-0 bottom-0 z-[61] bg-basalt border-t border-cream/14 rounded-t-2xl shadow-2xl">
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-cream/30" />
        </div>
        <div className="p-5 pb-8">
          {dialogContent}
        </div>
      </div>
    </>
  )
}

/** Edit intervention dialog — shown when user tries to edit an approved/locked plan */
function LockedPlanInterventionDialog({
  onUnlock,
  onAddChange,
  onDismiss,
}: {
  onUnlock: () => void
  onAddChange: () => void
  onDismiss: () => void
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-xl border border-cream/15 bg-basalt p-6 shadow-2xl space-y-4">
        <h3 className="text-base font-semibold text-cream">This plan is locked</h3>
        <p className="text-sm text-cream/70 leading-relaxed">
          Your plan is locked to protect the agreed-upon scope. You can either correct the plan directly or add a formal change order.
        </p>
        <div className="space-y-2">
          <button
            type="button"
            onClick={onUnlock}
            className="w-full text-left px-4 py-3 rounded-lg border border-amber-400/20 bg-amber-400/8 hover:bg-amber-400/12 transition-colors"
          >
            <div className="text-sm font-medium text-amber-400">Unlock &amp; Correct Plan</div>
            <div className="text-xs text-cream/55 mt-0.5">
              Fix a typo, update scope details, or make a correction. Re-lock when done.
            </div>
          </button>
          <button
            type="button"
            onClick={onAddChange}
            className="w-full text-left px-4 py-3 rounded-lg border border-emerald-400/20 bg-emerald-400/8 hover:bg-emerald-400/12 transition-colors"
          >
            <div className="text-sm font-medium text-emerald-400">Add a Change Order</div>
            <div className="text-xs text-cream/55 mt-0.5">
              Log a formal amendment — new work, different materials, added or removed scope.
            </div>
          </button>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="w-full text-center text-xs text-cream/45 hover:text-cream/65 transition-colors py-1"
        >
          Cancel
        </button>
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

  const isLocked = plan.status === 'approved'
  const isUnlocked = plan.status === 'unlocked'

  // Budget: accepted changes with parseable costs
  const acceptedStatuses = new Set(['approved_by_homeowner', 'accepted_by_contractor', 'done'])
  const approvedChanges = useMemo(
    () => changes.filter((c) => acceptedStatuses.has(c.status)),
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

  // Pending cost impact — from requested / awaiting_homeowner changes
  const pendingCostSum = useMemo(() => {
    const pendingStatuses = new Set(['requested', 'awaiting_homeowner'])
    const pending = changes.filter((c) => pendingStatuses.has(c.status))
    let sum = 0
    let hasParseable = false
    for (const c of pending) {
      if (c.cost_impact) {
        const num = parseFloat(c.cost_impact.replace(/[^0-9.\-+]/g, ''))
        if (!isNaN(num)) {
          sum += num
          hasParseable = true
        }
      }
    }
    return hasParseable ? sum : null
  }, [changes])

  // Incorporated changes — shown inline in plan
  const incorporatedChanges = useMemo(
    () => changes.filter((c) => c.incorporated),
    [changes]
  )

  // Pending changes count
  const pendingChangeCount = useMemo(
    () => changes.filter((c) =>
      (c.status === 'requested' || c.status === 'awaiting_homeowner') && !c.incorporated
    ).length,
    [changes]
  )

  // Open items
  const unresolvedOpenItems = useMemo(
    () => plan.open_items.filter((i) => i.status === 'open' || i.status === 'waiting'),
    [plan.open_items]
  )

  const statusConfig = PLAN_STATUS_CONFIG[plan.status]

  // Intercept edit attempts on locked plan
  const handleEditAttempt = useCallback(() => {
    if (isLocked && !readOnly) {
      setShowIntervention(true)
    }
  }, [isLocked, readOnly])

  const handleUnlock = useCallback(() => {
    setShowIntervention(false)
    setShowUnlockPrompt(true)
  }, [])

  const handleAddChange = useCallback(() => {
    setShowIntervention(false)
    onScrollToChanges?.()
  }, [onScrollToChanges])

  return (
    <div className="space-y-6">
      {/* Intervention dialog */}
      {showIntervention && (
        <LockedPlanInterventionDialog
          onUnlock={handleUnlock}
          onAddChange={handleAddChange}
          onDismiss={() => setShowIntervention(false)}
        />
      )}

      {/* Unlock prompt */}
      {showUnlockPrompt && (
        <UnlockPrompt
          onUnlock={(reason) => { unlockPlan(undefined, reason); setShowUnlockPrompt(false) }}
          onDismiss={() => setShowUnlockPrompt(false)}
        />
      )}

      {/* Plan header bar — status + primary actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium ${statusConfig.color} ${statusConfig.bgColor}`}>
            {isLocked && (
              <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {isUnlocked && (
              <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 11V7a5 5 0 019.9-1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {isLocked ? 'Locked' : isUnlocked ? 'Unlocked' : statusConfig.label}
          </span>
          {plan.approved_at && (
            <span className="text-[11px] text-cream/45">
              {isLocked ? 'Approved' : 'Last approved'} {new Date(plan.approved_at).toLocaleDateString()}
            </span>
          )}
          {pendingChangeCount > 0 && (
            <span className="text-[11px] text-cream/50">
              {pendingChangeCount} change{pendingChangeCount !== 1 ? 's' : ''} under review
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Approve / Lock */}
          {!readOnly && plan.status === 'working' && (
            <button
              type="button"
              onClick={() => approvePlan()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-cream/90 bg-cream/15 hover:bg-cream/20 border border-cream/15 hover:border-cream/35 transition-colors"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Lock Plan
            </button>
          )}

          {/* Unlock (when locked) */}
          {!readOnly && isLocked && (
            <button
              type="button"
              onClick={() => setShowUnlockPrompt(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-400/80 hover:text-amber-400 bg-amber-400/8 hover:bg-amber-400/15 transition-colors"
            >
              Unlock Plan
            </button>
          )}

          {/* Re-lock (when unlocked) */}
          {!readOnly && isUnlocked && (
            <button
              type="button"
              onClick={() => reapprovePlan()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-cream/90 bg-cream/15 hover:bg-cream/20 border border-cream/15 hover:border-cream/35 transition-colors"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Re-lock Plan
            </button>
          )}

          {/* Add Change Order — always visible when plan exists */}
          {!readOnly && onScrollToChanges && (
            <button
              type="button"
              onClick={onScrollToChanges}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-sandstone/80 hover:text-sandstone bg-sandstone/10 hover:bg-sandstone/15 transition-colors"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              Add Change Order
            </button>
          )}
        </div>
      </div>

      {/* Unlocked banner */}
      {isUnlocked && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-400/[0.06] border border-amber-400/15 text-xs text-amber-400/70">
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 11V7a5 5 0 019.9-1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Plan is unlocked for corrections. Re-lock when done to keep it as your source of truth.
        </div>
      )}

      {/* Draft guidance — teach the workflow when plan is empty */}
      {plan.status === 'working' && !plan.scope && payload.documents.length === 0 && !readOnly && (
        <div className="rounded-lg bg-stone-50 border border-cream/10 px-4 py-3">
          <p className="text-xs text-cream/65 leading-relaxed mb-2">
            Start building your plan. When everything looks right, lock it to keep it as your source of truth.
          </p>
          <ol className="text-[11px] text-cream/60 space-y-1 list-decimal list-inside">
            <li>Describe the scope of work</li>
            <li>Add files (contracts, specs, photos)</li>
            <li>Set a budget if you have one</li>
            <li>Lock the plan when ready</li>
          </ol>
          <p className="text-[10px] text-cream/50 mt-2">
            After locking, corrections are handled by unlocking, and new scope changes are tracked as change orders below.
          </p>
        </div>
      )}

      {/* 1. Scope — the main plan content */}
      <div onClick={isLocked ? handleEditAttempt : undefined}>
        <label className="text-[10px] text-cream/55 uppercase tracking-wider font-medium block mb-1.5">Scope</label>
        <InlineEdit
          value={plan.scope}
          onSave={(text) => updatePlanScope(text)}
          placeholder="What work is being done? Describe the overall project so everyone's on the same page."
          readOnly={readOnly || isLocked}
          multiline
          displayClassName="text-sm text-cream/80 leading-relaxed"
          className="text-sm leading-relaxed"
        />
      </div>

      {/* 2. Documents & Files */}
      <DocumentsSection api={api} />

      {/* 3. Budget — compact inline */}
      {!showBudget && !readOnly && !isLocked && (
        <button
          type="button"
          onClick={() => setShowBudget(true)}
          className="text-[10px] text-cream/50 hover:text-cream/65 transition-colors"
        >
          + Add budget details
        </button>
      )}

      {showBudget && (
        <div className="pt-4 border-t border-cream/10" onClick={isLocked ? handleEditAttempt : undefined}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-cream/55 uppercase tracking-wider font-medium">Budget</span>
            {!readOnly && !isLocked && !budget.baseline_amount && !budget.budget_note && approvedChanges.length === 0 && (
              <button type="button" onClick={() => setShowBudget(false)} className="text-[10px] text-cream/45 hover:text-cream/65 transition-colors">Hide</button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-cream/40 block mb-0.5">Baseline Budget</label>
              <InlineEdit
                value={budget.baseline_amount || ''}
                onSave={(v) => updateBudget({ baseline_amount: v ? formatCost(v) : undefined })}
                placeholder="e.g. $85,000"
                readOnly={readOnly || isLocked}
                displayClassName="text-sm text-cream/80"
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] text-cream/40 block mb-0.5">Accepted Changes</label>
              <div className="flex items-baseline gap-1.5">
                {approvedChanges.length > 0 ? (
                  <span className="text-sm text-cream/70">
                    {approvedCostSum !== null ? (
                      <>{approvedCostSum >= 0 ? '+' : ''}${Math.abs(approvedCostSum).toLocaleString()}</>
                    ) : (
                      <>{approvedChanges.length} accepted</>
                    )}
                  </span>
                ) : (
                  <span className="text-sm text-cream/45">—</span>
                )}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-cream/40 block mb-0.5">Current Total</label>
              {computedTotal !== null ? (
                <span className="text-sm text-cream/80 font-medium">
                  ${computedTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              ) : (
                <span className="text-sm text-cream/50 italic">
                  {budget.baseline_amount ? 'Enter change amounts' : 'Set baseline first'}
                </span>
              )}
            </div>
          </div>
          {/* Pending Impact */}
          {pendingCostSum !== null && pendingChangeCount > 0 && (
            <div className="mt-2 flex items-center gap-2 text-[11px]">
              <span className="text-amber-400/50">Pending impact:</span>
              <span className="text-amber-400/70 font-medium">
                {pendingCostSum >= 0 ? '+' : ''}${Math.abs(pendingCostSum).toLocaleString()}
              </span>
              <span className="text-cream/40">
                from {pendingChangeCount} pending change{pendingChangeCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {(budget.budget_note || (!readOnly && !isLocked)) && (
            <div className="mt-2">
              <InlineEdit
                value={budget.budget_note || ''}
                onSave={(v) => updateBudget({ budget_note: v || undefined })}
                placeholder="Budget notes..."
                readOnly={readOnly || isLocked}
                displayClassName="text-xs text-cream/55"
                className="text-xs"
              />
            </div>
          )}
        </div>
      )}

      {/* Open items — de-emphasized, collapsed when empty */}
      {(unresolvedOpenItems.length > 0 || (!readOnly && !isLocked)) && (
        <details className="pt-4 border-t border-cream/10" open={unresolvedOpenItems.length > 0}>
          <summary className="text-[10px] text-cream/45 uppercase tracking-wider font-medium cursor-pointer hover:text-cream/55 transition-colors select-none">
            Open Questions
            {unresolvedOpenItems.length > 0 && (
              <span className="ml-1.5 text-amber-400/50">({unresolvedOpenItems.length})</span>
            )}
          </summary>
          <div className="mt-2" onClick={isLocked ? handleEditAttempt : undefined}>
            <OpenItemsList
              items={plan.open_items}
              onAdd={(text) => addOpenItem(text)}
              onUpdate={(id, updates) => updateOpenItem(id, updates)}
              onResolve={(id, note) => resolveOpenItem(id, note)}
              onDelete={deleteOpenItem}
              readOnly={readOnly || isLocked}
              emptyMessage="No open questions."
              addPlaceholder="Add a question or unresolved item..."
            />
          </div>
        </details>
      )}

      {/* Legacy: included / not-included (read-only, shown only when data exists) */}
      {(plan.included.length > 0 || plan.not_included.length > 0) && (
        <details className="pt-3 border-t border-cream/10">
          <summary className="text-[10px] text-cream/50 cursor-pointer hover:text-cream/65 transition-colors select-none">
            Legacy Plan Details ({plan.included.length + plan.not_included.length} items)
          </summary>
          <div className="mt-2 space-y-2">
            {plan.included.length > 0 && (
              <div>
                <span className="text-[10px] text-cream/55 uppercase tracking-wider font-medium block mb-1">What&apos;s Included</span>
                <ul className="space-y-0.5">
                  {plan.included.map((item) => (
                    <li key={item.id} className="text-xs text-cream/55 pl-2 border-l border-cream/15">{item.text}</li>
                  ))}
                </ul>
              </div>
            )}
            {plan.not_included.length > 0 && (
              <div>
                <span className="text-[10px] text-cream/55 uppercase tracking-wider font-medium block mb-1">Not Included</span>
                <ul className="space-y-0.5">
                  {plan.not_included.map((item) => (
                    <li key={item.id} className="text-xs text-cream/55 pl-2 border-l border-cream/15">{item.text}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </details>
      )}

      {/* Incorporated Changes — collapsed by default */}
      {incorporatedChanges.length > 0 && (
        <div className="pt-3 border-t border-cream/10">
          <button
            type="button"
            onClick={() => setShowIncorporated(!showIncorporated)}
            className="flex items-center gap-2 w-full text-left"
          >
            <svg
              className={`w-3 h-3 text-cream/45 transition-transform ${showIncorporated ? 'rotate-90' : ''}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <polyline points="9 18 15 12 9 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[10px] text-cream/45 uppercase tracking-wider font-medium">
              Added to Plan
            </span>
            <span className="text-[10px] text-cream/45">{incorporatedChanges.length}</span>
          </button>

          {showIncorporated && (
            <div className="mt-2 space-y-1.5">
              {incorporatedChanges.map((c) => (
                <div key={c.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-teal-400/[0.03] border border-teal-400/[0.06]">
                  <svg className="w-3 h-3 text-teal-400/40 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-xs text-cream/70 flex-1 truncate">{c.title}</span>
                  {c.cost_impact && (
                    <span className="text-[10px] text-cream/45 shrink-0">{c.cost_impact}</span>
                  )}
                  {c.incorporated_at && (
                    <span className="text-[10px] text-cream/45 shrink-0 hidden md:inline">
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
    </div>
  )
}
