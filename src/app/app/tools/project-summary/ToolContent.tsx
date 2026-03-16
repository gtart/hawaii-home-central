'use client'

import { Suspense, useState, useMemo, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ToolPageHeader } from '@/components/app/ToolPageHeader'
import { InstanceSwitcher } from '@/components/app/InstanceSwitcher'
import { CollapsibleCommentSidebar, type CommentSidebarHandle } from '@/components/app/CollapsibleCommentSidebar'
import type { RefEntity } from '@/components/app/CommentThread'
import { useComments } from '@/hooks/useComments'
import { useProjectSummaryState } from './useProjectSummaryState'
import { DocumentsSection } from './components/DocumentsSection'
import { ChangesSection } from './components/ChangesSection'
import { MilestoneTimeline } from './components/MilestoneTimeline'
import { InlineEdit } from './components/InlineEdit'

/** Parsed focus target from URL query param ?focus=change-<id> */
export interface FocusTarget {
  section: 'changes'
  entryId: string
}

const ADDED_STATUSES = new Set(['approved_by_homeowner', 'accepted_by_contractor', 'done'])

function ProjectSummaryContent({ collectionId }: { collectionId: string }) {
  const api = useProjectSummaryState({ collectionId })
  const { payload, isLoaded, isSyncing, access, readOnly, noAccess, title: collectionTitle } = api
  const router = useRouter()
  const [titleOverride, setTitleOverride] = useState<string | null>(null)
  const commentSidebarRef = useRef<CommentSidebarHandle>(null)
  const changesSectionRef = useRef<{ scrollToAndAdd: () => void; scrollToChange: (id: string) => void }>(null)
  const searchParams = useSearchParams()

  const handleRename = useCallback(async (newTitle: string) => {
    setTitleOverride(newTitle)
    try {
      await fetch(`/api/collections/${collectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      })
    } catch {
      setTitleOverride(null)
    }
  }, [collectionId])

  const handleArchive = useCallback(async () => {
    try {
      const res = await fetch(`/api/collections/${collectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archivedAt: true }),
      })
      if (res.ok) router.push('/app/tools/project-summary')
    } catch {
      // ignore
    }
  }, [collectionId, router])

  // Focus target from URL query param
  const focusTarget = useMemo<FocusTarget | null>(() => {
    const raw = searchParams.get('focus')
    if (!raw) return null
    const dashIdx = raw.indexOf('-')
    if (dashIdx === -1) return null
    const type = raw.slice(0, dashIdx)
    const id = raw.slice(dashIdx + 1)
    if (!id) return null
    if (type === 'change') return { section: 'changes', entryId: id }
    return null
  }, [searchParams])

  const collComments = useComments({
    collectionId,
    targetType: 'collection',
    targetId: collectionId,
  })

  const commentRefEntities: RefEntity[] = useMemo(() => [
    ...payload.changes.map((c) => ({ id: c.id, label: `Change: ${c.title}` })),
  ], [payload.changes])

  const commentCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const c of collComments.comments) {
      if (c.refEntityId) {
        counts.set(c.refEntityId, (counts.get(c.refEntityId) || 0) + 1)
      }
    }
    return counts
  }, [collComments.comments])

  const handleOpenComments = useCallback(() => {
    commentSidebarRef.current?.toggle()
  }, [])

  const CONFIRMED_STATUSES = new Set(['approved_by_homeowner', 'accepted_by_contractor', 'done'])
  const PENDING_STATUSES_SET = new Set(['requested', 'awaiting_homeowner'])

  const confirmedChanges = useMemo(
    () => payload.changes
      .filter((c) => CONFIRMED_STATUSES.has(c.status))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [payload.changes]
  )

  // Compute budget totals: baseline + confirmed + pending change costs

  const budgetSummary = useMemo(() => {
    // Parse a dollar string like "$85,000", "+$2,500", "-$1,000", "2500" into a number
    function parseDollars(s?: string): number | null {
      if (!s) return null
      const cleaned = s.replace(/[,$\s]/g, '')
      const match = cleaned.match(/^([+-]?)(\d+\.?\d*)/)
      if (!match) return null
      const val = parseFloat(match[2])
      return match[1] === '-' ? -val : val
    }

    const baseline = parseDollars(payload.budget.baseline_amount)

    let confirmedTotal = 0
    let hasConfirmed = false
    let pendingTotal = 0
    let hasPending = false

    for (const c of payload.changes) {
      const amt = parseDollars(c.cost_impact)
      if (amt === null) continue
      if (CONFIRMED_STATUSES.has(c.status)) {
        confirmedTotal += amt
        hasConfirmed = true
      } else if (PENDING_STATUSES_SET.has(c.status)) {
        pendingTotal += amt
        hasPending = true
      }
    }

    const changeCostsTotal = confirmedTotal + pendingTotal
    const hasChangeCosts = hasConfirmed || hasPending
    const total = baseline !== null ? baseline + changeCostsTotal : hasChangeCosts ? changeCostsTotal : null

    function fmt(n: number): string {
      const abs = Math.abs(n)
      const formatted = abs >= 1000 ? abs.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : abs.toString()
      return n < 0 ? `-$${formatted}` : `$${formatted}`
    }

    function fmtSigned(n: number): string {
      return n >= 0 ? `+${fmt(n)}` : fmt(n)
    }

    return {
      baseline,
      confirmedTotal,
      hasConfirmed,
      pendingTotal,
      hasPending,
      changeCostsTotal,
      hasChangeCosts,
      total,
      baselineFormatted: baseline !== null ? fmt(baseline) : null,
      confirmedFormatted: hasConfirmed ? fmtSigned(confirmedTotal) : null,
      pendingFormatted: hasPending ? fmtSigned(pendingTotal) : null,
      changeCostsFormatted: hasChangeCosts ? fmtSigned(changeCostsTotal) : null,
      totalFormatted: total !== null ? fmt(total) : null,
    }
  }, [payload.budget.baseline_amount, payload.changes])

  // Compute estimated end date from accepted changes' schedule_impact
  const estimatedEndDate = useMemo(() => {
    const acceptedChanges = payload.changes.filter((c) => ADDED_STATUSES.has(c.status))
    // Look for the latest schedule impact that looks like a date or "+X weeks/months"
    let latestWeeks = 0
    for (const c of acceptedChanges) {
      if (!c.schedule_impact) continue
      const weeksMatch = c.schedule_impact.match(/\+?\s*(\d+)\s*week/i)
      const monthsMatch = c.schedule_impact.match(/\+?\s*(\d+)\s*month/i)
      if (weeksMatch) latestWeeks = Math.max(latestWeeks, parseInt(weeksMatch[1]))
      if (monthsMatch) latestWeeks = Math.max(latestWeeks, parseInt(monthsMatch[1]) * 4)
    }
    return latestWeeks > 0 ? `+${latestWeeks} week${latestWeeks !== 1 ? 's' : ''}` : null
  }, [payload.changes])

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-sandstone/30 border-t-sandstone rounded-full animate-spin" />
      </div>
    )
  }

  if (noAccess) {
    return (
      <div className="text-center py-24">
        <h2 className="font-serif text-2xl text-cream mb-2">No Access</h2>
        <p className="text-cream/65 text-sm">
          You don&apos;t have access to this change log.
        </p>
      </div>
    )
  }

  return (
    <>
      <ToolPageHeader
        toolKey="project_summary"
        title="Change Log"
        description="Keep a simple record of what changed, which files you're working from, and what still needs confirmation."
        accessLevel={access}
        hasContent={payload.plan.scope.length > 0 || payload.documents.length > 0 || payload.changes.length > 0}
        collectionId={collectionId}
        collectionName={titleOverride ?? collectionTitle ?? undefined}
        eyebrowLabel="Change Log"
        toolLabel="Change Log"
        backHref="/app/tools/project-summary"
        backLabel="All Logs"
        onRename={readOnly ? undefined : handleRename}
        onArchive={readOnly ? undefined : handleArchive}
        actions={(
          <div className="flex items-center gap-1.5">
            <InstanceSwitcher
              toolKey="project_summary"
              currentCollectionId={collectionId}
              itemNoun="log"
            />
            {/* Discussion toggle — icon-only on mobile */}
            <button
              type="button"
              onClick={handleOpenComments}
              className="inline-flex items-center gap-1.5 p-2 md:px-3 md:py-1.5 rounded-lg text-xs text-cream/45 hover:text-cream/65 hover:bg-stone-hover transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="hidden md:inline">Discussion</span>
              {collComments.comments.length > 0 && (
                <span className="bg-cream/10 text-cream/45 text-[10px] font-medium px-1.5 py-0.5 rounded-full tabular-nums">
                  {collComments.comments.length}
                </span>
              )}
            </button>
          </div>
        )}
      />

      {isSyncing && (
        <div className="flex items-center gap-2 text-xs text-cream/45 mb-4">
          <div className="w-3 h-3 border border-cream/35 border-t-cream/65 rounded-full animate-spin" />
          Saving...
        </div>
      )}

      <div className="md:flex md:gap-6 md:items-start">
        <div className="flex-1 min-w-0 space-y-10">
          {/* ═══ THE PLAN — bordered visual group ═══ */}
          <div className="rounded-xl border border-cream/10 bg-stone-50/30 p-5 md:p-6 space-y-8">
            {/* Scope of Work */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-cream/65 uppercase tracking-wider">Scope of Work</label>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => changesSectionRef.current?.scrollToAndAdd()}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-sandstone/70 hover:text-sandstone bg-sandstone/8 hover:bg-sandstone/12 transition-colors"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                    </svg>
                    Add a change
                  </button>
                )}
              </div>
              <InlineEdit
                value={payload.plan.scope}
                onSave={(text) => api.updatePlanScope(text)}
                placeholder="What are you renovating? e.g. 'Full kitchen and master bath remodel'"
                readOnly={readOnly}
                multiline
                displayClassName="text-sm text-cream/80 leading-relaxed"
                className="text-sm leading-relaxed"
              />
              {payload.plan.updated_at && (
                <p className="text-[10px] text-cream/40 mt-1.5">
                  Last modified {new Date(payload.plan.updated_at).toLocaleDateString()}
                  {payload.plan.updated_by && ` by ${payload.plan.updated_by}`}
                </p>
              )}

              {/* ── Confirmed amendments — inline under scope ── */}
              {confirmedChanges.length > 0 && (
                <div className="mt-4 border-t border-cream/8 pt-3 space-y-3">
                  {confirmedChanges.map((change) => (
                    <div key={change.id} className="group">
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-400/60 text-xs font-medium shrink-0 mt-0.5">Added to Plan:</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-cream/85 font-medium">{change.title}</span>
                          {change.description && (
                            <p className="text-sm text-cream/65 leading-relaxed mt-0.5">{change.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            {change.cost_impact && (
                              <span className="text-[11px] text-cream/50 tabular-nums">{change.cost_impact}</span>
                            )}
                            {change.schedule_impact && (
                              <span className="text-[11px] text-cream/50">Est. {change.schedule_impact}</span>
                            )}
                            <span className="text-[10px] text-cream/35 tabular-nums">
                              {new Date(change.updated_at || change.created_at).toLocaleDateString()}
                              {(change.updated_by || change.created_by) && ` · ${change.updated_by || change.created_by}`}
                            </span>
                            <button
                              type="button"
                              onClick={() => changesSectionRef.current?.scrollToChange(change.id)}
                              className="text-[10px] text-sandstone/50 hover:text-sandstone transition-colors md:opacity-0 md:group-hover:opacity-100"
                            >
                              View details →
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Budget + Estimated End Date */}
            <div className="flex flex-wrap gap-6">
              <div className="flex-1 min-w-[160px]">
                <label className="text-[10px] text-cream/50 uppercase tracking-wider block mb-1">Budget</label>
                {budgetSummary.totalFormatted ? (
                  <span className="text-sm text-cream/85 tabular-nums font-medium block">{budgetSummary.totalFormatted}</span>
                ) : (
                  <InlineEdit
                    value={payload.budget.baseline_amount || ''}
                    onSave={(v) => api.updateBudget({ baseline_amount: v || undefined })}
                    placeholder="e.g. $85,000"
                    readOnly={readOnly}
                    displayClassName="text-sm text-cream/70 tabular-nums"
                    className="text-sm"
                  />
                )}
                {budgetSummary.totalFormatted && (
                  <div className="mt-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-cream/45">Base:</span>
                      <InlineEdit
                        value={payload.budget.baseline_amount || ''}
                        onSave={(v) => api.updateBudget({ baseline_amount: v || undefined })}
                        placeholder="e.g. $85,000"
                        readOnly={readOnly}
                        displayClassName="text-[10px] text-cream/60 tabular-nums"
                        className="text-[10px]"
                      />
                    </div>
                    {budgetSummary.hasConfirmed && (
                      <span className="text-[10px] text-cream/45 block">
                        Confirmed: <span className={`tabular-nums ${budgetSummary.confirmedTotal > 0 ? 'text-amber-400/70' : 'text-emerald-400/70'}`}>{budgetSummary.confirmedFormatted}</span>
                      </span>
                    )}
                    {budgetSummary.hasPending && (
                      <span className="text-[10px] text-cream/45 block">
                        Pending: <span className="tabular-nums text-cream/50">{budgetSummary.pendingFormatted}</span>
                      </span>
                    )}
                  </div>
                )}
                {(payload.budget.budget_note || !readOnly) && (
                  <InlineEdit
                    value={payload.budget.budget_note || ''}
                    onSave={(v) => api.updateBudget({ budget_note: v || undefined })}
                    placeholder="Budget notes..."
                    readOnly={readOnly}
                    displayClassName="text-[10px] text-cream/50 mt-1"
                    className="text-[10px] mt-1"
                  />
                )}
              </div>
              <div className="min-w-[140px]">
                <label className="text-[10px] text-cream/50 uppercase tracking-wider block mb-1">Estimated End Date</label>
                {estimatedEndDate ? (
                  <span className="text-sm text-cream/80">{estimatedEndDate} from accepted changes</span>
                ) : (
                  <span className="text-sm text-cream/45 italic">No timeline data yet</span>
                )}
              </div>
            </div>

            {/* Plan's Files */}
            <DocumentsSection api={api} />
          </div>

          {/* ═══ CHANGE LOG — all changes with full editing ═══ */}
          <ChangesSection
            ref={changesSectionRef}
            api={api}
            commentCounts={commentCounts}
            focusEntryId={focusTarget?.section === 'changes' ? focusTarget.entryId : undefined}
          />

          {/* ═══ HISTORY ═══ */}
          <MilestoneTimeline milestones={payload.milestones} />

          {/* Disclaimer — bottom, quiet */}
          <p className="text-[10px] text-cream/25 leading-relaxed">
            For your own reference and organization only — not the official construction record. Confirm final plans, approvals, and scope with your contractor or design team.
          </p>
        </div>

        <CollapsibleCommentSidebar
          ref={commentSidebarRef}
          title="Discussion"
          storageKey="project_summary_comments_collapsed"
          comments={collComments.comments}
          isLoading={collComments.isLoading}
          readOnly={readOnly}
          onAddComment={collComments.addComment}
          onDeleteComment={collComments.deleteComment}
          refEntities={commentRefEntities}
          refEntityType="entry"
          refPickerLabel="Tag a change"
          hideCollapsedTab
          defaultCollapsed
          collectionId={collectionId}
        />
      </div>
    </>
  )
}

export function ToolContent({ collectionId }: { collectionId: string }) {
  return (
    <div className="pt-32 pb-[calc(6rem+var(--bottom-nav-offset,3.5rem))] px-6">
      <div className="max-w-4xl mx-auto">
        <Suspense fallback={null}>
          <ProjectSummaryContent collectionId={collectionId} />
        </Suspense>
      </div>
    </div>
  )
}
