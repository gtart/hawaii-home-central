'use client'

import { Suspense, useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { ToolPageHeader } from '@/components/app/ToolPageHeader'
import { ActivityPanel } from '@/components/app/ActivityPanel'
import { CollapsibleCommentSidebar, type CommentSidebarHandle } from '@/components/app/CollapsibleCommentSidebar'
import type { RefEntity } from '@/components/app/CommentThread'
import { useComments } from '@/hooks/useComments'
import { useUnseenActivityCount } from '@/hooks/useUnseenActivityCount'
import { useProjectSummaryState } from './useProjectSummaryState'
import { SummarySection } from './components/SummarySection'
import { DocumentsSection } from './components/DocumentsSection'
import { ChangesSection } from './components/ChangesSection'
import { OpenDecisionsSection } from './components/OpenDecisionsSection'
import type { SummaryLinkType } from '@/data/project-summary'

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

/** Parsed focus target from URL query param ?focus=change-<id> or ?focus=decision-<id> */
export interface FocusTarget {
  section: 'changes' | 'openDecisions'
  entryId: string
}

function ProjectSummaryContent({ collectionId }: { collectionId: string }) {
  const api = useProjectSummaryState({ collectionId })
  const { payload, isLoaded, isSyncing, access, readOnly, noAccess } = api
  const [activityOpen, setActivityOpen] = useState(false)
  const commentSidebarRef = useRef<CommentSidebarHandle>(null)
  const changesSectionRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()

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
    if (type === 'decision') return { section: 'openDecisions', entryId: id }
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

  // Build ref entities for comment tagging (changes + decisions)
  const commentRefEntities: RefEntity[] = useMemo(() => [
    ...payload.changes.map((c) => ({ id: c.id, label: `Change: ${c.title}` })),
    ...payload.openDecisions.map((d) => ({ id: d.id, label: `Decision: ${d.title}` })),
  ], [payload.changes, payload.openDecisions])

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
          You don&apos;t have access to this Project Summary.
        </p>
      </div>
    )
  }

  return (
    <>
      <ToolPageHeader
        toolKey="project_summary"
        title="Project Summary"
        description="A quick snapshot of your project: what's included, what's changed, and what still needs a decision."
        accessLevel={access}
        hasContent={payload.summary.text.length > 0 || payload.documents.length > 0 || payload.changes.length > 0 || payload.openDecisions.length > 0}
        collectionId={collectionId}
        eyebrowLabel="Project Summary"
        toolLabel="Project Summary"
        actions={(
          <div className="flex items-center gap-2">
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
        <div className="flex-1 min-w-0 space-y-6">
          <SummarySection
            api={api}
            onScrollToChanges={() => {
              changesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
          />
          <DocumentsSection api={api} />
          <div ref={changesSectionRef}>
          <ChangesSection
            api={api}
            commentCounts={commentCounts}
            prefillDraft={prefillDraft}
            onDraftConsumed={handleDraftConsumed}
            focusEntryId={focusTarget?.section === 'changes' ? focusTarget.entryId : undefined}
          />
          </div>
          <OpenDecisionsSection
            api={api}
            commentCounts={commentCounts}
            focusEntryId={focusTarget?.section === 'openDecisions' ? focusTarget.entryId : undefined}
          />
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
