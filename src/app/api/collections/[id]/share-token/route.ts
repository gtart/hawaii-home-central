import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { resolveCollectionAccess } from '@/lib/collection-access'
import { generateShareToken } from '@/lib/share-tokens'

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

  return NextResponse.json({ tokens })
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

  // Get collection toolKey for URL
  const collection = await prisma.toolCollection.findUnique({
    where: { id },
    select: { toolKey: true },
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
