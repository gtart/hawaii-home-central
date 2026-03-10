'use client'

import { Suspense, useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ToolPageHeader } from '@/components/app/ToolPageHeader'
import { InstanceSwitcher } from '@/components/app/InstanceSwitcher'
import { ActivityPanel } from '@/components/app/ActivityPanel'
import { UnsortedBanner } from '@/components/app/UnsortedBanner'
import { CollapsibleCommentSidebar } from '@/components/app/CollapsibleCommentSidebar'
import type { RefEntity } from '@/components/app/CommentThread'
import { useProject } from '@/contexts/ProjectContext'
import { useComments } from '@/hooks/useComments'
import { usePunchlistState } from './usePunchlistState'
import { PunchlistPage } from './components/PunchlistPage'
import { PunchlistEmptyState } from './components/PunchlistEmptyState'
import { ManageShareLinks } from './components/ManageShareLinks'
import { useUnseenActivityCount } from '@/hooks/useUnseenActivityCount'

function PunchlistContent({ collectionId }: { collectionId?: string }) {
  const api = usePunchlistState(collectionId ? { collectionId } : undefined)
  const { payload, isLoaded, isSyncing, access, readOnly, noAccess, title: collectionTitle, projectId: collectionProjectId } = api
  const { currentProject } = useProject()
  const router = useRouter()
  const [activityOpen, setActivityOpen] = useState(false)
  const [titleOverride, setTitleOverride] = useState<string | null>(null)
  const [commentRef, setCommentRef] = useState<RefEntity | null>(null)
  const [forceExpandComments, setForceExpandComments] = useState(false)

  // Collection-level comments
  const collComments = useComments({
    collectionId: collectionId || null,
    targetType: 'collection',
    targetId: collectionId || null,
  })
  const { count: unseenActivity, markSeen: markActivitySeen } = useUnseenActivityCount(
    collectionId ? { toolKey: 'punchlist', collectionId } : undefined
  )

  // Redirect to picker if the loaded collection belongs to a different project
  useEffect(() => {
    if (collectionId && isLoaded && collectionProjectId && currentProject?.id && collectionProjectId !== currentProject.id) {
      router.replace('/app/tools/punchlist')
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
    if (!collectionId || !confirm('Archive this fix list? You can restore it later.')) return
    try {
      await fetch(`/api/collections/${collectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archivedAt: new Date().toISOString() }),
      })
      router.push('/app/tools/punchlist')
    } catch { /* ignore */ }
  }, [collectionId, router])

  // Build ref entities for comment @ mentions — must be before early returns for hook order
  const commentRefEntities: RefEntity[] = useMemo(() =>
    payload.items.map((i) => ({ id: i.id, label: i.title || `#${i.itemNumber}` })),
    [payload.items]
  )

  // Per-item comment counts — must be before early returns for hook order
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
    if (ref) {
      setCommentRef(ref)
    }
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

  const uniqueLocations = [...new Set(payload.items.map((i) => i.location))].filter(Boolean).sort()
  const uniqueAssignees = [...new Set(payload.items.map((i) => i.assigneeLabel))].filter(Boolean).sort()
  const effectiveProjectId = collectionProjectId || currentProject?.id || ''

  return (
    <>
      <ToolPageHeader
        toolKey="punchlist"
        title="Fix List"
        description="Track fixes and share with your contractor."
        accessLevel={access}
        hasContent={payload.items.length > 0}
        collectionId={collectionId}
        collectionName={titleOverride || collectionTitle || undefined}
        eyebrowLabel="Fix List"
        backHref={collectionId ? '/app/tools/punchlist' : undefined}
        backLabel={collectionId ? 'All Fix Lists' : undefined}
        headerSlot={collectionId ? <InstanceSwitcher toolKey="punchlist" currentCollectionId={collectionId} itemNoun="list" /> : undefined}
        toolLabel="Fix List"
        scopes={uniqueLocations.map((loc) => ({ id: loc, name: loc }))}
        scopeLabel="Locations"
        customLinkTab={
          <ManageShareLinks
            toolKey="punchlist"
            projectId={effectiveProjectId}
            locations={uniqueLocations}
            assignees={uniqueAssignees}
            collectionId={collectionId}
          />
        }
        buildExportUrl={({ projectId: pid, selectedScopeIds, includeNotes, includeComments, includePhotos }) => {
          const reportBase = collectionId
            ? `/app/tools/punchlist/${collectionId}/report`
            : `/app/tools/punchlist/report?projectId=${pid}`
          const sep = reportBase.includes('?') ? '&' : '?'
          let url = `${reportBase}${sep}includeNotes=${includeNotes}&includeComments=${includeComments}&includePhotos=${includePhotos}`
          if (selectedScopeIds.length > 0) {
            url += `&locations=${encodeURIComponent(selectedScopeIds.join(','))}`
          }
          return url
        }}
        onRename={collectionId ? handleRename : undefined}
        onArchive={collectionId ? handleArchive : undefined}
        actions={collectionId ? (
          <button
            type="button"
            onClick={() => { setActivityOpen(true); markActivitySeen() }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-cream/50 hover:text-cream/70 bg-cream/5 hover:bg-cream/10 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Activity
            {unseenActivity > 0 && (
              <span className="bg-sandstone/20 text-sandstone text-[10px] font-medium px-1.5 py-0.5 rounded-full tabular-nums">
                {unseenActivity > 98 ? '99+' : unseenActivity}
              </span>
            )}
          </button>
        ) : undefined}
      />
      {activityOpen && collectionId && (
        <ActivityPanel
          onClose={() => setActivityOpen(false)}
          toolKey="punchlist"
          collectionId={collectionId}
          collectionTitle={titleOverride || collectionTitle || undefined}
        />
      )}

      <UnsortedBanner toolKey="punchlist" />

      {isSyncing && (
        <div className="flex items-center gap-2 text-xs text-cream/30 mb-4">
          <div className="w-3 h-3 border border-cream/20 border-t-cream/50 rounded-full animate-spin" />
          Saving...
        </div>
      )}

      {payload.items.length === 0 ? (
        <PunchlistEmptyState readOnly={readOnly} api={api} />
      ) : (
        <div className="md:flex md:gap-6 md:items-start">
          <div className="flex-1 min-w-0">
            <PunchlistPage
              api={api}
              collectionId={collectionId}
              projectId={collectionProjectId || currentProject?.id}
              commentCounts={commentCounts}
              onOpenComments={collectionId ? handleOpenComments : undefined}
              allComments={collComments.comments}
            />
          </div>
          {collectionId && (
            <CollapsibleCommentSidebar
              title="Comments"
              storageKey="punchlist_comments_collapsed"
              comments={collComments.comments}
              isLoading={collComments.isLoading}
              readOnly={readOnly}
              onAddComment={collComments.addComment}
              onDeleteComment={collComments.deleteComment}
              refEntities={commentRefEntities}
              refEntityType="item"
              refPickerLabel="Tag a fix"
              initialRef={commentRef}
              onClearInitialRef={() => setCommentRef(null)}
              forceExpand={forceExpandComments}
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
          <PunchlistContent collectionId={collectionId} />
        </Suspense>
      </div>
    </div>
  )
}
