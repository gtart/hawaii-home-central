import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

/** GET /api/projects — list all projects where user is a member */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const memberships = await prisma.projectMember.findMany({
    where: { userId: session.user.id },
    include: {
      project: {
        select: { id: true, name: true, status: true, createdAt: true },
      },
    },
    orderBy: { project: { createdAt: 'asc' } },
  })

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { currentProjectId: true },
  })

  return NextResponse.json({
    projects: memberships.map((m) => ({
      id: m.project.id,
      name: m.project.name,
      status: m.project.status,
      role: m.role,
      createdAt: m.project.createdAt,
    })),
    currentProjectId: user.currentProjectId,
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
    project: { id: project.id, name: project.name, status: project.status, role: 'OWNER' },
  })
}
