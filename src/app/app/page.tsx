import type { Metadata } from 'next'
import { auth } from '@/auth'
import { ensureCurrentProject } from '@/lib/project'
import { getDashboardData } from '@/server/dashboard'
import { cacheGet, cacheSet } from '@/server/cache/simpleTtlCache'
import type { DashboardResponse } from '@/server/dashboard'
import { DashboardPage } from '@/components/dashboard/DashboardPage'

export const metadata: Metadata = {
  title: 'Home — Hawaii Home Central',
}

const DASHBOARD_TTL_MS = 60_000

export default async function AppPage() {
  let prefetchedData: DashboardResponse | null = null

  try {
    const session = await auth()
    if (session?.user?.id) {
      const userId = session.user.id
      const projectId = await ensureCurrentProject(userId)
      const cacheKey = `dashboard:${userId}:${projectId}`

      prefetchedData = cacheGet<DashboardResponse>(cacheKey) ?? null
      if (!prefetchedData) {
        prefetchedData = await getDashboardData(userId, projectId)
        cacheSet(cacheKey, prefetchedData, DASHBOARD_TTL_MS)
      }
    }
  } catch {
    // Fall back to client-side fetch
  }

  return <DashboardPage prefetchedData={prefetchedData} />
}
