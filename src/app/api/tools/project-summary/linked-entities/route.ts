import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import type { ProjectSummaryPayload, SummaryLink } from '@/data/project-summary'

interface LinkedEntry {
  entryId: string
  entryTitle: string
  entryType: 'change'
  status: string
  collectionId: string
}

/**
 * GET /api/tools/project-summary/linked-entities?projectId=X&entityId=Y
 *
 * Scans all Project Summary collections for the given project and
 * returns any changes that link to the specified entityId.
 * Response includes collectionId so the badge can build deep-link URLs.
 *
 * Read-only. Does NOT modify any data in Project Summary, Fix List, or Selections.
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

  // Verify project membership
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: session.user.id } },
  })
  if (!member) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    })
    if (project?.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not a project member' }, { status: 403 })
    }
  }

  // Scan all project_summary collections for this project
  const collections = await prisma.toolCollection.findMany({
    where: {
      projectId,
      toolKey: 'project_summary',
      archivedAt: null,
    },
    select: {
      id: true,
      payload: true,
    },
    orderBy: { updatedAt: 'desc' },
  })

  const items: LinkedEntry[] = []

  for (const coll of collections) {
    const payload = coll.payload as unknown as ProjectSummaryPayload | null
    if (!payload) continue

    // Scan changes for links matching entityId
    if (Array.isArray(payload.changes)) {
      for (const change of payload.changes) {
        if (Array.isArray(change.links)) {
          const match = change.links.find((l: SummaryLink) => l.entityId === entityId)
          if (match) {
            items.push({
              entryId: change.id,
              entryTitle: change.title || 'Untitled change',
              entryType: 'change',
              status: change.status || 'requested',
              collectionId: coll.id,
            })
          }
        }
      }
    }

  }

  return NextResponse.json({ items })
}
