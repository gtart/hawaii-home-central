import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { canListCollections } from '@/lib/collection-access'
import { writeActivityEvents } from '@/server/activity/writeActivityEvent'

/**
 * GET /api/collections?projectId=X&toolKey=Y
 * List collections. OWNER sees all; MEMBER sees only those with membership.
 */
export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const projectId = url.searchParams.get('projectId')
  const toolKey = url.searchParams.get('toolKey')
  const includeArchived = url.searchParams.get('includeArchived') === 'true'

  if (!projectId || !toolKey) {
    return NextResponse.json({ error: 'projectId and toolKey required' }, { status: 400 })
  }

  const userId = session.user.id

  if (!(await canListCollections(userId, projectId))) {
    return NextResponse.json({ error: 'Not a member' }, { status: 403 })
  }

  // Check if OWNER
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  })

  const collectionSelect = {
    id: true,
    title: true,
    toolKey: true,
    createdAt: true,
    updatedAt: true,
    archivedAt: true,
    updatedBy: { select: { name: true } },
    members: {
      select: { userId: true, role: true, user: { select: { name: true, image: true } } },
    },
  } as const

  let collections
  if (member?.role === 'OWNER') {
    collections = await prisma.toolCollection.findMany({
      where: { projectId, toolKey, archivedAt: null },
      select: collectionSelect,
      orderBy: { createdAt: 'asc' },
    })
  } else {
    collections = await prisma.toolCollection.findMany({
      where: {
        projectId,
        toolKey,
        archivedAt: null,
        members: { some: { userId } },
      },
      select: collectionSelect,
      orderBy: { createdAt: 'asc' },
    })
  }

  // Optionally include archived collections
  let archived: typeof collections = []
  if (includeArchived && member?.role === 'OWNER') {
    archived = await prisma.toolCollection.findMany({
      where: { projectId, toolKey, archivedAt: { not: null } },
      select: collectionSelect,
      orderBy: { updatedAt: 'desc' },
    })
  }

  return NextResponse.json({ collections, archived })
}

/**
 * POST /api/collections
 * Create a new collection. Project OWNER only.
 */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { projectId, toolKey, title } = body

  if (!projectId || !toolKey || !title) {
    return NextResponse.json({ error: 'projectId, toolKey, and title required' }, { status: 400 })
  }

  const userId = session.user.id

  // Only project OWNER can create collections
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  })

  if (member?.role !== 'OWNER') {
    // Legacy repair
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    })
    if (project?.userId !== userId) {
      return NextResponse.json({ error: 'Only the home owner can create collections' }, { status: 403 })
    }
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId, userId } },
      create: { projectId, userId, role: 'OWNER' },
      update: {},
    })
  }

  const collection = await prisma.toolCollection.create({
    data: {
      projectId,
      toolKey,
      title: title.trim(),
      payload: {},
      createdByUserId: userId,
    },
  })

  // Fire-and-forget activity event
  writeActivityEvents([{
    projectId,
    toolKey,
    collectionId: collection.id,
    action: 'created',
    entityType: 'collection',
    summaryText: `Created "${title.trim()}"`,
    entityLabel: title.trim(),
    actorUserId: userId,
  }]).catch(() => {})

  return NextResponse.json({ collection }, { status: 201 })
}
