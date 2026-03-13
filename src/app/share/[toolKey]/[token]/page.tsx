import type { Metadata } from 'next'
import { validateShareToken } from '@/lib/share-tokens'
import { TOOL_LABELS } from '@/lib/tool-registry'
import { resolveShareToken, buildSanitizedShareResponse } from '@/lib/public-share'
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

  // Direct data access — avoids self-fetch anti-pattern that breaks when
  // API routes are unavailable (same approach as Stories/Guides pages).
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
    const resolution = await resolveShareToken(token, toolKey)
    if (!('error' in resolution)) {
      const result = await buildSanitizedShareResponse(resolution)
      if (!('error' in result)) {
        data = result.body
      }
    }
  } catch {
    // will show invalid page
  }

  if (!data) {
    return <InvalidTokenPage />
  }

  // Legacy PAT share links: show friendly deprecation notice
  if (toolKey === 'project_alignment') {
    return (
      <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="font-serif text-2xl text-cream mb-3">Link No Longer Available</h1>
          <p className="text-cream/50 text-sm leading-relaxed">
            This Project Alignment share link is no longer active.
            The tool has been replaced by <strong className="text-cream/70">Plan &amp; Changes</strong>.
            Please ask the project owner for an updated link.
          </p>
        </div>
      </div>
    )
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
