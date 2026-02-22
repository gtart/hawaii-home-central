import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { resolveCurrentProject } from '@/lib/project'

/** GET /api/projects — list all projects where user is a member */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  // Resolve current project (bootstraps on first sign-in, returns null if all deleted)
  const currentProjectId = await resolveCurrentProject(userId)

  const memberships = await prisma.projectMember.findMany({
    where: { userId },
    include: {
      project: {
        select: { id: true, name: true, status: true, createdAt: true, updatedAt: true },
      },
    },
    orderBy: { project: { createdAt: 'asc' } },
  })

  // For MEMBER roles, include which tools they have access to
  const memberProjectIds = memberships
    .filter((m) => m.role === 'MEMBER')
    .map((m) => m.project.id)

  const toolAccessRows = memberProjectIds.length > 0
    ? await prisma.projectToolAccess.findMany({
        where: { userId, projectId: { in: memberProjectIds } },
        select: { projectId: true, toolKey: true, level: true },
      })
    : []

  const toolAccessByProject = new Map<string, { toolKey: string; level: string }[]>()
  for (const row of toolAccessRows) {
    const existing = toolAccessByProject.get(row.projectId) || []
    existing.push({ toolKey: row.toolKey, level: row.level })
    toolAccessByProject.set(row.projectId, existing)
  }

  return NextResponse.json({
    projects: memberships.map((m) => ({
      id: m.project.id,
      name: m.project.name,
      status: m.project.status,
      role: m.role,
      createdAt: m.project.createdAt,
      updatedAt: m.project.updatedAt,
      toolAccess: m.role === 'MEMBER' ? (toolAccessByProject.get(m.project.id) || []) : undefined,
    })),
    currentProjectId,
  })
}

/** POST /api/projects — create a new project */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name || name.length > 100) {
    return NextResponse.json({ error: 'Name is required (max 100 chars)' }, { status: 400 })
  }

  const userId = session.user.id

  const project = await prisma.$transaction(async (tx) => {
    const p = await tx.project.create({
      data: { userId, name },
    })

    await tx.projectMember.create({
      data: { projectId: p.id, userId, role: 'OWNER' },
    })

    await tx.user.update({
      where: { id: userId },
      data: { currentProjectId: p.id },
    })

    return p
  })

  return NextResponse.json({
    project: { id: project.id, name: project.name, status: project.status, role: 'OWNER', createdAt: project.createdAt, updatedAt: project.updatedAt },
  })
}
