import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { resolveToolAccess } from '@/lib/project-access'
import {
  generateShareToken,
  getActiveShareTokens,
  getReportSettings,
} from '@/lib/share-tokens'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ toolKey: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { toolKey } = await params
  const userId = session.user.id
  const projectId = new URL(request.url).searchParams.get('projectId')
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
  }

  // Only owners can manage share tokens
  const access = await resolveToolAccess(userId, projectId, toolKey)
  if (access !== 'OWNER') {
    return NextResponse.json({ error: 'Owner access required' }, { status: 403 })
  }

  const tokens = await getActiveShareTokens(projectId, toolKey)

  return NextResponse.json({
    tokens: tokens.map((t) => {
      const s = t.settings as Record<string, unknown>
      return {
        id: t.id,
        token: t.token,
        includeNotes: s?.includeNotes ?? false,
        includeComments: s?.includeComments ?? false,
        includePhotos: s?.includePhotos ?? false,
        locations: s?.locations ?? [],
        assignees: s?.assignees ?? [],
        statuses: s?.statuses ?? [],
        boardId: s?.boardId ?? null,
        boardName: s?.boardName ?? null,
        createdAt: t.createdAt,
        expiresAt: t.expiresAt,
      }
    }),
  })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ toolKey: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { toolKey } = await params
  const userId = session.user.id
  const projectId = new URL(request.url).searchParams.get('projectId')
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
  }

  const access = await resolveToolAccess(userId, projectId, toolKey)
  if (access !== 'OWNER') {
    return NextResponse.json({ error: 'Owner access required' }, { status: 403 })
  }

  const body = await request.json()
  let includeNotes = body.includeNotes === true
  const includeComments = body.includeComments === true
  const includePhotos = body.includePhotos === true
  const locations: string[] = Array.isArray(body.locations) ? body.locations : []
  const assignees: string[] = Array.isArray(body.assignees) ? body.assignees : []
  const statuses: string[] = Array.isArray(body.statuses) ? body.statuses : []
  const boardId: string | undefined = typeof body.boardId === 'string' ? body.boardId : undefined
  const boardName: string | undefined = typeof body.boardName === 'string' ? body.boardName : undefined

  // Default expiration: 14 days from now
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)

  // Check admin failsafe
  const reportSettings = await getReportSettings()
  if (reportSettings.hideNotesInPublicShare) {
    includeNotes = false
  }

  const token = generateShareToken()

  const settingsObj: Record<string, unknown> = {
    includeNotes,
    includeComments,
    includePhotos,
    locations,
    assignees,
    statuses,
  }
  if (boardId) settingsObj.boardId = boardId
  if (boardName) settingsObj.boardName = boardName

  const record = await prisma.toolShareToken.create({
    data: {
      token,
      projectId,
      toolKey,
      createdBy: userId,
      expiresAt,
      settings: settingsObj as object,
    },
  })

  return NextResponse.json({
    id: record.id,
    token: record.token,
    includeNotes,
    includeComments,
    includePhotos,
    statuses,
    boardId,
    boardName,
    createdAt: record.createdAt,
    expiresAt: record.expiresAt,
  }, { status: 201 })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ toolKey: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { toolKey } = await params
  const userId = session.user.id
  const projectId = new URL(request.url).searchParams.get('projectId')
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
  }

  const access = await resolveToolAccess(userId, projectId, toolKey)
  if (access !== 'OWNER') {
    return NextResponse.json({ error: 'Owner access required' }, { status: 403 })
  }

  const body = await request.json()
  if (!body.tokenId) {
    return NextResponse.json({ error: 'tokenId required' }, { status: 400 })
  }

  // Verify token belongs to this project+tool
  const token = await prisma.toolShareToken.findFirst({
    where: { id: body.tokenId, projectId, toolKey },
  })

  if (!token) {
    return NextResponse.json({ error: 'Token not found' }, { status: 404 })
  }

  await prisma.toolShareToken.update({
    where: { id: body.tokenId },
    data: { revokedAt: new Date() },
  })

  return NextResponse.json({ success: true })
}
