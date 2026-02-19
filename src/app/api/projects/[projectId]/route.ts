import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { requireProjectMembership } from '@/lib/project-access'

/** PATCH /api/projects/[projectId] — update name or status */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { projectId } = await params
  const member = await requireProjectMembership(session.user.id, projectId).catch(() => null)
  if (!member || member.role !== 'OWNER') {
    return NextResponse.json({ error: 'Owner access required' }, { status: 403 })
  }

  const body = await request.json()
  const data: Record<string, unknown> = {}

  if (typeof body.name === 'string' && body.name.trim()) {
    data.name = body.name.trim().slice(0, 100)
  }

  if (body.status === 'ACTIVE' || body.status === 'ARCHIVED' || body.status === 'TRASHED') {
    data.status = body.status
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const updated = await prisma.project.update({
    where: { id: projectId },
    data,
    select: { id: true, name: true, status: true },
  })

  return NextResponse.json({ project: updated })
}

/** DELETE /api/projects/[projectId] — permanently delete (must be TRASHED) */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { projectId } = await params
  const member = await requireProjectMembership(session.user.id, projectId).catch(() => null)
  if (!member || member.role !== 'OWNER') {
    return NextResponse.json({ error: 'Owner access required' }, { status: 403 })
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { status: true },
  })

  if (!project || project.status !== 'TRASHED') {
    return NextResponse.json(
      { error: 'Project must be in trash before permanent deletion' },
      { status: 400 }
    )
  }

  const userId = session.user.id

  // Cascade handles ToolInstance, ProjectMember, ProjectToolAccess, ProjectInvite
  await prisma.project.delete({ where: { id: projectId } })

  // If this was the user's current project, switch to another active project
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentProjectId: true },
  })

  if (user?.currentProjectId === projectId) {
    const nextProject = await prisma.projectMember.findFirst({
      where: { userId, project: { status: 'ACTIVE' } },
      select: { projectId: true },
      orderBy: { project: { createdAt: 'asc' } },
    })

    await prisma.user.update({
      where: { id: userId },
      data: { currentProjectId: nextProject?.projectId ?? null },
    })
  }

  return NextResponse.json({ success: true })
}
