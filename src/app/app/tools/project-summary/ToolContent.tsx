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

function ProjectSummaryContent({ collectionId }: { collectionId: string }) {
  const api = useProjectSummaryState({ collectionId })
  const { payload, isLoaded, isSyncing, access, readOnly, noAccess, title: collectionTitle } = api
  const router = useRouter()
  const [titleOverride, setTitleOverride] = useState<string | null>(null)
  const [copiedSummary, setCopiedSummary] = useState(false)
  const commentSidebarRef = useRef<CommentSidebarHandle>(null)
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

  /** Copy change log summary to clipboard */
  const handleCopySummary = useCallback(() => {
    const { plan, changes, documents } = payload
    const lines: string[] = []
    lines.push('PROJECT CHANGE LOG')
    lines.push('')
    if (plan.scope) { lines.push('PROJECT DESCRIPTION'); lines.push(plan.scope); lines.push('') }
    const currentDocs = documents.filter((d) => d.isCurrent)
    if (currentDocs.length > 0) {
      lines.push('CURRENT REFERENCE FILES')
      currentDocs.forEach((d) => {
        lines.push(`  - ${d.label}${d.docType ? ` (${d.docType})` : ''}`)
      })
      lines.push('')
    }
    const activeChanges = changes.filter((c) => c.status !== 'closed')
    if (activeChanges.length > 0) {
      lines.push('CHANGE LOG')
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
        title="Project Change Log"
        description="Keep a simple record of what changed during your renovation. Track the latest files you're working from and log important decisions so nothing gets lost."
        accessLevel={access}
        hasContent={payload.plan.scope.length > 0 || payload.documents.length > 0 || payload.changes.length > 0}
        collectionId={collectionId}
        collectionName={titleOverride ?? collectionTitle ?? undefined}
        eyebrowLabel="Project Change Log"
        toolLabel="Project Change Log"
        backHref="/app/tools/project-summary"
        backLabel="All Logs"
        onRename={readOnly ? undefined : handleRename}
        onArchive={readOnly ? undefined : handleArchive}
        actions={(
          <div className="flex items-center gap-2">
            <InstanceSwitcher
              toolKey="project_summary"
              currentCollectionId={collectionId}
              itemNoun="log"
            />
            {/* Copy Summary */}
            <button
              type="button"
              onClick={handleCopySummary}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-cream/65 hover:text-cream/80 bg-stone-200 hover:bg-stone-hover transition-colors"
              title="Copy change log summary to clipboard"
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-cream/65 hover:text-cream/80 bg-stone-200 hover:bg-stone-hover transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Comments
              {collComments.comments.length > 0 && (
                <span className="bg-cream/15 text-cream/55 text-[10px] font-medium px-1.5 py-0.5 rounded-full tabular-nums">
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
        <div className="flex-1 min-w-0 space-y-8">
          {/* Project description — simple, optional context */}
          <div>
            <InlineEdit
              value={payload.plan.scope}
              onSave={(text) => api.updatePlanScope(text)}
              placeholder="Add a brief project description (optional) — e.g. 'Kitchen and bath renovation, started Jan 2026'"
              readOnly={readOnly}
              multiline
              displayClassName="text-sm text-cream/70 leading-relaxed"
              className="text-sm leading-relaxed"
            />
          </div>

          {/* Disclaimer */}
          <p className="text-[10px] text-cream/35 leading-relaxed">
            This tool is for homeowner organization and reference only. It is not the official construction record. Always confirm final plans, approvals, and scope with your contractor or design team.
          </p>

          {/* Zone 1 — Latest Reference Files */}
          <DocumentsSection api={api} />

          {/* Zone 2 — Change Log */}
          <ChangesSection
            api={api}
            commentCounts={commentCounts}
            focusEntryId={focusTarget?.section === 'changes' ? focusTarget.entryId : undefined}
          />

          {/* Activity — collapsed at bottom */}
          <MilestoneTimeline milestones={payload.milestones} />
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
          collectionId={collectionId}
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
