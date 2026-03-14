import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

interface EntityResult {
  id: string
  label: string
  status?: string
  collectionId: string
  collectionTitle: string
}

/**
 * GET /api/tools/entities?projectId=...&toolKey=finish_decisions|punchlist
 *
 * Read-only endpoint that extracts entities from all collections of a given tool
 * for a project. Used by the cross-tool entity picker in Project Summary.
 */
export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  const toolKey = searchParams.get('toolKey')

  if (!projectId || !toolKey) {
    return NextResponse.json({ error: 'Missing projectId or toolKey' }, { status: 400 })
  }

  // Verify user has access to this project
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { userId: true },
  })
  if (!project) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: session.user.id } },
  })
  if (!member && project.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Find all collections for this tool in this project
  const collections = await prisma.toolCollection.findMany({
    where: { projectId, toolKey },
    select: { id: true, title: true, payload: true },
  })

  const entities: EntityResult[] = []

  for (const coll of collections) {
    const payload = coll.payload as Record<string, unknown> | null
    if (!payload) continue
    const collTitle = coll.title || toolKey

    if (toolKey === 'finish_decisions') {
      // V4 format: payload.selections[]
      if (Array.isArray(payload.selections)) {
        for (const sel of payload.selections as Record<string, unknown>[]) {
          if (typeof sel.id === 'string' && typeof sel.title === 'string') {
            entities.push({
              id: sel.id,
              label: sel.title,
              status: typeof sel.status === 'string' ? sel.status : undefined,
              collectionId: coll.id,
              collectionTitle: collTitle,
            })
          }
        }
      }

      // V3 format: payload.rooms[].decisions[]
      if (Array.isArray(payload.rooms)) {
        for (const room of payload.rooms as Record<string, unknown>[]) {
          if (Array.isArray(room.decisions)) {
            for (const dec of room.decisions as Record<string, unknown>[]) {
              if (typeof dec.id === 'string' && typeof dec.title === 'string') {
                entities.push({
                  id: dec.id,
                  label: `${dec.title}${typeof room.name === 'string' ? ` (${room.name})` : ''}`,
                  status: typeof dec.status === 'string' ? dec.status : undefined,
                  collectionId: coll.id,
                  collectionTitle: collTitle,
                })
              }
            }
          }
        }
      }
    } else if (toolKey === 'punchlist') {
      if (Array.isArray(payload.items)) {
        for (const item of payload.items as Record<string, unknown>[]) {
          if (typeof item.id === 'string' && typeof item.title === 'string') {
            entities.push({
              id: item.id,
              label: item.title,
              status: typeof item.status === 'string' ? item.status : undefined,
              collectionId: coll.id,
              collectionTitle: collTitle,
            })
          }
        }
      }
    }
  }

  return NextResponse.json({ entities })
}
