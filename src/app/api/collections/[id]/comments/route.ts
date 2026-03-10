import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { resolveCollectionAccess } from '@/lib/collection-access'
import { resolveServerSelectionAccess, getRestrictedSelectionIds } from '@/lib/selection-access-server'
import type { SelectionV4 } from '@/data/finish-decisions'
import { writeActivityEvents } from '@/server/activity/writeActivityEvent'

type Params = { params: Promise<{ id: string }> }

const MAX_COMMENT_LENGTH = 400

/**
 * Check selection-level access for finish_decisions comments.
 * Returns a 403 response if the user is blocked, or null if access is allowed.
 */
async function enforceSelectionAccess(
  userId: string,
  userEmail: string,
  collectionId: string,
  targetType: string,
  targetId: string,
): Promise<Response | null> {
  // Only enforce for selections (targetType 'decision' = a selection in finish_decisions)
  if (targetType !== 'decision') return null

  const result = await resolveServerSelectionAccess(userId, userEmail, collectionId, targetId)

  // If result is null, collection doesn't exist or user has no workspace access
  // (already checked by caller), so skip. If toolKey isn't finish_decisions, skip.
  if (!result || result.toolKey !== 'finish_decisions') return null

  if (result.selectionAccess === null) {
    return NextResponse.json(
      { error: 'No access to this selection' },
      { status: 403 },
    )
  }

  return null
}

/**
 * GET /api/collections/[id]/comments
 * List comments for a collection. Optionally filter by targetType + targetId.
 * Requires VIEWER+. Enforces selection-level access for restricted selections.
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

  // Enforce selection-level access when reading comments for a specific selection
  if (targetType && targetId) {
    const blocked = await enforceSelectionAccess(
      session.user.id, session.user.email || '', id, targetType, targetId,
    )
    if (blocked) return blocked
  }

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

  // Filter out comments on restricted selections the user cannot access.
  // This covers the case where comments are fetched without targetType/targetId
  // filters (e.g. collection-level comment sidebar showing all comments).
  const hasDecisionComments = comments.some((c) => c.targetType === 'decision')
  if (hasDecisionComments && access !== 'OWNER') {
    const collection = await prisma.toolCollection.findUnique({
      where: { id },
      select: { toolKey: true, payload: true },
    })
    if (collection?.toolKey === 'finish_decisions') {
      const payload = collection.payload as Record<string, unknown> | null
      const selections = Array.isArray(payload?.selections)
        ? (payload!.selections as SelectionV4[])
        : []
      const blocked = getRestrictedSelectionIds(selections, session.user.email || '', access)
      if (blocked.size > 0) {
        const filtered = comments.filter(
          (c) => c.targetType !== 'decision' || !blocked.has(c.targetId)
        )
        return NextResponse.json({ comments: filtered })
      }
    }
  }

  return NextResponse.json({ comments })
}

/**
 * POST /api/collections/[id]/comments
 * Create a comment. Requires EDITOR+. Enforces selection-level access for restricted selections.
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

  // Enforce selection-level access for restricted selections
  const blocked = await enforceSelectionAccess(
    userId, session.user.email || '', id, targetType, targetId,
  )
  if (blocked) return blocked

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
 * Enforces selection-level access for restricted selections.
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
    select: { collectionId: true, authorUserId: true, targetType: true, targetId: true },
  })

  if (!comment || comment.collectionId !== id) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
  }

  // Enforce selection-level access for restricted selections
  const blocked = await enforceSelectionAccess(
    userId, session.user.email || '', id, comment.targetType, comment.targetId,
  )
  if (blocked) return blocked

  // Allow delete if user is EDITOR+ or the comment author
  const isAuthor = comment.authorUserId === userId
  const isEditorPlus = access === 'EDITOR' || access === 'OWNER'

  if (!isAuthor && !isEditorPlus) {
    return NextResponse.json({ error: 'Not authorized to delete this comment' }, { status: 403 })
  }

  await prisma.comment.delete({ where: { id: commentId } })

  return NextResponse.json({ success: true })
}
