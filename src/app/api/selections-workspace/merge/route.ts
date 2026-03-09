import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import type { FinishDecisionsPayloadV4, SelectionV4 } from '@/data/finish-decisions'

/**
 * POST /api/selections-workspace/merge
 *
 * Merge multiple Selections collections into one workspace anchor.
 *
 * Body: { projectId, anchorCollectionId }
 *
 * Access: requires project OWNER.
 *
 * Behavior:
 * - Reads all active finish_decisions collections for the project
 * - Merges selections from source collections into the anchor
 * - Former collection titles become tags on merged selections
 * - Detects duplicate selection titles and renames them
 * - Reassigns comments, activity, share tokens, invites, members
 * - Archives source collections (does not hard-delete)
 * - Returns a verification summary
 */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  let body: { projectId: string; anchorCollectionId: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { projectId, anchorCollectionId } = body
  if (!projectId || !anchorCollectionId) {
    return NextResponse.json({ error: 'projectId and anchorCollectionId required' }, { status: 400 })
  }

  // Require project OWNER
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  })

  let isOwner = member?.role === 'OWNER'

  if (!isOwner) {
    // Legacy repair
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    })
    if (project?.userId === userId) {
      await prisma.projectMember.upsert({
        where: { projectId_userId: { projectId, userId } },
        create: { projectId, userId, role: 'OWNER' },
        update: {},
      })
      isOwner = true
    }
  }

  if (!isOwner) {
    return NextResponse.json({ error: 'Only the project owner can merge collections' }, { status: 403 })
  }

  // Load all active finish_decisions collections
  const collections = await prisma.toolCollection.findMany({
    where: {
      projectId,
      toolKey: 'finish_decisions',
      archivedAt: null,
    },
    select: {
      id: true,
      title: true,
      payload: true,
    },
  })

  const anchor = collections.find((c) => c.id === anchorCollectionId)
  if (!anchor) {
    return NextResponse.json({ error: 'Anchor collection not found' }, { status: 404 })
  }

  const sources = collections.filter((c) => c.id !== anchorCollectionId)
  if (sources.length === 0) {
    return NextResponse.json({ error: 'No other collections to merge' }, { status: 400 })
  }

  // Parse anchor payload
  const anchorPayload = (anchor.payload as Record<string, unknown>) || { version: 4, selections: [] }
  const anchorSelections: SelectionV4[] = Array.isArray((anchorPayload as any).selections)
    ? [...(anchorPayload as any).selections]
    : []

  // Build set of existing titles for collision detection
  const existingTitles = new Set(anchorSelections.map((s) => s.title.toLowerCase()))
  let totalMerged = 0
  let duplicatesFound = 0
  const duplicateResolutions: string[] = []

  // Merge selections from each source
  for (const source of sources) {
    const payload = (source.payload as Record<string, unknown>) || { version: 4, selections: [] }
    const sourceSelections: SelectionV4[] = Array.isArray((payload as any).selections)
      ? (payload as any).selections
      : []

    for (const sel of sourceSelections) {
      // Add source collection title as a tag if not already present
      const sourceTag = source.title.trim()
      const tags = [...(sel.tags || [])]
      if (sourceTag && !tags.includes(sourceTag)) {
        tags.push(sourceTag)
      }

      // Check for title collision
      let title = sel.title
      if (existingTitles.has(title.toLowerCase())) {
        duplicatesFound++
        const newTitle = `${title} (from ${sourceTag || 'merged'})`
        duplicateResolutions.push(`"${title}" → "${newTitle}"`)
        title = newTitle
      }
      existingTitles.add(title.toLowerCase())

      anchorSelections.push({
        ...sel,
        title,
        tags,
      })
      totalMerged++
    }
  }

  // Union ownedKitIds and appliedKitIds across anchor + all sources
  const mergedOwnedKitIds = Array.from(new Set([
    ...((anchorPayload as any).ownedKitIds || []),
    ...sources.flatMap((s) => ((s.payload as any)?.ownedKitIds || [])),
  ]))
  const mergedAppliedKitIds = Array.from(new Set([
    ...((anchorPayload as any).appliedKitIds || []),
    ...sources.flatMap((s) => ((s.payload as any)?.appliedKitIds || [])),
  ]))

  // Save merged payload to anchor
  const mergedPayload: FinishDecisionsPayloadV4 = {
    version: 4,
    selections: anchorSelections,
    ownedKitIds: mergedOwnedKitIds.length > 0 ? mergedOwnedKitIds : undefined,
    appliedKitIds: mergedAppliedKitIds.length > 0 ? mergedAppliedKitIds : undefined,
  }

  const sourceIds = sources.map((s) => s.id)
  const now = new Date()

  // Reassign comments
  const commentResult = await prisma.comment.updateMany({
    where: {
      collectionId: { in: sourceIds },
      toolKey: 'finish_decisions',
    },
    data: { collectionId: anchorCollectionId },
  })

  // Reassign activity events
  const activityResult = await prisma.activityEvent.updateMany({
    where: {
      collectionId: { in: sourceIds },
      toolKey: 'finish_decisions',
    },
    data: { collectionId: anchorCollectionId },
  })

  // Migrate share tokens
  const shareTokenResult = await prisma.toolCollectionShareToken.updateMany({
    where: { collectionId: { in: sourceIds } },
    data: { collectionId: anchorCollectionId },
  })

  // Migrate invites (pending only)
  const inviteResult = await prisma.toolCollectionInvite.updateMany({
    where: {
      collectionId: { in: sourceIds },
      status: 'PENDING',
    },
    data: { collectionId: anchorCollectionId },
  })

  // Migrate members — prefer strongest role when same user exists in multiple collections
  const ROLE_STRENGTH: Record<string, number> = { OWNER: 3, EDITOR: 2, VIEWER: 1 }

  const existingMembers = await prisma.toolCollectionMember.findMany({
    where: { collectionId: anchorCollectionId },
    select: { userId: true, role: true },
  })
  const existingMemberMap = new Map<string, string>(existingMembers.map((m) => [m.userId, m.role]))

  const sourceMembers = await prisma.toolCollectionMember.findMany({
    where: { collectionId: { in: sourceIds } },
  })

  // Determine strongest role per user across all sources
  const bestSourceRole = new Map<string, string>()
  for (const sm of sourceMembers) {
    const current = bestSourceRole.get(sm.userId)
    if (!current || (ROLE_STRENGTH[sm.role] || 0) > (ROLE_STRENGTH[current] || 0)) {
      bestSourceRole.set(sm.userId, sm.role)
    }
  }

  let membersMigrated = 0
  for (const [uid, sourceRole] of bestSourceRole) {
    const existingRole = existingMemberMap.get(uid)
    if (!existingRole) {
      // New member — create
      try {
        await prisma.toolCollectionMember.create({
          data: {
            collectionId: anchorCollectionId,
            userId: uid,
            role: sourceRole as any,
          },
        })
        membersMigrated++
        existingMemberMap.set(uid, sourceRole)
      } catch {
        // Unique constraint race — skip
      }
    } else if ((ROLE_STRENGTH[sourceRole] || 0) > (ROLE_STRENGTH[existingRole] || 0)) {
      // Existing member with weaker role — upgrade
      try {
        await prisma.toolCollectionMember.updateMany({
          where: {
            collectionId: anchorCollectionId,
            userId: uid,
          },
          data: { role: sourceRole as any },
        })
        membersMigrated++
      } catch {
        // Race — skip
      }
    }
  }

  // Delete source members (they've been migrated or already existed)
  await prisma.toolCollectionMember.deleteMany({
    where: { collectionId: { in: sourceIds } },
  })

  // Update anchor payload
  await prisma.toolCollection.update({
    where: { id: anchorCollectionId },
    data: {
      payload: mergedPayload as any,
      updatedAt: now,
      updatedById: userId,
    },
  })

  // Archive source collections
  await prisma.toolCollection.updateMany({
    where: { id: { in: sourceIds } },
    data: { archivedAt: now },
  })

  // Log merge activity
  try {
    await prisma.activityEvent.create({
      data: {
        projectId,
        toolKey: 'finish_decisions',
        collectionId: anchorCollectionId,
        entityType: 'workspace',
        action: 'merged',
        summaryText: `Merged ${sources.length} collection${sources.length !== 1 ? 's' : ''} into workspace (${totalMerged} selections)`,
        actorUserId: userId,
      },
    })
  } catch {
    // Non-critical
  }

  const summary = {
    anchorId: anchorCollectionId,
    anchorTitle: anchor.title,
    sourcesMerged: sources.map((s) => ({ id: s.id, title: s.title })),
    selectionsMerged: totalMerged,
    duplicatesFound,
    duplicateResolutions,
    commentsReassigned: commentResult.count,
    activityReassigned: activityResult.count,
    shareTokensMigrated: shareTokenResult.count,
    invitesMigrated: inviteResult.count,
    membersMigrated,
    sourcesArchived: sources.length,
  }

  return NextResponse.json(summary)
}
