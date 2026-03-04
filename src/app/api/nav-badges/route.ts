import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { ensureCurrentProject } from '@/lib/project'
import { getDashboardData } from '@/server/dashboard'
import { cacheGet, cacheSet } from '@/server/cache/simpleTtlCache'
import type { DashboardResponse } from '@/server/dashboard'

export interface NavBadges {
  fixListOpen: number
  selectionsNeedDecisions: number
}

const BADGE_TTL_MS = 60_000

/** GET /api/nav-badges — lightweight counts for sidebar badges */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  try {
    const projectId = await ensureCurrentProject(userId)

    // Reuse cached dashboard data when available
    const dashCacheKey = `dashboard:${userId}:${projectId}`
    let data = cacheGet<DashboardResponse>(dashCacheKey)

    if (!data) {
      data = await getDashboardData(userId, projectId)
      cacheSet(dashCacheKey, data, BADGE_TTL_MS)
    }

    const badges: NavBadges = {
      fixListOpen: data.fixLists.reduce((s, l) => s + l.openCount, 0),
      selectionsNeedDecisions: data.selectionLists.reduce(
        (s, l) => s + l.notStartedCount + l.decidingCount,
        0,
      ),
    }

    return NextResponse.json(badges)
  } catch {
    return NextResponse.json({ fixListOpen: 0, selectionsNeedDecisions: 0 })
  }
}
