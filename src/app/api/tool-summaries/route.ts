import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { ensureCurrentProject } from '@/lib/project'

/** GET /api/tool-summaries — returns updatedAt + updatedBy for all tools in current project */
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
      updatedAt: true,
      updatedBy: { select: { name: true, image: true } },
    },
  })

  return NextResponse.json({
    summaries: instances.map((i) => ({
      toolKey: i.toolKey,
      updatedAt: i.updatedAt,
      updatedBy: i.updatedBy,
    })),
  })
}
