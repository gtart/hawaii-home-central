import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { ensureCurrentProject } from '@/lib/project'
import { requireToolAccess } from '@/lib/project-access'

const VALID_TOOL_KEYS = [
  'hold_points',
  'fair_bid_checklist',
  'responsibility_matrix',
  'finish_decisions',
  'before_you_sign',
  'before_you_sign_notes',
]

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ toolKey: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { toolKey } = await params
  if (!VALID_TOOL_KEYS.includes(toolKey)) {
    return NextResponse.json({ error: 'Invalid tool key' }, { status: 400 })
  }

  const userId = session.user.id
  const projectId = await ensureCurrentProject(userId)

  // Access check (OWNER = implicit EDIT; MEMBER needs explicit access)
  try {
    await requireToolAccess(userId, projectId, toolKey, 'VIEW')
  } catch {
    // During migration: if no ProjectMember row exists yet, allow access
    // (existing single-owner users may not have membership rows until backfill)
  }

  // Primary: read from ToolInstance (project-scoped)
  const instance = await prisma.toolInstance.findUnique({
    where: { projectId_toolKey: { projectId, toolKey } },
    select: { payload: true, updatedAt: true },
  })

  if (instance) {
    return NextResponse.json({
      payload: instance.payload,
      updatedAt: instance.updatedAt,
    })
  }

  // Fallback: migrate-on-touch from legacy ToolResult (user-scoped)
  const legacy = await prisma.toolResult.findUnique({
    where: { userId_toolKey: { userId, toolKey } },
    select: { payload: true, updatedAt: true },
  })

  if (legacy && legacy.payload && typeof legacy.payload === 'object') {
    // Seed ToolInstance from legacy data (upsert for race safety)
    await prisma.toolInstance.upsert({
      where: { projectId_toolKey: { projectId, toolKey } },
      create: { projectId, toolKey, payload: legacy.payload },
      update: {},  // Don't overwrite if another request won the race
    })

    return NextResponse.json({
      payload: legacy.payload,
      updatedAt: legacy.updatedAt,
    })
  }

  // No data anywhere
  return NextResponse.json({ payload: null, updatedAt: null })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ toolKey: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { toolKey } = await params
  if (!VALID_TOOL_KEYS.includes(toolKey)) {
    return NextResponse.json({ error: 'Invalid tool key' }, { status: 400 })
  }

  const body = await request.json()
  if (!body.payload || typeof body.payload !== 'object') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const userId = session.user.id
  const projectId = await ensureCurrentProject(userId)

  // Access check (OWNER = implicit EDIT; MEMBER needs explicit EDIT access)
  try {
    await requireToolAccess(userId, projectId, toolKey, 'EDIT')
  } catch (err: unknown) {
    const e = err as { status?: number; code?: string; message?: string }
    return NextResponse.json(
      { error: e.message ?? 'Forbidden', code: e.code ?? 'FORBIDDEN' },
      { status: e.status ?? 403 }
    )
  }

  // Write ONLY to ToolInstance (project-scoped)
  await prisma.toolInstance.upsert({
    where: { projectId_toolKey: { projectId, toolKey } },
    create: { projectId, toolKey, payload: body.payload },
    update: { payload: body.payload },
  })

  return NextResponse.json({ success: true })
}
