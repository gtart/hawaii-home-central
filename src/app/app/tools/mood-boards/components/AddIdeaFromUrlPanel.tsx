'use client'

import { ImportFromUrlPanel } from '@/app/app/tools/finish-decisions/components/ImportFromUrlPanel'
import { genId } from '@/data/mood-boards'
import type { MoodBoardStateAPI } from '../useMoodBoardState'

interface Props {
  boardId: string
  api: MoodBoardStateAPI
  onDone: () => void
}

export function AddIdeaFromUrlPanel({ boardId, api, onDone }: Props) {
  return (
    <ImportFromUrlPanel
      mode="create-idea"
      onImport={(result) => {
        api.addIdea(boardId, {
          name: result.name || 'Imported idea',
          notes: result.notes,
          images: result.selectedImages.map((img) => ({
            id: genId('img'),
            url: img.url,
            thumbnailUrl: img.thumbnailUrl,
            label: img.label,
            sourceUrl: result.sourceUrl,
          })),
          heroImageId: null,
          sourceUrl: result.sourceUrl,
          sourceTitle: result.name || '',
          tags: [],
        })
        onDone()
      }}
      onCancel={onDone}
    />
  )
}
