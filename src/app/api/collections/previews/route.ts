import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { canListCollections } from '@/lib/collection-access'
import { ensureShape } from '@/data/project-summary'

/**
 * GET /api/collections/previews?projectId=X&toolKey=mood_boards&collectionIds=a,b,c
 * Returns lightweight image preview URLs and share metadata for collections.
 * When collectionIds is provided, returns previews for exactly those collections.
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

  const collectionIdsParam = url.searchParams.get('collectionIds')
  const requestedIds = collectionIdsParam ? collectionIdsParam.split(',').filter(Boolean) : null

  const where = {
    projectId,
    toolKey,
    archivedAt: null,
    ...(member?.role !== 'OWNER' ? { members: { some: { userId } } } : {}),
    ...(requestedIds ? { id: { in: requestedIds } } : {}),
  }

  const collections = await prisma.toolCollection.findMany({
    where,
    select: { id: true, payload: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  })

  // Batch-query share metadata for all collections
  const collIds = collections.map((c) => c.id)
  const [memberCounts, tokenCounts, inviteCounts] = collIds.length > 0
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
        prisma.toolCollectionInvite.groupBy({
          by: ['collectionId'] as const,
          where: { collectionId: { in: collIds }, status: 'PENDING' },
          _count: { id: true },
        }),
      ])
    : [[] as { collectionId: string; _count: { userId: number } }[],
       [] as { collectionId: string; _count: { id: number } }[],
       [] as { collectionId: string; _count: { id: number } }[]]
  const memberCountMap = new Map(memberCounts.map((m) => [m.collectionId, m._count.userId]))
  const tokenCountMap = new Map(tokenCounts.map((t) => [t.collectionId, t._count.id]))
  const inviteCountMap = new Map(inviteCounts.map((i) => [i.collectionId, i._count.id]))

  // Batch-fetch latest activity event per collection
  const recentEvents = collIds.length > 0
    ? await prisma.activityEvent.findMany({
        where: { collectionId: { in: collIds } },
        orderBy: { createdAt: 'desc' },
        take: Math.max(collIds.length * 3, 50),
        select: {
          collectionId: true, summaryText: true, entityLabel: true, detailText: true, action: true,
          createdAt: true, actor: { select: { name: true } },
        },
      })
    : []
  const latestEventMap = new Map<string, (typeof recentEvents)[0]>()
  for (const e of recentEvents) {
    if (e.collectionId && !latestEventMap.has(e.collectionId)) {
      latestEventMap.set(e.collectionId, e)
    }
  }

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

            }
          }
          statuses = counts
          // Set lastActivity fallback when no comments exist
          // Use deterministic urgency-based decision instead of iteration order
          if (!lastComment && decisionCount > 0) {
            // Collect all decisions flat for urgency ranking
            const allDecisions: FDDecision[] = []
            for (const room of rooms) {
              for (const d of room.decisions ?? []) {
                allDecisions.push(d)
              }
            }
            // Priority: not_started > deciding > other
            const notStarted = allDecisions.find((d) => {
              const s = d.status ?? 'deciding'
              return s === 'deciding' && (!d.options || d.options.length === 0)
            })
            const deciding = allDecisions.find((d) => {
              const s = d.status ?? 'deciding'
              return s === 'deciding' && d.options && d.options.length > 0
            })
            if (notStarted) {
              lastActivity = `Needs review: ${notStarted.title ?? 'Untitled'} (no options yet)`
            } else if (deciding) {
              lastActivity = `Still deciding: ${deciding.title ?? 'Untitled'}`
            } else {
              const any = allDecisions[0]
              if (any) lastActivity = `Updated: ${any.title ?? 'Untitled'}`
            }
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
      } catch {
        // ignore
      }
    }

    // For project_summary: extract plan scope, status, item counts, changes, budget
    let planScope: string | undefined
    let planStatus: string | undefined
    let includedCount = 0
    let notIncludedCount = 0
    let stillToDecideCount = 0
    let unresolvedOpenItemCount = 0
    let planItemCount = 0
    let changeCount = 0
    let activeChangeCount = 0
    let hasBudget = false
    let budgetAmount: string | undefined
    let documentCount = 0
    if (toolKey === 'project_summary') {
      try {
        const payload = ensureShape(coll.payload)
        planScope = payload.plan.scope.text || undefined
        planStatus = payload.plan.status
        includedCount = payload.plan.included.length
        notIncludedCount = payload.plan.not_included.length
        stillToDecideCount = payload.plan.still_to_decide.length
        unresolvedOpenItemCount = payload.plan.open_items.filter(i => i.status === 'open' || i.status === 'waiting').length
        planItemCount = includedCount + notIncludedCount + stillToDecideCount
        changeCount = payload.changes.length
        activeChangeCount = payload.changes.filter(c => c.status !== 'done' && c.status !== 'closed').length
        hasBudget = !!payload.budget.baseline_amount
        budgetAmount = payload.budget.baseline_amount || undefined
        documentCount = payload.documents.length
        itemCount = planItemCount || (planScope ? 1 : 0) || unresolvedOpenItemCount || documentCount || (hasBudget ? 1 : 0) || changeCount
      } catch {
        // ignore
      }
    }

    // Share metadata
    const collaboratorCount = memberCountMap.get(coll.id) ?? 0
    const shareLinkEnabled = (tokenCountMap.get(coll.id) ?? 0) > 0
    const shareLinkCount = tokenCountMap.get(coll.id) ?? 0
    const inviteCount = inviteCountMap.get(coll.id) ?? 0

    // Latest activity event
    const latestEvt = latestEventMap.get(coll.id)
    const lastEvent = latestEvt ? {
      summaryText: latestEvt.summaryText,
      entityLabel: latestEvt.entityLabel ?? null,
      detailText: latestEvt.detailText ?? null,
      actorName: latestEvt.actor?.name ?? null,
      createdAt: latestEvt.createdAt.toISOString(),
      action: latestEvt.action,
    } : undefined

    return {
      collectionId: coll.id, imageUrls, ideaCount, commentCount, statuses,
      lastComment, decisionCount, lastActivity, itemCount,
      collaboratorCount, shareLinkEnabled, shareLinkCount, inviteCount, lastEvent,
      planScope, planStatus, includedCount, notIncludedCount, stillToDecideCount, unresolvedOpenItemCount,
      planItemCount, changeCount, activeChangeCount, hasBudget, budgetAmount, documentCount,
    }
  })

  return NextResponse.json({ previews })
}
