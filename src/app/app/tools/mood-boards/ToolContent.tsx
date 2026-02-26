'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ToolPageHeader } from '@/components/app/ToolPageHeader'
import { useMoodBoardState } from './useMoodBoardState'
import { BoardsHomeView } from './components/BoardsHomeView'
import { BoardDetailView } from './components/BoardDetailView'

function MoodBoardsContent() {
  const api = useMoodBoardState()
  const { payload, isLoaded, isSyncing, access, readOnly, noAccess } = api
  const searchParams = useSearchParams()
  const boardId = searchParams.get('board')

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

  return (
    <>
      <ToolPageHeader
        toolKey="mood_boards"
        title="Mood Boards"
        description="Collect and organize inspiration from anywhere — then turn your favorites into real selections."
        accessLevel={access}
      />

      {isSyncing && (
        <div className="flex items-center gap-2 text-xs text-cream/30 mb-4">
          <div className="w-3 h-3 border border-cream/20 border-t-cream/50 rounded-full animate-spin" />
          Saving...
        </div>
      )}

      {activeBoard ? (
        <BoardDetailView board={activeBoard} api={api} readOnly={readOnly} />
      ) : (
        <BoardsHomeView api={api} readOnly={readOnly} />
      )}
    </>
  )
}

export function ToolContent() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <div className="w-6 h-6 border-2 border-sandstone/30 border-t-sandstone rounded-full animate-spin" />
        </div>
      }
    >
      <MoodBoardsContent />
    </Suspense>
  )
}
