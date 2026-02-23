'use client'

import { Suspense, useMemo } from 'react'
import { ToolPageHeader } from '@/components/app/ToolPageHeader'
import { usePunchlistState } from './usePunchlistState'
import { PunchlistPage } from './components/PunchlistPage'
import { PunchlistEmptyState } from './components/PunchlistEmptyState'
import { ManageShareLinks } from './components/ManageShareLinks'

function PunchlistContent() {
  const api = usePunchlistState()
  const { payload, isLoaded, isSyncing, access, readOnly, noAccess } = api
  const isOwner = access === 'OWNER'

  const uniqueLocations = useMemo(
    () => [...new Set(payload.items.map((i) => i.location))].filter(Boolean).sort(),
    [payload.items]
  )

  const uniqueAssignees = useMemo(
    () => [...new Set(payload.items.map((i) => i.assigneeLabel))].filter(Boolean).sort(),
    [payload.items]
  )

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
          You don&apos;t have access to this tool for the current project.
        </p>
      </div>
    )
  }

  return (
    <>
      <ToolPageHeader
        toolKey="punchlist"
        title="Fix List"
        description="Track fixes and share with your contractor."
        accessLevel={access}
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

      {isOwner && <ManageShareLinks toolKey="punchlist" locations={uniqueLocations} assignees={uniqueAssignees} />}
    </>
  )
}

export function ToolContent() {
  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        <Suspense fallback={null}>
          <PunchlistContent />
        </Suspense>
      </div>
    </div>
  )
}
