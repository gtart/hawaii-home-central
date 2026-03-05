import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { resolveCollectionAccess } from '@/lib/collection-access'
import { writeActivityEvents } from '@/server/activity/writeActivityEvent'

type Params = { params: Promise<{ id: string }> }

/**
 * GET /api/collections/[id]
 * Get collection payload + metadata. Requires VIEWER+.
 */
export async function GET(request: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const userId = session.user.id
  const access = await resolveCollectionAccess(userId, id)

  if (!access) {
    return NextResponse.json({ error: 'No access', code: 'NO_ACCESS' }, { status: 403 })
  }

  const collection = await prisma.toolCollection.findUnique({
    where: { id },
    select: {
      id: true,
      projectId: true,
      toolKey: true,
      title: true,
      payload: true,
      updatedAt: true,
      createdAt: true,
      archivedAt: true,
      members: {
        select: {
          userId: true,
          role: true,
          user: { select: { name: true, email: true, image: true } },
        },
      },
    },
  })

  if (!collection) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({
    ...collection,
    access,
  })
}

/**
 * PUT /api/collections/[id]
 * Update collection payload. Requires EDITOR+.
 */
export async function PUT(request: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const userId = session.user.id
  const access = await resolveCollectionAccess(userId, id)

  if (!access) {
    return NextResponse.json({ error: 'No access', code: 'NO_ACCESS' }, { status: 403 })
  }
  if (access === 'VIEWER') {
    return NextResponse.json({ error: 'View-only access', code: 'VIEW_ONLY' }, { status: 403 })
  }

  const body = await request.json()
  if (!body.payload || typeof body.payload !== 'object') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  // Optimistic concurrency
  if (body.revision) {
    const current = await prisma.toolCollection.findUnique({
      where: { id },
      select: { updatedAt: true },
    })
    if (current && current.updatedAt.toISOString() !== body.revision) {
      return NextResponse.json(
        { error: 'Conflict', code: 'CONFLICT', serverUpdatedAt: current.updatedAt },
        { status: 409 }
      )
    }
  }

  const updated = await prisma.toolCollection.update({
    where: { id },
    data: {
      payload: body.payload,
      updatedById: userId,
    },
    select: { updatedAt: true, projectId: true, toolKey: true },
  })

  // Write activity events (fire-and-forget, never blocks response)
  if (Array.isArray(body.events) && body.events.length > 0) {
    writeActivityEvents(
      body.events.map((e: { entityType?: string; entityId?: string; action?: string; summaryText?: string }) => ({
        projectId: updated.projectId,
        toolKey: updated.toolKey,
        collectionId: id,
        entityType: e.entityType,
        entityId: e.entityId,
        action: e.action || 'updated',
        summaryText: e.summaryText || 'Updated',
        actorUserId: userId,
      }))
    ).catch(() => {})
  }

  return NextResponse.json({ success: true, updatedAt: updated.updatedAt })
}

/**
 * PATCH /api/collections/[id]
 * Update metadata (title, archivedAt). Project OWNER only.
 */
export async function PATCH(request: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const userId = session.user.id
  const access = await resolveCollectionAccess(userId, id)

  if (access !== 'OWNER') {
    return NextResponse.json({ error: 'Only the home owner can manage collections' }, { status: 403 })
  }

  const body = await request.json()
  const data: Record<string, unknown> = {}

  if (typeof body.title === 'string' && body.title.trim()) {
    data.title = body.title.trim()
  }
  if (body.archivedAt !== undefined) {
    data.archivedAt = body.archivedAt ? new Date() : null
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const collection = await prisma.toolCollection.findUnique({
    where: { id },
    select: { projectId: true, toolKey: true, title: true },
  })

  const updated = await prisma.toolCollection.update({
    where: { id },
    data,
    select: { id: true, title: true, archivedAt: true, updatedAt: true },
  })

  // Log activity event when archiving
  if (body.archivedAt && collection) {
    writeActivityEvents([{
      projectId: collection.projectId,
      toolKey: collection.toolKey,
      collectionId: id,
      entityType: 'collection',
      entityId: id,
      action: 'archived',
      summaryText: `Archived "${collection.title}"`,
      actorUserId: userId,
    }]).catch(() => {})
  }

  return NextResponse.json({ collection: updated })
}

/**
 * DELETE /api/collections/[id]
 * Delete collection. Project OWNER only. Must be archived first.
 */
export async function DELETE(request: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const userId = session.user.id
  const access = await resolveCollectionAccess(userId, id)

  if (access !== 'OWNER') {
    return NextResponse.json({ error: 'Only the home owner can delete collections' }, { status: 403 })
  }

  const collection = await prisma.toolCollection.findUnique({
    where: { id },
    select: { archivedAt: true },
  })

  if (!collection?.archivedAt) {
    return NextResponse.json(
      { error: 'Collection must be archived before deletion' },
      { status: 400 }
    )
  }

  await prisma.toolCollection.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
