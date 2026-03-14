'use client'

import { Suspense, useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ToolPageHeader } from '@/components/app/ToolPageHeader'
import { InstanceSwitcher } from '@/components/app/InstanceSwitcher'
import { ActivityPanel } from '@/components/app/ActivityPanel'
import { CollapsibleCommentSidebar, type CommentSidebarHandle } from '@/components/app/CollapsibleCommentSidebar'
import type { RefEntity } from '@/components/app/CommentThread'
import { useComments } from '@/hooks/useComments'
import { useUnseenActivityCount } from '@/hooks/useUnseenActivityCount'
import { useProjectSummaryState } from './useProjectSummaryState'
import { CurrentPlanSection } from './components/CurrentPlanSection'
import { DocumentsSection } from './components/DocumentsSection'
import { ChangesSection } from './components/ChangesSection'
import { MilestoneTimeline } from './components/MilestoneTimeline'
import type { SummaryLinkType, SummaryChange, OpenItem } from '@/data/project-summary'

/** Draft data from CreateProjectSummaryEntryButton — local-only, not persisted until explicit save. */
export interface PrefillDraft {
  title: string
  description: string
  linkType: SummaryLinkType
  toolKey?: string
  collectionId?: string
  entityId?: string
  entityLabel: string
}

/** Parsed focus target from URL query param ?focus=change-<id> */
export interface FocusTarget {
  section: 'changes'
  entryId: string
}

/** Compact Change Queue summary near top of page (PCV1-024) */
function ChangeQueueSummary({ changes, openItems }: { changes: SummaryChange[]; openItems: OpenItem[] }) {
  const pending = changes.filter((c) => c.status !== 'done' && c.status !== 'closed' && !c.incorporated)
  const awaitingIncorporation = changes.filter((c) => (c.status === 'accepted_by_contractor' || c.status === 'done') && !c.incorporated)
  const unresolvedChangeItems = changes.reduce((sum, c) => sum + (c.open_items || []).filter((i) => i.status === 'open' || i.status === 'waiting').length, 0)
  const pendingCostImpact = pending.reduce((sum, c) => {
    if (!c.cost_impact) return sum
    const num = parseFloat(c.cost_impact.replace(/[^0-9.\-+]/g, ''))
    return isNaN(num) ? sum : sum + num
  }, 0)

  if (pending.length === 0 && awaitingIncorporation.length === 0) return null

  return (
    <div className="rounded-lg border border-cream/[0.06] bg-cream/[0.02] px-4 py-3">
      <div className="text-[10px] text-cream/30 uppercase tracking-wider font-medium mb-2">Change Queue</div>
      <div className="flex flex-wrap gap-x-6 gap-y-1">
        {pending.length > 0 && (
          <div className="text-xs text-cream/50">
            <span className="text-cream/70 font-medium">{pending.length}</span> pending
          </div>
        )}
        {awaitingIncorporation.length > 0 && (
          <div className="text-xs text-teal-400/60">
            <span className="text-teal-400/80 font-medium">{awaitingIncorporation.length}</span> awaiting incorporation
          </div>
        )}
        {unresolvedChangeItems > 0 && (
          <div className="text-xs text-amber-400/60">
            <span className="text-amber-400/80 font-medium">{unresolvedChangeItems}</span> unresolved change item{unresolvedChangeItems !== 1 ? 's' : ''}
          </div>
        )}
        {pendingCostImpact !== 0 && (
          <div className="text-xs text-cream/40">
            Pending cost: <span className="text-cream/60">{pendingCostImpact >= 0 ? '+' : ''}${Math.abs(pendingCostImpact).toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function ProjectSummaryContent({ collectionId }: { collectionId: string }) {
  const api = useProjectSummaryState({ collectionId })
  const { payload, isLoaded, isSyncing, access, readOnly, noAccess } = api
  const router = useRouter()
  const [activityOpen, setActivityOpen] = useState(false)
  const [titleOverride, setTitleOverride] = useState<string | null>(null)
  const [copiedSummary, setCopiedSummary] = useState(false)
  const commentSidebarRef = useRef<CommentSidebarHandle>(null)
  const changesSectionRef = useRef<HTMLDivElement>(null)
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
      // revert on failure
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

  /** Copy plan summary to clipboard as formatted text (PCV1-057) */
  const handleCopySummary = useCallback(() => {
    const { plan, budget, changes } = payload
    const lines: string[] = []
    lines.push('OFFICIAL PLAN SUMMARY')
    lines.push(`Status: ${plan.status === 'approved' ? 'Approved' : plan.status === 'unlocked' ? 'Unlocked for Revision' : 'Draft'}`)
    if (plan.approved_at) lines.push(`Approved: ${new Date(plan.approved_at).toLocaleDateString()}`)
    lines.push('')
    if (plan.scope) { lines.push('SCOPE'); lines.push(plan.scope); lines.push('') }
    if (plan.included.length > 0) {
      lines.push('INCLUDED')
      plan.included.forEach((i) => lines.push(`  - ${i.text}`))
      lines.push('')
    }
    if (plan.not_included.length > 0) {
      lines.push('NOT INCLUDED')
      plan.not_included.forEach((i) => lines.push(`  - ${i.text}`))
      lines.push('')
    }
    const openItems = plan.open_items.filter((i) => i.status === 'open' || i.status === 'waiting')
    if (openItems.length > 0) {
      lines.push('OPEN ITEMS')
      openItems.forEach((i) => lines.push(`  - [${i.status}] ${i.text}`))
      lines.push('')
    }
    if (budget.baseline_amount) {
      lines.push('BUDGET')
      lines.push(`  Baseline: ${budget.baseline_amount}`)
      if (budget.budget_note) lines.push(`  Note: ${budget.budget_note}`)
      lines.push('')
    }
    const activeChanges = changes.filter((c) => c.status !== 'done' && c.status !== 'closed')
    if (activeChanges.length > 0) {
      lines.push('PENDING CHANGES')
      activeChanges.forEach((c) => {
        const parts = [`  - ${c.title}`]
        if (c.cost_impact) parts.push(`(${c.cost_impact})`)
        lines.push(parts.join(' '))
      })
      lines.push('')
    }
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopiedSummary(true)
      setTimeout(() => setCopiedSummary(false), 2000)
    })
  }, [payload])

  // Draft state from CreateProjectSummaryEntryButton — local only, no persistence until user saves
  const [prefillDraft, setPrefillDraft] = useState<PrefillDraft | null>(null)

  // Focus target from URL query param (e.g. ?focus=change-<id>)
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
  const { count: unseenActivity, markSeen: markActivitySeen } = useUnseenActivityCount(
    { toolKey: 'project_summary', collectionId }
  )

  // Build ref entities for comment tagging (changes only)
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

  // Read prefill context from sessionStorage into draft state — NO writes, NO persistence
  useEffect(() => {
    if (!isLoaded || readOnly) return
    try {
      const raw = sessionStorage.getItem('hhc_project_summary_create_link')
      if (!raw) return
      sessionStorage.removeItem('hhc_project_summary_create_link')
      const data = JSON.parse(raw)
      if (data?.entity_label && data?.artifact_type && data?.entity_id) {
        const linkType = data.artifact_type === 'selection' ? 'selection' as const : 'fix_item' as const
        setPrefillDraft({
          title: data.entity_label,
          description: `Linked from ${linkType === 'selection' ? 'Selections' : 'Fix List'}`,
          linkType,
          toolKey: data.tool_key,
          collectionId: data.collection_id,
          entityId: data.entity_id,
          entityLabel: data.entity_label,
        })
      }
    } catch {
      // ignore malformed sessionStorage
    }
  }, [isLoaded, readOnly])

  const handleDraftConsumed = useCallback(() => {
    setPrefillDraft(null)
  }, [])

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
        <p className="text-cream/50 text-sm">
          You don&apos;t have access to this Plan &amp; Changes collection.
        </p>
      </div>
    )
  }

  return (
    <>
      <ToolPageHeader
        toolKey="project_summary"
        title="Plan & Changes"
        description="Your project plan, what's included and excluded, budget overview, and a record of every change along the way."
        accessLevel={access}
        hasContent={payload.plan.scope.length > 0 || payload.documents.length > 0 || payload.changes.length > 0 || payload.plan.included.length > 0 || payload.plan.not_included.length > 0 || payload.plan.open_items.length > 0}
        collectionId={collectionId}
        collectionName={titleOverride ?? undefined}
        eyebrowLabel="Plan & Changes"
        toolLabel="Plan & Changes"
        backHref="/app/tools/project-summary"
        backLabel="All Plans"
        onRename={readOnly ? undefined : handleRename}
        onArchive={readOnly ? undefined : handleArchive}
        actions={(
          <div className="flex items-center gap-2">
            <InstanceSwitcher
              toolKey="project_summary"
              currentCollectionId={collectionId}
              itemNoun="plan"
            />
            {/* Copy Summary — shareable text snapshot (PCV1-057) */}
            <button
              type="button"
              onClick={handleCopySummary}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-cream/50 hover:text-cream/70 bg-cream/5 hover:bg-cream/10 transition-colors"
              title="Copy plan summary to clipboard"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {copiedSummary ? (
                  <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                ) : (
                  <>
                    <rect x="9" y="9" width="13" height="13" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeLinecap="round" strokeLinejoin="round" />
                  </>
                )}
              </svg>
              <span className="hidden md:inline">{copiedSummary ? 'Copied' : 'Copy Summary'}</span>
            </button>
            <button
              type="button"
              onClick={handleOpenComments}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-cream/50 hover:text-cream/70 bg-cream/5 hover:bg-cream/10 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Comments
              {collComments.comments.length > 0 && (
                <span className="bg-cream/10 text-cream/40 text-[10px] font-medium px-1.5 py-0.5 rounded-full tabular-nums">
                  {collComments.comments.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => { setActivityOpen(true); markActivitySeen() }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-cream/50 hover:text-cream/70 bg-cream/5 hover:bg-cream/10 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Activity
              {unseenActivity > 0 && (
                <span className="bg-sandstone/20 text-sandstone text-[10px] font-medium px-1.5 py-0.5 rounded-full tabular-nums">
                  {unseenActivity > 98 ? '99+' : unseenActivity}
                </span>
              )}
            </button>
          </div>
        )}
      />

      {activityOpen && (
        <ActivityPanel
          onClose={() => setActivityOpen(false)}
          toolKey="project_summary"
          collectionId={collectionId}
        />
      )}

      {isSyncing && (
        <div className="flex items-center gap-2 text-xs text-cream/30 mb-4">
          <div className="w-3 h-3 border border-cream/20 border-t-cream/50 rounded-full animate-spin" />
          Saving...
        </div>
      )}

      <div className="md:flex md:gap-6 md:items-start">
        <div className="flex-1 min-w-0">
          {/* === PRIMARY ZONE: Official Plan Record (PCV1-026/028) === */}
          <div className="space-y-4 md:space-y-5">
            {/* 1. Official Plan (PCV1-020) */}
            <CurrentPlanSection
              api={api}
              onScrollToChanges={() => {
                changesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
            />

            {/* 2. Plan Documents — under the plan (PCV1-022) */}
            <DocumentsSection api={api} />
          </div>

          {/* Visual separator between plan record and change log (PCV1-026/028) */}
          <div className="my-6 md:my-8 border-t border-cream/[0.06]" />

          {/* === SECONDARY ZONE: Changes & Activity === */}
          <div className="space-y-4 md:space-y-5">
            {/* 3. Change Queue Summary (PCV1-024) */}
            <ChangeQueueSummary changes={payload.changes} openItems={payload.plan.open_items} />

            {/* 4. Changes — Pending then History (PCV1-023) */}
            <div ref={changesSectionRef}>
              <ChangesSection
                api={api}
                commentCounts={commentCounts}
                prefillDraft={prefillDraft}
                onDraftConsumed={handleDraftConsumed}
                focusEntryId={focusTarget?.section === 'changes' ? focusTarget.entryId : undefined}
              />
            </div>

            {/* 5. Timeline & History (PCV1-025) */}
            <MilestoneTimeline milestones={payload.milestones} />
          </div>
        </div>

        <CollapsibleCommentSidebar
          ref={commentSidebarRef}
          title="Comments"
          storageKey="project_summary_comments_collapsed"
          comments={collComments.comments}
          isLoading={collComments.isLoading}
          readOnly={readOnly}
          onAddComment={collComments.addComment}
          onDeleteComment={collComments.deleteComment}
          refEntities={commentRefEntities}
          refEntityType="entry"
          refPickerLabel="Tag an entry"
          hideCollapsedTab
          defaultCollapsed
        />
      </div>
    </>
  )
}

export function ToolContent({ collectionId }: { collectionId: string }) {
  return (
    <div className="pt-32 pb-[calc(6rem+var(--bottom-nav-offset,3.5rem))] px-6">
      <div className="max-w-4xl mx-auto overflow-x-clip">
        <Suspense fallback={null}>
          <ProjectSummaryContent collectionId={collectionId} />
        </Suspense>
      </div>
    </div>
  )
}
