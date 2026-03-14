import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { resolveCollectionAccess } from '@/lib/collection-access'

type Params = { params: Promise<{ id: string }> }

interface EntityResult {
  id: string
  label: string
  status?: string
  collectionId: string
  collectionTitle: string
}

/**
 * GET /api/collections/[id]/entities
 *
 * Read-only endpoint that extracts entities from a collection's JSON payload.
 * Used by the cross-tool entity picker in Project Summary.
 *
 * For finish_decisions: returns decisions (selections)
 * For punchlist: returns items
 */
export async function GET(_request: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: collectionId } = await params

  // Check access
  const access = await resolveCollectionAccess(session.user.id, collectionId)
  if (!access) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const collection = await prisma.toolCollection.findUnique({
    where: { id: collectionId },
    select: { toolKey: true, title: true, payload: true },
  })

  if (!collection) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const payload = collection.payload as Record<string, unknown> | null
  if (!payload) {
    return NextResponse.json({ entities: [] })
  }

  const entities: EntityResult[] = []
  const collTitle = (collection.title as string) || collection.toolKey

  if (collection.toolKey === 'finish_decisions') {
    // V4 format: payload.selections[]
    if (Array.isArray(payload.selections)) {
      for (const sel of payload.selections as Record<string, unknown>[]) {
        if (typeof sel.id === 'string' && typeof sel.title === 'string') {
          entities.push({
            id: sel.id,
            label: sel.title,
            status: typeof sel.status === 'string' ? sel.status : undefined,
            collectionId,
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
                collectionId,
                collectionTitle: collTitle,
              })
            }
          }
        }
      }
    }
  } else if (collection.toolKey === 'punchlist') {
    // Punchlist: payload.items[]
    if (Array.isArray(payload.items)) {
      for (const item of payload.items as Record<string, unknown>[]) {
        if (typeof item.id === 'string' && typeof item.title === 'string') {
          entities.push({
            id: item.id,
            label: item.title,
            status: typeof item.status === 'string' ? item.status : undefined,
            collectionId,
            collectionTitle: collTitle,
          })
        }
      }
    }
  }

  return NextResponse.json({ entities })
}
