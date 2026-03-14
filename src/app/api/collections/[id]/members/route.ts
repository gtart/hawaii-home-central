import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { resolveCollectionAccess } from '@/lib/collection-access'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/collections/[id]/members
 * Returns lightweight list of users who have access to this collection.
 * Used by the @mention picker in comments.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: collectionId } = await params
  const access = await resolveCollectionAccess(session.user.id, collectionId)
  if (!access) {
    return NextResponse.json({ error: 'No access' }, { status: 403 })
  }

  // Get the collection's project to find the owner
  const collection = await prisma.toolCollection.findUnique({
    where: { id: collectionId },
    select: {
      projectId: true,
      project: {
        select: {
          userId: true,
          user: { select: { id: true, name: true, image: true } },
        },
      },
    },
  })
  if (!collection) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
  }

  // Get collection-level members
  const collMembers = await prisma.toolCollectionMember.findMany({
    where: { collectionId },
    select: {
      user: { select: { id: true, name: true, image: true } },
    },
  })

  // Combine owner + collection members, deduplicate by id
  const memberMap = new Map<string, { id: string; name: string | null; image: string | null }>()

  // Add project owner
  const owner = collection.project.user
  memberMap.set(owner.id, { id: owner.id, name: owner.name, image: owner.image })

  // Add collection members
  for (const cm of collMembers) {
    if (!memberMap.has(cm.user.id)) {
      memberMap.set(cm.user.id, { id: cm.user.id, name: cm.user.name, image: cm.user.image })
    }
  }

  return NextResponse.json({
    members: Array.from(memberMap.values()),
  })
}
