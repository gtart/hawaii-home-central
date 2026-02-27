import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { VALID_STAGE_IDS } from '@/lib/stage-tool-priority'
import { ensureCurrentProject } from '@/lib/project'

/** PUT /api/projects/stage — set the renovation stage on the current project */
export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const stage = typeof body.stage === 'string' ? body.stage : null

  if (!stage || !VALID_STAGE_IDS.includes(stage)) {
    return NextResponse.json(
      { error: `Invalid stage. Must be one of: ${VALID_STAGE_IDS.join(', ')}` },
      { status: 400 }
    )
  }

  const projectId = await ensureCurrentProject(session.user.id)

  await prisma.project.update({
    where: { id: projectId },
    data: { currentStage: stage },
  })

  return NextResponse.json({ success: true, stage })
}
