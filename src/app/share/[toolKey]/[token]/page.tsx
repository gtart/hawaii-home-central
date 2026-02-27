import type { Metadata } from 'next'
import { PublicPunchlistView } from './PublicPunchlistView'
import { PublicMoodBoardView } from './PublicMoodBoardView'
import { InvalidTokenPage } from './InvalidTokenPage'

const TITLE_MAP: Record<string, string> = {
  punchlist: 'Shared Fix List — Hawaii Home Central',
  mood_boards: 'Shared Mood Board — Hawaii Home Central',
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { toolKey } = await params
  return {
    title: TITLE_MAP[toolKey] || 'Shared — Hawaii Home Central',
    robots: 'noindex, nofollow',
  }
}

interface Props {
  params: Promise<{ toolKey: string; token: string }>
}

export default async function SharePage({ params }: Props) {
  const { toolKey, token } = await params
  const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || 'https://www.hawaiihomecentral.com'

  let data: {
    payload: Record<string, unknown>
    projectName: string
    toolKey: string
    includeNotes: boolean
    includePhotos: boolean
    includeComments: boolean
    includeSourceUrl: boolean
    boardId?: string | null
    filters: { locations: string[]; assignees: string[] }
  } | null = null

  try {
    const res = await fetch(`${baseUrl}/api/share/${toolKey}/${token}`, {
      cache: 'no-store',
    })
    if (res.ok) {
      data = await res.json()
    }
  } catch {
    // will show invalid page
  }

  if (!data) {
    return <InvalidTokenPage />
  }

  if (toolKey === 'mood_boards') {
    return (
      <PublicMoodBoardView
        payload={data.payload}
        projectName={data.projectName}
        includePhotos={data.includePhotos}
        includeComments={data.includeComments}
      />
    )
  }

  return (
    <PublicPunchlistView
      payload={data.payload}
      projectName={data.projectName}
      includeNotes={data.includeNotes}
      filters={data.filters ?? { locations: [], assignees: [] }}
    />
  )
}
