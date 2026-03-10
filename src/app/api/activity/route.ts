import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { ensureCurrentProject } from '@/lib/project'
import { prisma } from '@/lib/prisma'
import { cacheGet, cacheSet } from '@/server/cache/simpleTtlCache'

const ACTIVITY_TTL_MS = 30_000 // 30 seconds

/**
 * GET /api/activity
 * Returns paginated activity events for the current project.
 *
 * Query params:
 *   toolKey        — filter by tool (e.g. "punchlist", "finish_decisions")
 *   collectionId   — filter by collection
 *   entityId       — filter by specific entity
 *   actorUserId    — filter by actor
 *   actionTypes    — comma-separated action types (e.g. "commented,selected,done")
 *   q              — text search on summaryText (case-insensitive)
 *   start          — ISO date, events >= this time
 *   end            — ISO date, events <= this time
 *   limit          — results per page (1-50, default 20)
 *   cursor         — pagination cursor: `${createdAtISO}__${id}` or legacy `${createdAtISO}`
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
  const collectionId = url.searchParams.get('collectionId')
  const entityId = url.searchParams.get('entityId')
  const actorUserId = url.searchParams.get('actorUserId')
  const actionTypesRaw = url.searchParams.get('actionTypes')
  const actionTypes = actionTypesRaw ? actionTypesRaw.split(',').filter(Boolean) : []
  const q = url.searchParams.get('q')
  const start = url.searchParams.get('start')
  const end = url.searchParams.get('end')
  const limitParam = parseInt(url.searchParams.get('limit') || '20', 10)
  const limit = Math.min(Math.max(limitParam, 1), 50)
  const cursor = url.searchParams.get('cursor')

  const cacheKey = `activity:${userId}:${projectId}:${toolKey || 'all'}:${collectionId || '-'}:${actionTypes.join('+') || '-'}:${q || '-'}:${start || '-'}:${end || '-'}:${cursor || 'first'}:${limit}`
  const cached = cacheGet<object>(cacheKey)
  if (cached) {
    return NextResponse.json(cached)
  }

  // Parse composite cursor: "createdAtISO__id" or legacy "createdAtISO"
  let cursorWhere = {}
  if (cursor) {
    const sepIdx = cursor.indexOf('__')
    if (sepIdx !== -1) {
      const cursorCreatedAt = new Date(cursor.slice(0, sepIdx))
      const cursorId = cursor.slice(sepIdx + 2)
      cursorWhere = {
        OR: [
          { createdAt: { lt: cursorCreatedAt } },
          { createdAt: cursorCreatedAt, id: { lt: cursorId } },
        ],
      }
    } else {
      cursorWhere = { createdAt: { lt: new Date(cursor) } }
    }
  }

  // Build time-range filter (merged with cursor's createdAt if both exist)
  const timeFilter: Record<string, Date> = {}
  if (start) timeFilter.gte = new Date(start)
  if (end) timeFilter.lte = new Date(end)

  const events = await prisma.activityEvent.findMany({
    where: {
      projectId,
      ...(toolKey ? { toolKey } : {}),
      ...(collectionId ? { collectionId } : {}),
      ...(entityId ? { entityId } : {}),
      ...(actorUserId ? { actorUserId } : {}),
      ...(actionTypes.length > 0 ? { action: { in: actionTypes } } : {}),
      ...(q ? { summaryText: { contains: q, mode: 'insensitive' as const } } : {}),
      ...(Object.keys(timeFilter).length > 0 ? { createdAt: timeFilter } : {}),
      ...cursorWhere,
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    select: {
      id: true,
      toolKey: true,
      collectionId: true,
      entityType: true,
      entityId: true,
      action: true,
      summaryText: true,
      entityLabel: true,
      detailText: true,
      actorUserId: true,
      metadata: true,
      createdAt: true,
      actor: { select: { name: true } },
    },
  })

  const hasMore = events.length > limit
  const items = hasMore ? events.slice(0, limit) : events
  const lastItem = items[items.length - 1]
  const nextCursor = hasMore && lastItem
    ? `${lastItem.createdAt.toISOString()}__${lastItem.id}`
    : null

  const responseBody = {
    events: items.map((e) => ({
      id: e.id,
      toolKey: e.toolKey,
      collectionId: e.collectionId,
      entityType: e.entityType,
      entityId: e.entityId,
      action: e.action,
      summaryText: e.summaryText,
      entityLabel: e.entityLabel ?? null,
      detailText: e.detailText ?? null,
      metadata: (e.metadata as Record<string, unknown>) ?? null,
      createdAt: e.createdAt.toISOString(),
      actorName: e.actor?.name ?? null,
    })),
    nextCursor,
  }

  cacheSet(cacheKey, responseBody, ACTIVITY_TTL_MS)
  return NextResponse.json(responseBody)
}
