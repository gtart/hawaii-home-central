'use client'

import { Suspense, useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ToolPageHeader } from '@/components/app/ToolPageHeader'
import { InstanceSwitcher } from '@/components/app/InstanceSwitcher'
import { ActivityPanel } from '@/components/app/ActivityPanel'
import { CollapsibleCommentSidebar, type CommentSidebarHandle } from '@/components/app/CollapsibleCommentSidebar'
import type { RefEntity } from '@/components/app/CommentThread'
import { useProject } from '@/contexts/ProjectContext'
import { useComments } from '@/hooks/useComments'
import { useUnseenActivityCount } from '@/hooks/useUnseenActivityCount'
import { useAlignmentState } from './useAlignmentState'
import { AlignmentListPage } from './components/AlignmentListPage'
import { AlignmentEmptyState } from './components/AlignmentEmptyState'

function AlignmentContent({ collectionId }: { collectionId?: string }) {
  const api = useAlignmentState(collectionId ? { collectionId } : undefined)
  const { payload, isLoaded, isSyncing, access, readOnly, noAccess, title: collectionTitle, projectId: collectionProjectId } = api
  const { currentProject } = useProject()
  const router = useRouter()
  const [activityOpen, setActivityOpen] = useState(false)
  const [titleOverride, setTitleOverride] = useState<string | null>(null)
  const [commentRef, setCommentRef] = useState<RefEntity | null>(null)
  const [forceExpandComments, setForceExpandComments] = useState(false)
  const commentSidebarRef = useRef<CommentSidebarHandle>(null)

  const collComments = useComments({
    collectionId: collectionId || null,
    targetType: 'collection',
    targetId: collectionId || null,
  })
  const { count: unseenActivity, markSeen: markActivitySeen } = useUnseenActivityCount(
    collectionId ? { toolKey: 'project_alignment', collectionId } : undefined
  )

  // Redirect if collection belongs to different project
  useEffect(() => {
    if (collectionId && isLoaded && collectionProjectId && currentProject?.id && collectionProjectId !== currentProject.id) {
      router.replace('/app/tools/project-alignment')
    }
  }, [collectionId, isLoaded, collectionProjectId, currentProject?.id, router])

  const handleRename = useCallback(async (newTitle: string) => {
    if (!collectionId) return
    setTitleOverride(newTitle)
    try {
      await fetch(`/api/collections/${collectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      })
    } catch { /* ignore */ }
  }, [collectionId])

  const handleArchive = useCallback(async () => {
    if (!collectionId || !confirm('Archive this alignment tracker? You can restore it later.')) return
    try {
      await fetch(`/api/collections/${collectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archivedAt: new Date().toISOString() }),
      })
      router.push('/app/tools/project-alignment')
    } catch { /* ignore */ }
  }, [collectionId, router])

  const commentRefEntities: RefEntity[] = useMemo(() =>
    payload.items.map((i) => ({ id: i.id, label: i.title || `#${i.itemNumber}` })),
    [payload.items]
  )

  const commentCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const c of collComments.comments) {
      if (c.refEntityId) {
        counts.set(c.refEntityId, (counts.get(c.refEntityId) || 0) + 1)
      }
    }
    return counts
  }, [collComments.comments])

  const handleOpenComments = useCallback((ref?: RefEntity) => {
    if (ref) setCommentRef(ref)
    setForceExpandComments(true)
    setTimeout(() => setForceExpandComments(false), 100)
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
          You don&apos;t have access to this tool for the current home.
        </p>
      </div>
    )
  }

  const uniqueAreas = [...new Set(payload.items.map((i) => i.area_label))].filter(Boolean).sort()

  return (
    <>
      <ToolPageHeader
        toolKey="project_alignment"
        title="Project Alignment"
        description="Track scope questions, mismatches, and agreements with your team."
        accessLevel={access}
        hasContent={payload.items.length > 0}
        collectionId={collectionId}
        collectionName={titleOverride || collectionTitle || undefined}
        eyebrowLabel="Project Alignment"
        backHref={collectionId ? '/app/tools/project-alignment' : undefined}
        backLabel={collectionId ? 'All Trackers' : undefined}
        headerSlot={collectionId ? <InstanceSwitcher toolKey="project_alignment" currentCollectionId={collectionId} itemNoun="tracker" /> : undefined}
        toolLabel="Project Alignment"
        scopes={uniqueAreas.map((area) => ({ id: area, name: area }))}
        scopeLabel="Areas"
        onRename={collectionId ? handleRename : undefined}
        onArchive={collectionId ? handleArchive : undefined}
        actions={collectionId ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => commentSidebarRef.current?.toggle()}
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
        ) : undefined}
      />
      {activityOpen && collectionId && (
        <ActivityPanel
          onClose={() => setActivityOpen(false)}
          toolKey="project_alignment"
          collectionId={collectionId}
          collectionTitle={titleOverride || collectionTitle || undefined}
        />
      )}

      {isSyncing && (
        <div className="flex items-center gap-2 text-xs text-cream/30 mb-4">
          <div className="w-3 h-3 border border-cream/20 border-t-cream/50 rounded-full animate-spin" />
          Saving...
        </div>
      )}

      {payload.items.length === 0 ? (
        <AlignmentEmptyState readOnly={readOnly} api={api} />
      ) : (
        <div className="md:flex md:gap-6 md:items-start">
          <div className="flex-1 min-w-0">
            <AlignmentListPage
              api={api}
              collectionId={collectionId}
              commentCounts={commentCounts}
              onOpenComments={collectionId ? handleOpenComments : undefined}
            />
          </div>
          {collectionId && (
            <CollapsibleCommentSidebar
              ref={commentSidebarRef}
              title="Comments"
              storageKey="alignment_comments_collapsed"
              comments={collComments.comments}
              isLoading={collComments.isLoading}
              readOnly={readOnly}
              onAddComment={collComments.addComment}
              onDeleteComment={collComments.deleteComment}
              refEntities={commentRefEntities}
              refEntityType="item"
              refPickerLabel="Tag an item"
              initialRef={commentRef}
              onClearInitialRef={() => setCommentRef(null)}
              forceExpand={forceExpandComments}
              hideCollapsedTab
            />
          )}
        </div>
      )}
    </>
  )
}

export function ToolContent({ collectionId }: { collectionId?: string } = {}) {
  return (
    <div className="pt-32 pb-[calc(6rem+var(--bottom-nav-offset,3.5rem))] px-6">
      <div className="max-w-4xl mx-auto overflow-x-clip">
        <Suspense fallback={null}>
          <AlignmentContent collectionId={collectionId} />
        </Suspense>
      </div>
    </div>
  )
}
