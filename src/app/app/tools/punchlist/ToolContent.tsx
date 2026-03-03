'use client'

import { Suspense, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ToolPageHeader } from '@/components/app/ToolPageHeader'
import { InstanceSwitcher } from '@/components/app/InstanceSwitcher'
import { useProject } from '@/contexts/ProjectContext'
import { usePunchlistState } from './usePunchlistState'
import { PunchlistPage } from './components/PunchlistPage'
import { PunchlistEmptyState } from './components/PunchlistEmptyState'

function PunchlistContent({ collectionId }: { collectionId?: string }) {
  const api = usePunchlistState(collectionId ? { collectionId } : undefined)
  const { payload, isLoaded, isSyncing, access, readOnly, noAccess, title: collectionTitle } = api
  const { currentProject } = useProject()
  const router = useRouter()

  const handleRename = useCallback(async (newTitle: string) => {
    if (!collectionId) return
    try {
      await fetch(`/api/collections/${collectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      })
      router.refresh()
    } catch { /* ignore */ }
  }, [collectionId, router])

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

  return (
    <>
      <ToolPageHeader
        toolKey="punchlist"
        title="Fix List"
        description="Track fixes and share with your contractor."
        accessLevel={access}
        hasContent={payload.items.length > 0}
        collectionId={collectionId}
        collectionName={collectionTitle || undefined}
        eyebrowLabel="Fix List"
        backHref={collectionId ? '/app/tools/punchlist' : undefined}
        backLabel={collectionId ? 'All Fix Lists' : undefined}
        headerSlot={collectionId ? <InstanceSwitcher toolKey="punchlist" currentCollectionId={collectionId} itemNoun="list" /> : undefined}
        toolLabel="Fix List"
        scopes={uniqueLocations.map((loc) => ({ id: loc, name: loc }))}
        scopeLabel="Locations"
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
      />

      {isSyncing && (
        <div className="flex items-center gap-2 text-xs text-cream/30 mb-4">
          <div className="w-3 h-3 border border-cream/20 border-t-cream/50 rounded-full animate-spin" />
          Saving...
        </div>
      )}

      {payload.items.length === 0 ? (
        <PunchlistEmptyState readOnly={readOnly} api={api} />
      ) : (
        <PunchlistPage api={api} />
      )}
    </>
  )
}

export function ToolContent({ collectionId }: { collectionId?: string } = {}) {
  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        <Suspense fallback={null}>
          <PunchlistContent collectionId={collectionId} />
        </Suspense>
      </div>
    </div>
  )
}
