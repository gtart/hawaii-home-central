import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { ensureCurrentProject } from '@/lib/project'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  let projectId: string
  try {
    projectId = await ensureCurrentProject(userId)
  } catch {
    return NextResponse.json({ error: 'No active project' }, { status: 404 })
  }

  const groups = await prisma.capturedItem.groupBy({
    by: ['suggestedToolKey'],
    where: { projectId, status: 'UNSORTED' },
    _count: { id: true },
  })

  let total = 0
  const byTool: Record<string, number> = {}

  for (const g of groups) {
    total += g._count.id
    const key = g.suggestedToolKey || 'untagged'
    byTool[key] = g._count.id
  }

  return NextResponse.json({ total, byTool })
}
