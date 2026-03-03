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
    try {
      const payload = coll.payload as Record<string, unknown>

      // v2 collection payload: ideas are directly on payload.ideas[]
      const directIdeas = payload?.ideas as IdeaLike[] | undefined
      if (Array.isArray(directIdeas) && directIdeas.length > 0) {
        extractImagesFromIdeas(directIdeas, imageUrls, 4)
      }

      // v1 legacy payload: ideas nested under payload.boards[].ideas[]
      if (imageUrls.length === 0) {
        const boards = payload?.boards as Array<{
          isDefault?: boolean
          ideas?: IdeaLike[]
        }> | undefined

        if (boards && boards.length > 0) {
          const sorted = [...boards].sort((a, b) => {
            if (a.isDefault && !b.isDefault) return 1
            if (!a.isDefault && b.isDefault) return -1
            return 0
          })
          for (const board of sorted) {
            if (imageUrls.length >= 4) break
            extractImagesFromIdeas(board.ideas ?? [], imageUrls, 4)
          }
        }
      }
    } catch {
      // payload parsing failed — return empty
    }

    return { collectionId: coll.id, imageUrls }
  })

  return NextResponse.json({ previews })
}
