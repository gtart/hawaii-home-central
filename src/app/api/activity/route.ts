import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { ensureCurrentProject } from '@/lib/project'
import { prisma } from '@/lib/prisma'
import { cacheGet, cacheSet } from '@/server/cache/simpleTtlCache'

const ACTIVITY_TTL_MS = 30_000 // 30 seconds

/**
 * GET /api/activity?toolKey=punchlist&limit=20&cursor=2026-03-04T00:00:00Z
 * Returns paginated activity events for the current project.
 */
export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  let projectId: string
  try {
    projectId = await ensureCurrentProject(userId)
  } catch {
    return NextResponse.json({ error: 'No active projects' }, { status: 404 })
  }

  const url = new URL(request.url)
  const toolKey = url.searchParams.get('toolKey')
  const limitParam = parseInt(url.searchParams.get('limit') || '20', 10)
  const limit = Math.min(Math.max(limitParam, 1), 50)
  const cursor = url.searchParams.get('cursor')

  const cacheKey = `activity:${userId}:${projectId}:${toolKey || 'all'}:${cursor || 'first'}:${limit}`
  const cached = cacheGet<object>(cacheKey)
  if (cached) {
    return NextResponse.json(cached)
  }

  const events = await prisma.activityEvent.findMany({
    where: {
      projectId,
      ...(toolKey ? { toolKey } : {}),
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    select: {
      id: true,
      toolKey: true,
      collectionId: true,
      entityType: true,
      entityId: true,
      action: true,
      summaryText: true,
      actorUserId: true,
      createdAt: true,
      actor: { select: { name: true } },
    },
  })

  const hasMore = events.length > limit
  const items = hasMore ? events.slice(0, limit) : events
  const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null

  const responseBody = {
    events: items.map((e) => ({
      id: e.id,
      toolKey: e.toolKey,
      collectionId: e.collectionId,
      entityType: e.entityType,
      action: e.action,
      summaryText: e.summaryText,
      createdAt: e.createdAt.toISOString(),
      actorName: e.actor?.name ?? null,
    })),
    nextCursor,
  }

  cacheSet(cacheKey, responseBody, ACTIVITY_TTL_MS)
  return NextResponse.json(responseBody)
}
