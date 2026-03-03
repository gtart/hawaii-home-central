import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { canListCollections } from '@/lib/collection-access'

/**
 * GET /api/collections/previews?projectId=X&toolKey=mood_boards
 * Returns lightweight image preview URLs for mood board collections.
 */
export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const projectId = url.searchParams.get('projectId')
  const toolKey = url.searchParams.get('toolKey')

  if (!projectId || !toolKey) {
    return NextResponse.json({ error: 'projectId and toolKey required' }, { status: 400 })
  }

  const userId = session.user.id

  if (!(await canListCollections(userId, projectId))) {
    return NextResponse.json({ error: 'Not a member' }, { status: 403 })
  }

  // Check if OWNER for visibility
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  })

  const where = {
    projectId,
    toolKey,
    archivedAt: null,
    ...(member?.role !== 'OWNER' ? { members: { some: { userId } } } : {}),
  }

  const collections = await prisma.toolCollection.findMany({
    where,
    select: { id: true, payload: true },
    orderBy: { createdAt: 'asc' },
    take: 20,
  })

  type IdeaLike = {
    images?: Array<{ id: string; url: string; thumbnailUrl?: string }>
    heroImageId?: string | null
  }

  function extractImagesFromIdeas(ideas: IdeaLike[], imageUrls: string[], limit: number) {
    for (const idea of ideas) {
      if (imageUrls.length >= limit) break
      if (!idea.images || idea.images.length === 0) continue

      const heroId = idea.heroImageId
      const hero = heroId ? idea.images.find((img) => img.id === heroId) : null
      const img = hero ?? idea.images[0]
      if (img) {
        imageUrls.push(img.thumbnailUrl ?? img.url)
      }
    }
  }

  const previews = collections.map((coll) => {
    const imageUrls: string[] = []
    let ideaCount = 0
    let commentCount = 0
    try {
      const payload = coll.payload as Record<string, unknown>

      // v2 collection payload: ideas are directly on payload.ideas[]
      const directIdeas = payload?.ideas as IdeaLike[] | undefined
      if (Array.isArray(directIdeas) && directIdeas.length > 0) {
        extractImagesFromIdeas(directIdeas, imageUrls, 4)
        ideaCount = directIdeas.length
        const directComments = payload?.comments as unknown[] | undefined
        if (Array.isArray(directComments)) {
          commentCount = directComments.length
        }
      }

      // v1 legacy payload: ideas nested under payload.boards[].ideas[]
      if (ideaCount === 0) {
        const boards = payload?.boards as Array<{
          isDefault?: boolean
          ideas?: IdeaLike[]
          comments?: unknown[]
        }> | undefined

        if (boards && boards.length > 0) {
          const sorted = [...boards].sort((a, b) => {
            if (a.isDefault && !b.isDefault) return 1
            if (!a.isDefault && b.isDefault) return -1
            return 0
          })
          for (const board of sorted) {
            if (imageUrls.length < 4) {
              extractImagesFromIdeas(board.ideas ?? [], imageUrls, 4)
            }
            ideaCount += (board.ideas ?? []).length
            commentCount += (board.comments ?? []).length
          }
        }
      }
    } catch {
      // payload parsing failed — return zeros
    }

    // For finish_decisions: extract status counts from payload.rooms[].decisions[]
    let statuses: Record<string, number> | undefined
    if (toolKey === 'finish_decisions') {
      try {
        const payload = coll.payload as Record<string, unknown>
        const rooms = payload?.rooms as Array<{ decisions?: Array<{ status?: string }> }> | undefined
        if (Array.isArray(rooms)) {
          const counts: Record<string, number> = {}
          for (const room of rooms) {
            for (const d of room.decisions ?? []) {
              const s = d.status ?? 'deciding'
              counts[s] = (counts[s] ?? 0) + 1
            }
          }
          statuses = counts
        }
      } catch {
        // ignore
      }
    }

    return { collectionId: coll.id, imageUrls, ideaCount, commentCount, statuses }
  })

  return NextResponse.json({ previews })
}
