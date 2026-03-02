import { NextResponse } from 'next/server'
import { validateCollectionShareToken } from '@/lib/collection-access'

type Params = { params: Promise<{ token: string }> }

/**
 * GET /api/share/c/[token]
 * Public share resolution — no auth required.
 * Returns sanitized collection payload.
 */
export async function GET(request: Request, { params }: Params) {
  const { token } = await params

  const record = await validateCollectionShareToken(token)
  if (!record) {
    return NextResponse.json({ error: 'Invalid or expired share link' }, { status: 404 })
  }

  const settings = record.settings as Record<string, unknown> | null

  return NextResponse.json({
    payload: record.collection.payload,
    toolKey: record.collection.toolKey,
    collectionId: record.collection.id,
    title: record.collection.title,
    projectName: record.collection.project.name,
    settings: settings ?? {},
  })
}
