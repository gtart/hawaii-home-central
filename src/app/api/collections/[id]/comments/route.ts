import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { resolveCollectionAccess } from '@/lib/collection-access'
import { writeActivityEvents } from '@/server/activity/writeActivityEvent'

type Params = { params: Promise<{ id: string }> }

const MAX_COMMENT_LENGTH = 400

/**
 * GET /api/collections/[id]/comments
 * List comments for a collection. Optionally filter by targetType + targetId.
 * Requires VIEWER+.
 */
export async function GET(request: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const access = await resolveCollectionAccess(session.user.id, id)
  if (!access) {
    return NextResponse.json({ error: 'No access' }, { status: 403 })
  }

  const url = new URL(request.url)
  const targetType = url.searchParams.get('targetType')
  const targetId = url.searchParams.get('targetId')

  const where: Record<string, unknown> = { collectionId: id }
  if (targetType) where.targetType = targetType
  if (targetId) where.targetId = targetId

  const comments = await prisma.comment.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      targetType: true,
      targetId: true,
      text: true,
      authorUserId: true,
      authorName: true,
      authorEmail: true,
      refEntityType: true,
      refEntityId: true,
      refEntityLabel: true,
      parentCommentId: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ comments })
}

/**
 * POST /api/collections/[id]/comments
 * Create a comment. Requires EDITOR+.
 */
export async function POST(request: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const userId = session.user.id
  const access = await resolveCollectionAccess(userId, id)

  if (!access) {
    return NextResponse.json({ error: 'No access' }, { status: 403 })
  }
  if (access === 'VIEWER') {
    return NextResponse.json({ error: 'View-only access' }, { status: 403 })
  }

  const body = await request.json()
  const { targetType, targetId, text, refEntityType, refEntityId, refEntityLabel, entityTitle } = body

  if (!targetType || !targetId || !text) {
    return NextResponse.json({ error: 'Missing required fields: targetType, targetId, text' }, { status: 400 })
  }

  if (typeof text !== 'string' || text.trim().length === 0) {
    return NextResponse.json({ error: 'Comment text cannot be empty' }, { status: 400 })
  }

  if (text.length > MAX_COMMENT_LENGTH) {
    return NextResponse.json({ error: `Comment exceeds ${MAX_COMMENT_LENGTH} characters` }, { status: 400 })
  }

  // Get collection metadata for activity event
  const collection = await prisma.toolCollection.findUnique({
    where: { id },
    select: { projectId: true, toolKey: true },
  })
  if (!collection) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
  }

  const comment = await prisma.comment.create({
    data: {
      collectionId: id,
      toolKey: collection.toolKey,
      targetType,
      targetId,
      text: text.trim(),
      authorUserId: userId,
      authorName: session.user.name || 'Unknown',
      authorEmail: session.user.email || '',
      refEntityType: refEntityType || null,
      refEntityId: refEntityId || null,
      refEntityLabel: refEntityLabel || null,
    },
    select: {
      id: true,
      targetType: true,
      targetId: true,
      text: true,
      authorUserId: true,
      authorName: true,
      authorEmail: true,
      refEntityType: true,
      refEntityId: true,
      refEntityLabel: true,
      parentCommentId: true,
      createdAt: true,
    },
  })

  // Fire-and-forget activity event
  const snippet = text.length > 60 ? text.slice(0, 59) + '…' : text
  writeActivityEvents([{
    projectId: collection.projectId,
    toolKey: collection.toolKey,
    collectionId: id,
    entityType: targetType,
    entityId: targetId,
    action: 'commented',
    summaryText: `Commented: "${snippet}"`,
    entityLabel: typeof entityTitle === 'string' ? entityTitle : undefined,
    detailText: snippet,
    actorUserId: userId,
  }]).catch(() => {})

  return NextResponse.json({ comment }, { status: 201 })
}

/**
 * DELETE /api/collections/[id]/comments
 * Delete a comment by commentId query param. Requires EDITOR+ or comment author.
 */
export async function DELETE(request: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const userId = session.user.id
  const access = await resolveCollectionAccess(userId, id)

  if (!access) {
    return NextResponse.json({ error: 'No access' }, { status: 403 })
  }

  const url = new URL(request.url)
  const commentId = url.searchParams.get('commentId')
  if (!commentId) {
    return NextResponse.json({ error: 'Missing commentId' }, { status: 400 })
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { collectionId: true, authorUserId: true },
  })

  if (!comment || comment.collectionId !== id) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
  }

  // Allow delete if user is EDITOR+ or the comment author
  const isAuthor = comment.authorUserId === userId
  const isEditorPlus = access === 'EDITOR' || access === 'OWNER'

  if (!isAuthor && !isEditorPlus) {
    return NextResponse.json({ error: 'Not authorized to delete this comment' }, { status: 403 })
  }

  await prisma.comment.delete({ where: { id: commentId } })

  return NextResponse.json({ success: true })
}
