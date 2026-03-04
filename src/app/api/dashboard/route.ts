import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { ensureCurrentProject } from '@/lib/project'
import { getDashboardData } from '@/server/dashboard'

/** GET /api/dashboard — ToolCollection-based summaries for the /app homepage */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  try {
    const projectId = await ensureCurrentProject(userId)
    const data = await getDashboardData(userId, projectId)
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'No active projects' }, { status: 404 })
  }
}
