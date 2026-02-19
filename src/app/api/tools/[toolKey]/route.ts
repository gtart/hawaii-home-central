import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { ensureCurrentProject } from '@/lib/project'
import { getToolAccessLevel, type ToolAccessLevel } from '@/lib/project-access'

const VALID_TOOL_KEYS = [
  'hold_points',
  'fair_bid_checklist',
  'responsibility_matrix',
  'finish_decisions',
  'before_you_sign',
  'before_you_sign_notes',
]

/**
 * Resolve access level, with legacy repair for owners missing ProjectMember rows.
 * Returns the access level or null if no access.
 */
async function resolveAccess(
  userId: string,
  projectId: string,
  toolKey: string
): Promise<ToolAccessLevel | null> {
  const level = await getToolAccessLevel(userId, projectId, toolKey)
  if (level) return level

  // Legacy repair: if user is the project creator but has no ProjectMember row
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { userId: true },
  })

  if (project?.userId === userId) {
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId, userId } },
      create: { projectId, userId, role: 'OWNER' },
      update: {},
    })
    return 'OWNER'
  }

  return null
}

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

  // Enforce access — no blanket bypass
  const access = await resolveAccess(userId, projectId, toolKey)
  if (!access) {
    return NextResponse.json(
      { error: 'No access to this tool', code: 'NO_ACCESS' },
      { status: 403 }
    )
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
      access,
    })
  }

  // Fallback: migrate-on-touch from legacy ToolResult (project-scoped)
  const legacy = await prisma.toolResult.findFirst({
    where: { userId, toolKey, projectId },
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
      access,
    })
  }

  // No data anywhere
  return NextResponse.json({ payload: null, updatedAt: null, access })
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

  // Enforce EDIT access
  const access = await resolveAccess(userId, projectId, toolKey)
  if (!access) {
    return NextResponse.json(
      { error: 'No access to this tool', code: 'NO_ACCESS' },
      { status: 403 }
    )
  }
  if (access === 'VIEW') {
    return NextResponse.json(
      { error: 'View-only access', code: 'VIEW_ONLY' },
      { status: 403 }
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
