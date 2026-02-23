import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { ensureCurrentProject } from '@/lib/project'
import { resolveToolAccess } from '@/lib/project-access'
import {
  generateShareToken,
  getActiveShareTokens,
  getReportSettings,
} from '@/lib/share-tokens'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ toolKey: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { toolKey } = await params
  const userId = session.user.id
  const projectId = await ensureCurrentProject(userId)

  // Only owners can manage share tokens
  const access = await resolveToolAccess(userId, projectId, toolKey)
  if (access !== 'OWNER') {
    return NextResponse.json({ error: 'Owner access required' }, { status: 403 })
  }

  const tokens = await getActiveShareTokens(projectId, toolKey)

  return NextResponse.json({
    tokens: tokens.map((t) => ({
      id: t.id,
      token: t.token,
      includeNotes: (t.settings as Record<string, unknown>)?.includeNotes ?? false,
      locations: (t.settings as Record<string, unknown>)?.locations ?? [],
      assignees: (t.settings as Record<string, unknown>)?.assignees ?? [],
      createdAt: t.createdAt,
      expiresAt: t.expiresAt,
    })),
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
  const projectId = await ensureCurrentProject(userId)

  const access = await resolveToolAccess(userId, projectId, toolKey)
  if (access !== 'OWNER') {
    return NextResponse.json({ error: 'Owner access required' }, { status: 403 })
  }

  const body = await request.json()
  let includeNotes = body.includeNotes === true
  const locations: string[] = Array.isArray(body.locations) ? body.locations : []
  const assignees: string[] = Array.isArray(body.assignees) ? body.assignees : []

  // Check admin failsafe
  const reportSettings = await getReportSettings()
  if (reportSettings.hideNotesInPublicShare) {
    includeNotes = false
  }

  const token = generateShareToken()

  const record = await prisma.toolShareToken.create({
    data: {
      token,
      projectId,
      toolKey,
      createdBy: userId,
      settings: { includeNotes, locations, assignees },
    },
  })

  return NextResponse.json({
    id: record.id,
    token: record.token,
    includeNotes,
    createdAt: record.createdAt,
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
  const projectId = await ensureCurrentProject(userId)

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
