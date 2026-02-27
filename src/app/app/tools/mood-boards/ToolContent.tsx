'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ToolPageHeader } from '@/components/app/ToolPageHeader'
import { ShareExportModal } from '@/components/app/ShareExportModal'
import { useProject } from '@/contexts/ProjectContext'
import { resolveBoardAccess } from '@/data/mood-boards'
import { useMoodBoardState } from './useMoodBoardState'
import { BoardsHomeView } from './components/BoardsHomeView'
import { BoardDetailView } from './components/BoardDetailView'

function MoodBoardsContent() {
  const api = useMoodBoardState()
  const { payload, isLoaded, isSyncing, access, readOnly, noAccess } = api
  const { data: session } = useSession()
  const { currentProject } = useProject()
  const router = useRouter()
  const searchParams = useSearchParams()
  const boardId = searchParams.get('board')
  const userEmail = session?.user?.email || ''
  const [showShareExport, setShowShareExport] = useState(false)

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

  const activeBoard = boardId
    ? payload.boards.find((b) => b.id === boardId)
    : null

  // Enforce board-level ACL
  const boardAccess = activeBoard
    ? resolveBoardAccess(activeBoard, userEmail, access || 'VIEW')
    : null

  // If user navigated to a board they can't see, show no-access state
  const boardNoAccess = activeBoard && boardAccess === null

  // Board-level readOnly: true if tool is readOnly OR board access is 'view'
  const boardReadOnly = readOnly || boardAccess === 'view'

  return (
    <>
      <ToolPageHeader
        toolKey="mood_boards"
        title="Mood Boards"
        description="Collect and organize inspiration from anywhere — then turn your favorites into real selections."
        accessLevel={access}
        hasContent={payload.boards.length > 0}
      >
        {payload.boards.length > 0 && (
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

      {boardNoAccess ? (
        <div className="text-center py-24">
          <h2 className="font-serif text-2xl text-cream mb-2">No Access</h2>
          <p className="text-cream/50 text-sm mb-6">
            You don&apos;t have access to this board.
          </p>
          <button
            type="button"
            onClick={() => router.push('/app/tools/mood-boards')}
            className="text-sandstone hover:text-sandstone-light text-sm"
          >
            Back to boards
          </button>
        </div>
      ) : activeBoard ? (
        <BoardDetailView board={activeBoard} api={api} readOnly={boardReadOnly} toolAccess={access || 'VIEW'} />
      ) : (
        <BoardsHomeView api={api} readOnly={readOnly} toolAccess={access || 'VIEW'} />
      )}

      {showShareExport && currentProject && (
        <ShareExportModal
          toolKey="mood_boards"
          toolLabel="Mood Boards"
          projectId={currentProject.id}
          isOwner={access === 'OWNER'}
          onClose={() => setShowShareExport(false)}
          scopes={payload.boards
            .filter((b) => !b.isDefault)
            .map((b) => ({
              id: b.id,
              name: b.name,
            }))}
          scopeLabel="Boards"
          buildExportUrl={({ includeNotes, includeComments, includePhotos, scopeMode, selectedScopeIds }) => {
            let url = `/app/tools/mood-boards/report?includeNotes=${includeNotes}&includeComments=${includeComments}&includePhotos=${includePhotos}`
            if (scopeMode === 'selected' && selectedScopeIds.length > 0) {
              url += `&boardIds=${encodeURIComponent(selectedScopeIds.join(','))}`
            }
            return url
          }}
        />
      )}
    </>
  )
}

export function ToolContent() {
  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-6xl mx-auto">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-24">
              <div className="w-6 h-6 border-2 border-sandstone/30 border-t-sandstone rounded-full animate-spin" />
            </div>
          }
        >
          <MoodBoardsContent />
        </Suspense>
      </div>
    </div>
  )
}
