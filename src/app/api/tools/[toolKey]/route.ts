import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { ensureCurrentProject } from '@/lib/project'
import { resolveToolAccess } from '@/lib/project-access'
import { validateAndCoerceToolPayload } from '@/lib/tools/validateToolPayload'

const VALID_TOOL_KEYS = [
  'hold_points',
  'fair_bid_checklist',
  'responsibility_matrix',
  'finish_decisions',
  'before_you_sign',
  'before_you_sign_notes',
  'punchlist',
  'mood_boards',
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

  // Enforce access — no blanket bypass
  const access = await resolveToolAccess(userId, projectId, toolKey)
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

  // Validate and coerce the payload for this tool
  const validation = validateAndCoerceToolPayload(toolKey, body.payload)
  if (!validation.valid) {
    console.warn(`[tools/${toolKey}] Payload validation failed: ${validation.reason}`)
    return NextResponse.json(
      { error: 'Invalid payload shape', code: 'INVALID_PAYLOAD', reason: validation.reason },
      { status: 400 }
    )
  }
  const coercedPayload = validation.payload

  const userId = session.user.id
  const projectId = await ensureCurrentProject(userId)

  // Enforce EDIT access
  const access = await resolveToolAccess(userId, projectId, toolKey)
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

  // Optimistic concurrency: reject stale writes when client sends revision
  if (body.revision) {
    const current = await prisma.toolInstance.findUnique({
      where: { projectId_toolKey: { projectId, toolKey } },
      select: { updatedAt: true },
    })
    if (current && current.updatedAt.toISOString() !== body.revision) {
      return NextResponse.json(
        { error: 'Conflict', code: 'CONFLICT', serverUpdatedAt: current.updatedAt },
        { status: 409 }
      )
    }
  }

  // Write ONLY to ToolInstance (project-scoped)
  const jsonPayload = coercedPayload as unknown as Record<string, never>
  const updated = await prisma.toolInstance.upsert({
    where: { projectId_toolKey: { projectId, toolKey } },
    create: { projectId, toolKey, payload: jsonPayload, updatedById: userId },
    update: { payload: jsonPayload, updatedById: userId },
    select: { updatedAt: true },
  })

  return NextResponse.json({ success: true, updatedAt: updated.updatedAt })
}
