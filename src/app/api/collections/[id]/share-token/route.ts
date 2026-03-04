import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { resolveCollectionAccess } from '@/lib/collection-access'
import { generateShareToken } from '@/lib/share-tokens'
import { writeActivityEvents } from '@/server/activity/writeActivityEvent'

type Params = { params: Promise<{ id: string }> }

/**
 * GET /api/collections/[id]/share-token
 * List active share tokens. Project OWNER only.
 */
export async function GET(request: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const access = await resolveCollectionAccess(session.user.id, id)

  if (access !== 'OWNER') {
    return NextResponse.json({ error: 'Only the home owner can manage share links' }, { status: 403 })
  }

  const tokens = await prisma.toolCollectionShareToken.findMany({
    where: {
      collectionId: id,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { createdAt: 'desc' },
  })

  // Flatten settings JSON into top-level fields to match UI expectations
  return NextResponse.json({
    tokens: tokens.map((t) => {
      const s = (t.settings ?? {}) as Record<string, unknown>
      return {
        id: t.id,
        token: t.token,
        includeNotes: s.includeNotes ?? false,
        includeComments: s.includeComments ?? false,
        includePhotos: s.includePhotos ?? false,
        includeSourceUrl: s.includeSourceUrl ?? false,
        locations: Array.isArray(s.locations) ? s.locations : [],
        assignees: Array.isArray(s.assignees) ? s.assignees : [],
        statuses: Array.isArray(s.statuses) ? s.statuses : [],
        boardId: s.boardId ?? null,
        boardName: s.boardName ?? null,
        scope: s.scope ?? null,
        createdAt: t.createdAt,
        expiresAt: t.expiresAt,
      }
    }),
  })
}

/**
 * POST /api/collections/[id]/share-token
 * Create a new share token. Project OWNER only.
 */
export async function POST(request: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const access = await resolveCollectionAccess(session.user.id, id)

  if (access !== 'OWNER') {
    return NextResponse.json({ error: 'Only the home owner can create share links' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const settings = body.settings ?? {}

  const token = generateShareToken()

  // Get collection toolKey + projectId for URL and activity event
  const collection = await prisma.toolCollection.findUnique({
    where: { id },
    select: { toolKey: true, projectId: true },
  })

  await prisma.toolCollectionShareToken.create({
    data: {
      token,
      collectionId: id,
      permissions: 'READ',
      settings,
      createdBy: session.user.id,
    },
  })

  const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || ''
  const url = `${baseUrl}/share/${collection?.toolKey}/${token}`

  // Fire-and-forget activity event
  if (collection?.projectId) {
    writeActivityEvents([{
      projectId: collection.projectId,
      toolKey: collection.toolKey,
      collectionId: id,
      action: 'shared',
      entityType: 'share_token',
      summaryText: 'Created a share link',
      actorUserId: session.user.id,
    }]).catch(() => {})
  }

  return NextResponse.json({ token, url }, { status: 201 })
}

/**
 * DELETE /api/collections/[id]/share-token
 * Revoke a share token. Body: { tokenId }. Project OWNER only.
 */
export async function DELETE(request: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const access = await resolveCollectionAccess(session.user.id, id)

  if (access !== 'OWNER') {
    return NextResponse.json({ error: 'Only the home owner can revoke share links' }, { status: 403 })
  }

  const body = await request.json()
  if (!body.tokenId) {
    return NextResponse.json({ error: 'tokenId required' }, { status: 400 })
  }

  await prisma.toolCollectionShareToken.updateMany({
    where: { id: body.tokenId, collectionId: id },
    data: { revokedAt: new Date() },
  })

  return NextResponse.json({ success: true })
}
