'use client'

import { Suspense } from 'react'
import { ToolPageHeader } from '@/components/app/ToolPageHeader'
import { InstanceSwitcher } from '@/components/app/InstanceSwitcher'
import { useMoodBoardCollectionState } from '../useMoodBoardState'
import { BoardDetailView } from '../components/BoardDetailView'

function mapAccessForHeader(a: string | null): 'OWNER' | 'EDIT' | 'VIEW' | null {
  return a as 'OWNER' | 'EDIT' | 'VIEW' | null
}

function Content({ collectionId }: { collectionId: string }) {
  const api = useMoodBoardCollectionState(collectionId)
  const { payload, isLoaded, noAccess, access, readOnly } = api

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
          You don&apos;t have access to this board.
        </p>
      </div>
    )
  }

  const board = payload.boards[0]
  if (!board) return null

  return (
    <>
      <ToolPageHeader
        toolKey="mood_boards"
        title="Mood Boards"
        description="Collect and organize inspiration from anywhere — then turn your favorites into real selections."
        accessLevel={mapAccessForHeader(access)}
        hasContent={board.ideas.length > 0}
        collectionId={collectionId}
        collectionName={board?.name}
        eyebrowLabel="Mood Board"
        backHref="/app/tools/mood-boards"
        backLabel="All Mood Boards"
        headerSlot={<InstanceSwitcher toolKey="mood_boards" currentCollectionId={collectionId} itemNoun="board" />}
      />

      <BoardDetailView
        board={board}
        api={api}
        readOnly={readOnly}
        toolAccess={access || 'VIEW'}
        collectionId={collectionId}
      />
    </>
  )
}

export function MoodBoardCollectionContent({ collectionId }: { collectionId: string }) {
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
          <Content collectionId={collectionId} />
        </Suspense>
      </div>
    </div>
  )
}
