import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { ensureCurrentProject } from '@/lib/project'
import { getDashboardData } from '@/server/dashboard'
import { cacheGet, cacheSet } from '@/server/cache/simpleTtlCache'
import type { DashboardResponse } from '@/server/dashboard'

const DASHBOARD_TTL_MS = 60_000 // 60 seconds

/** GET /api/dashboard — ToolCollection-based summaries for the /app homepage */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  try {
    const projectId = await ensureCurrentProject(userId)
    const cacheKey = `dashboard:${userId}:${projectId}`

    const cached = cacheGet<DashboardResponse>(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const data = await getDashboardData(userId, projectId)
    cacheSet(cacheKey, data, DASHBOARD_TTL_MS)
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'No active projects' }, { status: 404 })
  }
}
