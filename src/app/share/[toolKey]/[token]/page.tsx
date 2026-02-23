import type { Metadata } from 'next'
import { PublicPunchlistView } from './PublicPunchlistView'
import { InvalidTokenPage } from './InvalidTokenPage'

export const metadata: Metadata = {
  title: 'Shared Fix List — Hawaii Home Central',
  robots: 'noindex, nofollow',
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

  return (
    <PublicPunchlistView
      payload={data.payload}
      projectName={data.projectName}
      includeNotes={data.includeNotes}
      filters={data.filters ?? { locations: [], assignees: [] }}
    />
  )
}
