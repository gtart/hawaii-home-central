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
          {/* Scope of Work */}
          <div>
            <label className="text-xs font-semibold text-cream/50 uppercase tracking-wider block mb-2">Scope of Work</label>
            <InlineEdit
              value={payload.plan.scope}
              onSave={(text) => api.updatePlanScope(text)}
              placeholder="What are you renovating? e.g. 'Full kitchen and master bath remodel'"
              readOnly={readOnly}
              multiline
              displayClassName="text-sm text-cream/65 leading-relaxed"
              className="text-sm leading-relaxed"
            />
          </div>

          {/* Zone 1 — Plan Resources */}
          <DocumentsSection api={api} />

          {/* Zone 2 — Changes */}
          <ChangesSection
            api={api}
            commentCounts={commentCounts}
            focusEntryId={focusTarget?.section === 'changes' ? focusTarget.entryId : undefined}
          />

          {/* Zone 3 — Activity (collapsed, secondary) */}
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
