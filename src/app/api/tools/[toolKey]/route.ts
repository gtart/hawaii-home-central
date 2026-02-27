import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { ensureCurrentProject } from '@/lib/project'
import { resolveToolAccess } from '@/lib/project-access'
import { validateAndCoerceToolPayload } from '@/lib/tools/validateToolPayload'
import { resolveBoardAccess } from '@/data/mood-boards'
import type { Board, MoodBoardPayload } from '@/data/mood-boards'

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

  const userId = session.user.id

  // P0: Accept explicit projectId to guarantee correct project.
  // When projectId is provided, NEVER fall back to ensureCurrentProject.
  const url = new URL(request.url)
  const explicitProjectId = url.searchParams.get('projectId')
  const projectId = explicitProjectId || await ensureCurrentProject(userId)

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

  // P0: Accept explicit projectId to guarantee correct project on writes.
  const url = new URL(request.url)
  const explicitProjectId = url.searchParams.get('projectId')
  const projectId = explicitProjectId || await ensureCurrentProject(userId)

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

  // ---- Board-level ACL enforcement for mood_boards ----
  if (toolKey === 'mood_boards') {
    const userEmail = session.user.email?.toLowerCase() || ''
    const incoming = coercedPayload as unknown as MoodBoardPayload

    // Load existing payload to compare
    const existing = await prisma.toolInstance.findUnique({
      where: { projectId_toolKey: { projectId, toolKey } },
      select: { payload: true },
    })

    if (existing?.payload && typeof existing.payload === 'object') {
      const stored = existing.payload as unknown as MoodBoardPayload
      const storedMap = new Map<string, Board>()
      for (const b of (stored.boards || [])) storedMap.set(b.id, b)

      for (const incomingBoard of (incoming.boards || [])) {
        const storedBoard = storedMap.get(incomingBoard.id)
        if (!storedBoard) continue // new board — tool-level EDIT is sufficient

        // Quick check: has this board changed?
        if (JSON.stringify(storedBoard) === JSON.stringify(incomingBoard)) continue

        // Board was modified — check board-level access
        const boardAccess = resolveBoardAccess(storedBoard, userEmail, access)
        if (boardAccess !== 'edit') {
          return NextResponse.json(
            { error: 'No edit access to board', code: 'BOARD_VIEW_ONLY', boardId: incomingBoard.id },
            { status: 403 }
          )
        }
      }

      // Check for deleted boards — deletion is also a write
      const incomingIds = new Set((incoming.boards || []).map((b) => b.id))
      for (const storedBoard of (stored.boards || [])) {
        if (!incomingIds.has(storedBoard.id)) {
          const boardAccess = resolveBoardAccess(storedBoard, userEmail, access)
          if (boardAccess !== 'edit') {
            return NextResponse.json(
              { error: 'No edit access to board', code: 'BOARD_VIEW_ONLY', boardId: storedBoard.id },
              { status: 403 }
            )
          }
        }
      }
    }
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
