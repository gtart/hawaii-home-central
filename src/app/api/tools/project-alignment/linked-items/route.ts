import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import type { AlignmentItem, AlignmentArtifactLink } from '@/data/alignment'

/**
 * GET /api/tools/project-alignment/linked-items?projectId=X&entityId=Y[&artifactType=Z]
 *
 * Scans all project_alignment collections for the given project,
 * finds items with artifact_links referencing the specified entityId.
 * Optional artifactType param narrows to a specific link type (e.g. 'selection', 'fix_item').
 * Returns a lightweight summary for badge display + deep-linking.
 */
export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const projectId = url.searchParams.get('projectId')
  const entityId = url.searchParams.get('entityId')
  const artifactType = url.searchParams.get('artifactType') // optional narrowing

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

  const linkedItems: {
    itemId: string
    itemNumber: number
    title: string
    status: string
    collectionId: string
    relationship: string
    entityLabel: string
  }[] = []

  for (const coll of collections) {
    const payload = coll.payload as Record<string, unknown> | null
    if (!payload || !Array.isArray(payload.items)) continue

    for (const item of payload.items as AlignmentItem[]) {
      if (!Array.isArray(item.artifact_links)) continue
      const matchingLink = item.artifact_links.find((link: AlignmentArtifactLink) => {
        if (link.entity_id !== entityId) return false
        if (artifactType && link.artifact_type !== artifactType) return false
        return true
      })
      if (matchingLink) {
        linkedItems.push({
          itemId: item.id,
          itemNumber: item.itemNumber,
          title: item.title,
          status: item.status,
          collectionId: coll.id,
          relationship: matchingLink.relationship,
          entityLabel: matchingLink.entity_label,
        })
      }
    }
  }

  return NextResponse.json({ items: linkedItems })
}
