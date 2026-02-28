import type { Metadata } from 'next'
import { validateShareToken } from '@/lib/share-tokens'
import { TOOL_LABELS } from '@/lib/tool-registry'
import { PublicPunchlistView } from './PublicPunchlistView'
import { PublicMoodBoardView } from './PublicMoodBoardView'
import { PublicFinishDecisionsView } from './PublicFinishDecisionsView'
import { InvalidTokenPage } from './InvalidTokenPage'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { toolKey, token } = await params
  const toolLabel = TOOL_LABELS[toolKey] || 'Shared'

  // Look up token to get board name for descriptive metadata
  const record = await validateShareToken(token)
  const settings = record?.settings as Record<string, unknown> | undefined
  const boardName = typeof settings?.boardName === 'string' ? settings.boardName : null
  const projectName = record?.project?.name || null

  const title = boardName
    ? `${boardName} — ${toolLabel} (Read-only) — Hawaii Home Central`
    : `Shared ${toolLabel} — Hawaii Home Central`

  const description = boardName
    ? `Read-only ${toolLabel}: "${boardName}"${projectName ? ` from ${projectName}` : ''} on Hawaii Home Central.`
    : `A shared ${toolLabel} on Hawaii Home Central.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'Hawaii Home Central',
    },
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
    scope?: Record<string, unknown> | null
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

  if (toolKey === 'finish_decisions') {
    return (
      <PublicFinishDecisionsView
        payload={data.payload}
        projectName={data.projectName}
        includeNotes={data.includeNotes}
        includeComments={data.includeComments}
        includePhotos={data.includePhotos}
        scope={data.scope}
      />
    )
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
