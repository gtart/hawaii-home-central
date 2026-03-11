import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import type { AlignmentItem } from '@/data/alignment'

/**
 * GET /api/tools/project-alignment/linked-items?projectId=X&entityId=Y
 *
 * Scans all project_alignment collections for the given project,
 * finds items with artifact_links referencing the specified entityId.
 * Returns a lightweight summary (count + item titles) for badge display.
 */
export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const projectId = url.searchParams.get('projectId')
  const entityId = url.searchParams.get('entityId')

  if (!projectId || !entityId) {
    return NextResponse.json({ error: 'projectId and entityId required' }, { status: 400 })
  }

  // Verify user is a project member
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: session.user.id } },
  })
  if (!member) {
    return NextResponse.json({ error: 'Not a member' }, { status: 403 })
  }

  // Fetch all alignment collections for this project (payload only)
  const collections = await prisma.toolCollection.findMany({
    where: { projectId, toolKey: 'project_alignment', archivedAt: null },
    select: { id: true, payload: true },
  })

  const linkedItems: { itemNumber: number; title: string; status: string; collectionId: string }[] = []

  for (const coll of collections) {
    const payload = coll.payload as Record<string, unknown> | null
    if (!payload || !Array.isArray(payload.items)) continue

    for (const item of payload.items as AlignmentItem[]) {
      if (!Array.isArray(item.artifact_links)) continue
      const hasLink = item.artifact_links.some((link) => link.entity_id === entityId)
      if (hasLink) {
        linkedItems.push({
          itemNumber: item.itemNumber,
          title: item.title,
          status: item.status,
          collectionId: coll.id,
        })
      }
    }
  }

  return NextResponse.json({ items: linkedItems })
}
