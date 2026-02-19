import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { requireProjectMembership } from '@/lib/project-access'

/** PUT /api/projects/current — switch the user's current project */
export async function PUT(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const projectId = typeof body.projectId === 'string' ? body.projectId : ''
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
  }

  // Verify membership
  await requireProjectMembership(session.user.id, projectId).catch(() => {
    throw NextResponse.json({ error: 'Not a member of this project' }, { status: 403 })
  })

  await prisma.user.update({
    where: { id: session.user.id },
    data: { currentProjectId: projectId },
  })

  return NextResponse.json({ success: true })
}
