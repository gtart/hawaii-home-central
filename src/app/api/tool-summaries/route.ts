import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { ensureCurrentProject } from '@/lib/project'

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
      const rooms = Array.isArray(payload?.rooms)
        ? (payload.rooms as Array<{ decisions?: unknown[] }>)
        : []
      const decisions = rooms.flatMap((r) =>
        Array.isArray(r.decisions) ? (r.decisions as Array<{ status?: string }>) : []
      )
      const total = decisions.length
      const finalized = decisions.filter((d) =>
        ['selected', 'ordered', 'done'].includes(d.status ?? '')
      ).length
      return { total, finalized }
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
