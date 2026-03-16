import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { ensureCurrentProject } from '@/lib/project'
import { readSelectionsPayload, countSelectionStatuses } from '@/lib/selections-payload'

type ToolStats = Record<string, unknown>

function computeStats(toolKey: string, raw: unknown): ToolStats {
  if (!raw) return {}
  try {
    const payload = (typeof raw === 'string' ? JSON.parse(raw) : raw) as Record<string, unknown>

    if (toolKey === 'before_you_sign') {
      const contractors = Array.isArray(payload?.contractors)
        ? (payload.contractors as Array<{ name?: string }>)
        : []
      return { contractorCount: contractors.length }
    }

    if (toolKey === 'finish_decisions') {
      const { selections } = readSelectionsPayload(payload)
      const counts = countSelectionStatuses(selections)
      return { total: counts.total, finalized: counts.done }
    }

    if (toolKey === 'punchlist') {
      const items = Array.isArray(payload?.items)
        ? (payload.items as Array<{ status?: string }>)
        : []
      const total = items.length
      const done = items.filter((i) => i.status === 'DONE').length
      return { total, done }
    }

    if (toolKey === 'mood_boards') {
      const boards = Array.isArray(payload?.boards)
        ? (payload.boards as Array<{ ideas?: unknown[] }>)
        : []
      const boardCount = boards.length
      const ideaCount = boards.reduce(
        (sum, b) => sum + (Array.isArray(b.ideas) ? b.ideas.length : 0),
        0
      )
      return { boardCount, ideaCount }
    }

    if (toolKey === 'project_summary') {
      const changes = Array.isArray(payload?.changes)
        ? (payload.changes as Array<{ status?: string }>)
        : []
      const documents = Array.isArray(payload?.documents) ? payload.documents : []
      const plan = payload?.plan as Record<string, unknown> | undefined
      const scopeItems = Array.isArray(plan?.scope) ? plan.scope : []
      const totalChanges = changes.length
      const activeChanges = changes.filter((c) => c.status !== 'not_needed' && c.status !== 'confirmed').length
      return { totalChanges, activeChanges, documents: (documents as unknown[]).length, scopeItems: (scopeItems as unknown[]).length }
    }

    return {}
  } catch {
    return {}
  }
}

/** GET /api/tool-summaries — returns updatedAt + updatedBy + per-tool stats for all tools in current project */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const projectId = await ensureCurrentProject(userId)

  const instances = await prisma.toolInstance.findMany({
    where: { projectId },
    select: {
      toolKey: true,
      payload: true,
      updatedAt: true,
      updatedBy: { select: { name: true, image: true } },
    },
  })

  return NextResponse.json({
    summaries: instances.map((i) => ({
      toolKey: i.toolKey,
      updatedAt: i.updatedAt,
      updatedBy: i.updatedBy,
      stats: computeStats(i.toolKey, i.payload),
    })),
  })
}
