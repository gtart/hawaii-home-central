'use client'

import { Suspense, useMemo, useState } from 'react'
import { ToolPageHeader } from '@/components/app/ToolPageHeader'
import { useProject } from '@/contexts/ProjectContext'
import { usePunchlistState } from './usePunchlistState'
import { PunchlistPage } from './components/PunchlistPage'
import { PunchlistEmptyState } from './components/PunchlistEmptyState'
import { ShareExportModal } from './components/ShareExportModal'

function PunchlistContent() {
  const api = usePunchlistState()
  const { payload, isLoaded, isSyncing, access, readOnly, noAccess } = api
  const { currentProject } = useProject()
  const isOwner = access === 'OWNER'
  const [showShareExport, setShowShareExport] = useState(false)

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
        hasContent={payload.items.length > 0}
      >
        {payload.items.length > 0 && (
          <button
            type="button"
            onClick={() => setShowShareExport(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-sandstone/15 text-sandstone hover:bg-sandstone/25 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="16 6 12 2 8 6" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="12" y1="2" x2="12" y2="15" strokeLinecap="round" />
            </svg>
            Share &amp; Export
          </button>
        )}
      </ToolPageHeader>

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

      {showShareExport && currentProject && (
        <ShareExportModal
          onClose={() => setShowShareExport(false)}
          locations={uniqueLocations}
          assignees={uniqueAssignees}
          projectId={currentProject.id}
          isOwner={isOwner}
        />
      )}
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
