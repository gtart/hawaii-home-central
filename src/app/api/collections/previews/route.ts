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
    select: { id: true, payload: true, updatedAt: true },
    orderBy: { createdAt: 'asc' },
    take: 20,
  })

  // Batch-query share metadata for all collections
  const collIds = collections.map((c) => c.id)
  const [memberCounts, tokenCounts] = collIds.length > 0
    ? await Promise.all([
        prisma.toolCollectionMember.groupBy({
          by: ['collectionId'] as const,
          where: { collectionId: { in: collIds } },
          _count: { userId: true },
        }),
        prisma.toolCollectionShareToken.groupBy({
          by: ['collectionId'] as const,
          where: {
            collectionId: { in: collIds },
            revokedAt: null,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          _count: { id: true },
        }),
      ])
    : [[] as { collectionId: string; _count: { userId: number } }[],
       [] as { collectionId: string; _count: { id: number } }[]]
  const memberCountMap = new Map(memberCounts.map((m) => [m.collectionId, m._count.userId]))
  const tokenCountMap = new Map(tokenCounts.map((t) => [t.collectionId, t._count.id]))

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

    // For finish_decisions / punchlist: extract status counts, last comment, images, decision count
    let statuses: Record<string, number> | undefined
    let lastComment: { text: string; authorName: string; decisionTitle: string; createdAt: string } | undefined
    let decisionCount = 0
    let lastActivity: string | undefined
    let itemCount = 0
    if (toolKey === 'finish_decisions') {
      try {
        const payload = coll.payload as Record<string, unknown>
        type FDDecision = {
          title?: string
          status?: string
          options?: Array<{
            isSelected?: boolean
            images?: Array<{ id: string; url: string; thumbnailUrl?: string }>
            heroImageId?: string | null
            imageUrl?: string
            thumbnailUrl?: string
          }>
          comments?: Array<{ text?: string; authorName?: string; createdAt?: string }>
        }
        const rooms = payload?.rooms as Array<{ decisions?: FDDecision[] }> | undefined
        if (Array.isArray(rooms)) {
          const counts: Record<string, number> = {}
          let latestCommentTime = 0
          let latestActivityTime = 0
          let latestActivityText = ''
          for (const room of rooms) {
            for (const d of room.decisions ?? []) {
              decisionCount++
              const s = d.status ?? 'deciding'
              // Split "deciding" into "not_started" (no options) vs "deciding"
              if (s === 'deciding' && (!d.options || d.options.length === 0)) {
                counts['not_started'] = (counts['not_started'] ?? 0) + 1
              } else {
                counts[s] = (counts[s] ?? 0) + 1
              }

              // Collect images (up to 4) using the same cascade as getDecisionThumb
              if (imageUrls.length < 4 && d.options) {
                const sel = d.options.find((o) => o.isSelected)
                if (sel) {
                  const heroId = sel.heroImageId
                  const hero = heroId && sel.images ? sel.images.find((img) => img.id === heroId) : null
                  const url = hero?.thumbnailUrl || hero?.url || sel.images?.[0]?.thumbnailUrl || sel.images?.[0]?.url || sel.thumbnailUrl || sel.imageUrl
                  if (url && imageUrls.length < 4) imageUrls.push(url)
                } else {
                  // No selected option — use most recent option with an image
                  for (let i = (d.options.length ?? 0) - 1; i >= 0; i--) {
                    const opt = d.options[i]
                    const heroId = opt.heroImageId
                    const hero = heroId && opt.images ? opt.images.find((img) => img.id === heroId) : null
                    const url = hero?.thumbnailUrl || hero?.url || opt.images?.[0]?.thumbnailUrl || opt.images?.[0]?.url || opt.thumbnailUrl || opt.imageUrl
                    if (url) { if (imageUrls.length < 4) imageUrls.push(url); break }
                  }
                }
              }

              // Track latest comment
              if (d.comments) {
                for (const c of d.comments) {
                  const t = c.createdAt ? new Date(c.createdAt).getTime() : 0
                  if (t > latestCommentTime && c.text) {
                    latestCommentTime = t
                    lastComment = {
                      text: c.text,
                      authorName: c.authorName ?? 'Someone',
                      decisionTitle: d.title ?? 'Untitled',
                      createdAt: c.createdAt ?? '',
                    }
                  }
                }
              }

              // Track latest decision activity for fallback
              const dTitle = d.title ?? 'Untitled'
              if (d.options && d.options.length > 0) {
                const sel = d.options.find((o) => o.isSelected)
                if (sel && d.status && d.status !== 'deciding') {
                  // Use collection updatedAt as proxy since we don't have per-decision timestamps
                  const t = coll.updatedAt.getTime()
                  if (t > latestActivityTime) {
                    latestActivityTime = t
                    latestActivityText = `Marked ${d.status}: ${dTitle}`
                  }
                } else {
                  const t = coll.updatedAt.getTime()
                  if (t > latestActivityTime) {
                    latestActivityTime = t
                    latestActivityText = `Updated: ${dTitle}`
                  }
                }
              }
            }
          }
          statuses = counts
          // Set lastActivity fallback when no comments exist
          if (!lastComment && latestActivityText) {
            lastActivity = latestActivityText
          }
        }
      } catch {
        // ignore
      }
    }

    // For punchlist: extract open/high/stale counts + last activity
    if (toolKey === 'punchlist') {
      try {
        const payload = coll.payload as Record<string, unknown>
        type PLItem = {
          id?: string
          title?: string
          status?: string
          priority?: string
          updatedAt?: string
          comments?: Array<{ text?: string; authorName?: string; createdAt?: string }>
        }
        const items = (payload?.items ?? []) as PLItem[]
        const now = Date.now()
        const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000
        const counts: Record<string, number> = { open: 0, high: 0, stale: 0 }
        itemCount = items.length

        let latestTime = 0
        let latestText = ''

        for (const item of items) {
          if (item.status === 'OPEN') {
            counts.open++
            if (item.updatedAt && now - new Date(item.updatedAt).getTime() > FOURTEEN_DAYS) {
              counts.stale++
            }
          }
          if (item.priority === 'HIGH' && item.status !== 'DONE') counts.high++

          // Track latest comment or item update for lastActivity
          if (item.comments) {
            for (const c of item.comments) {
              const t = c.createdAt ? new Date(c.createdAt).getTime() : 0
              if (t > latestTime && c.text) {
                latestTime = t
                latestText = `${c.authorName?.split(' ')[0] ?? 'Someone'}: "${c.text.length > 60 ? c.text.slice(0, 60) + '...' : c.text}"`
              }
            }
          }
          // Fallback: use item title + update time
          if (item.updatedAt) {
            const t = new Date(item.updatedAt).getTime()
            if (t > latestTime) {
              latestTime = t
              latestText = `Updated: ${item.title ?? 'Untitled'}`
            }
          }
        }

        statuses = counts
        lastActivity = latestText || undefined
        decisionCount = itemCount // reuse field for total item count
      } catch {
        // ignore
      }
    }

    // Share metadata
    const collaboratorCount = memberCountMap.get(coll.id) ?? 0
    const shareLinkEnabled = (tokenCountMap.get(coll.id) ?? 0) > 0

    return {
      collectionId: coll.id, imageUrls, ideaCount, commentCount, statuses,
      lastComment, decisionCount, lastActivity, itemCount,
      collaboratorCount, shareLinkEnabled,
    }
  })

  return NextResponse.json({ previews })
}
