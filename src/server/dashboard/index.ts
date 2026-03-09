import { prisma } from '@/lib/prisma'
import { readSelectionsPayload, countSelectionStatuses } from '@/lib/selections-payload'
import type { PunchlistPayload, PunchlistItem } from '@/app/app/tools/punchlist/types'
import type { MoodBoardPayload } from '@/data/mood-boards'

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface SelectionListSummary {
  id: string
  title: string
  updatedAt: string
  updatedByName?: string
  notStartedCount: number
  decidingCount: number
  doneCount: number
  lastComment?: { text: string; updatedAt: string; authorName?: string }
  thumbnailUrl?: string
}

export interface FixListSummary {
  id: string
  title: string
  updatedAt: string
  updatedByName?: string
  openCount: number
  staleCount: number
  highPriorityCount: number
}

export interface MoodBoardSummary {
  id: string
  title: string
  updatedAt: string
  updatedByName?: string
  itemCount: number
  thumbnailUrl?: string
}

export interface BeforeYouSignSummary {
  id: string
  title: string
  updatedAt: string
  updatedByName?: string
  contractorCount: number
  selectedContractorCount: number
}

export type ToolKey = 'punchlist' | 'finish_decisions' | 'mood_boards' | 'before_you_sign'

export interface ToolShareMeta {
  collectionCount: number
  sharedCount: number
  linkEnabledCount: number
  pendingInvitesCount: number
  lastUpdatedAt: string | null
}

export interface RecentActivityExcerpt {
  summaryText: string
  entityLabel: string | null
  detailText: string | null
  action: string
  actorName: string | null
  createdAt: string
}

export interface DashboardResponse {
  selectionLists: SelectionListSummary[]
  fixLists: FixListSummary[]
  moodBoards: MoodBoardSummary[]
  beforeYouSign: BeforeYouSignSummary[]
  toolMeta: Record<ToolKey, ToolShareMeta>
  noNews: { isQuiet: boolean; lastActivityAt?: string }
  recentActivity: Partial<Record<ToolKey, RecentActivityExcerpt[]>>
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000

function summarizeSelectionList(id: string, title: string, updatedAt: Date, updatedByName: string | undefined, raw: unknown): SelectionListSummary {
  const { selections } = readSelectionsPayload(raw)
  const counts = countSelectionStatuses(selections)

  // Find first thumbnail from a selected option
  let thumbnailUrl: string | null = null
  for (const s of selections) {
    if (s.thumbnailUrl) { thumbnailUrl = s.thumbnailUrl; break }
  }

  // Find last user comment (non-system) across all selections
  let lastComment: SelectionListSummary['lastComment'] | undefined
  let lastCommentTime = 0
  for (const s of selections) {
    for (const c of s.comments) {
      if (!c.authorEmail) continue
      const t = new Date(c.createdAt).getTime()
      if (t > lastCommentTime) {
        lastCommentTime = t
        lastComment = { text: c.text, authorName: c.authorName, updatedAt: c.createdAt }
      }
    }
  }

  return {
    id,
    title,
    updatedAt: updatedAt.toISOString(),
    updatedByName,
    notStartedCount: counts.notStarted,
    decidingCount: counts.deciding,
    doneCount: counts.done,
    lastComment,
    thumbnailUrl: thumbnailUrl ?? undefined,
  }
}

function summarizeFixList(id: string, title: string, updatedAt: Date, updatedByName: string | undefined, raw: unknown): FixListSummary {
  const payload = raw as PunchlistPayload | null
  const items: PunchlistItem[] = payload?.items ?? []
  const now = Date.now()

  let openCount = 0
  let staleCount = 0
  let highPriorityCount = 0

  for (const item of items) {
    if (item.status === 'OPEN') {
      openCount++
      if (now - new Date(item.updatedAt).getTime() > FOURTEEN_DAYS_MS) staleCount++
    }
    if (item.priority === 'HIGH' && item.status !== 'DONE') highPriorityCount++
  }

  return { id, title, updatedAt: updatedAt.toISOString(), updatedByName, openCount, staleCount, highPriorityCount }
}

function summarizeMoodBoard(id: string, title: string, updatedAt: Date, updatedByName: string | undefined, raw: unknown): MoodBoardSummary {
  const payload = raw as MoodBoardPayload | null
  const boards = payload?.boards ?? []
  let itemCount = 0
  let thumbnailUrl: string | null = null

  for (const board of boards) {
    const ideas = board.ideas ?? []
    itemCount += ideas.length
    if (!thumbnailUrl && ideas.length > 0) {
      const firstImage = ideas[0].images?.[0]
      if (firstImage) thumbnailUrl = firstImage.thumbnailUrl || firstImage.url
    }
  }

  return { id, title, updatedAt: updatedAt.toISOString(), updatedByName, itemCount, thumbnailUrl: thumbnailUrl ?? undefined }
}

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

export async function getDashboardData(userId: string, projectId: string): Promise<DashboardResponse> {
  // Determine role
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  })

  const isOwner = member?.role === 'OWNER'

  // Query all non-archived collections for this project
  const collections = await prisma.toolCollection.findMany({
    where: {
      projectId,
      archivedAt: null,
      ...(isOwner ? {} : { members: { some: { userId } } }),
    },
    select: {
      id: true,
      toolKey: true,
      title: true,
      payload: true,
      updatedAt: true,
      updatedBy: { select: { name: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const selectionLists: SelectionListSummary[] = []
  const fixLists: FixListSummary[] = []
  const moodBoards: MoodBoardSummary[] = []
  const beforeYouSign: BeforeYouSignSummary[] = []

  for (const c of collections) {
    const byName = c.updatedBy?.name ?? undefined
    switch (c.toolKey) {
      case 'finish_decisions':
        selectionLists.push(summarizeSelectionList(c.id, c.title, c.updatedAt, byName, c.payload))
        break
      case 'punchlist':
        fixLists.push(summarizeFixList(c.id, c.title, c.updatedAt, byName, c.payload))
        break
      case 'mood_boards':
        moodBoards.push(summarizeMoodBoard(c.id, c.title, c.updatedAt, byName, c.payload))
        break
      case 'before_you_sign': {
        const bysPayload = c.payload as { contractors?: unknown[]; selectedContractorIds?: unknown[] } | null
        const contractorCount = Array.isArray(bysPayload?.contractors) ? bysPayload.contractors.length : 0
        const selectedContractorCount = Array.isArray(bysPayload?.selectedContractorIds) ? bysPayload.selectedContractorIds.length : 0
        beforeYouSign.push({ id: c.id, title: c.title, updatedAt: c.updatedAt.toISOString(), updatedByName: byName, contractorCount, selectedContractorCount })
        break
      }
    }
  }

  // Compute per-tool sharing metadata
  const collectionIds = collections.map((c) => c.id)
  const collectionToolMap = new Map(collections.map((c) => [c.id, c.toolKey]))

  const [memberCounts, tokenCounts, inviteCounts] = collectionIds.length > 0
    ? await Promise.all([
        prisma.toolCollectionMember.groupBy({
          by: ['collectionId'] as const,
          where: { collectionId: { in: collectionIds } },
          _count: { userId: true },
        }),
        prisma.toolCollectionShareToken.groupBy({
          by: ['collectionId'] as const,
          where: {
            collectionId: { in: collectionIds },
            revokedAt: null,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          _count: { id: true },
        }),
        prisma.toolCollectionInvite.groupBy({
          by: ['collectionId'] as const,
          where: { collectionId: { in: collectionIds }, status: 'PENDING' },
          _count: { id: true },
        }),
      ])
    : [[] as { collectionId: string; _count: { userId: number } }[],
       [] as { collectionId: string; _count: { id: number } }[],
       [] as { collectionId: string; _count: { id: number } }[]]

  const sharedIds = new Set(memberCounts.filter((m) => m._count.userId >= 2).map((m) => m.collectionId))
  const linkIds = new Set(tokenCounts.map((t) => t.collectionId))
  const pendingMap = new Map(inviteCounts.map((i) => [i.collectionId, i._count.id]))

  const collectionsByTool: Record<string, typeof collections> = {}
  for (const c of collections) {
    if (!collectionsByTool[c.toolKey]) collectionsByTool[c.toolKey] = []
    collectionsByTool[c.toolKey].push(c)
  }

  const TOOL_KEYS: ToolKey[] = ['punchlist', 'finish_decisions', 'mood_boards', 'before_you_sign']
  const toolMeta = {} as Record<ToolKey, ToolShareMeta>
  for (const tk of TOOL_KEYS) {
    const tc = collectionsByTool[tk] ?? []
    toolMeta[tk] = {
      collectionCount: tc.length,
      sharedCount: tc.filter((c) => sharedIds.has(c.id)).length,
      linkEnabledCount: tc.filter((c) => linkIds.has(c.id)).length,
      pendingInvitesCount: tc.reduce((s, c) => s + (pendingMap.get(c.id) ?? 0), 0),
      lastUpdatedAt: tc.length > 0 ? tc[0].updatedAt.toISOString() : null,
    }
  }

  // Compute noNews — prefer ActivityEvent for lastActivityAt
  const lastEvent = await prisma.activityEvent.findFirst({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  })

  const lastActivityAt = lastEvent
    ? lastEvent.createdAt.toISOString()
    : collections.length > 0
      ? collections[0].updatedAt.toISOString()
      : undefined

  const totalOpenFixes = fixLists.reduce((s, l) => s + l.openCount, 0)
  const totalHighPriorityFixes = fixLists.reduce((s, l) => s + l.highPriorityCount, 0)
  const totalStaleFixes = fixLists.reduce((s, l) => s + l.staleCount, 0)
  const hasActionableFixes = totalOpenFixes > 0 || totalHighPriorityFixes > 0 || totalStaleFixes > 0

  const totalNotStarted = selectionLists.reduce((s, l) => s + l.notStartedCount, 0)
  const totalDeciding = selectionLists.reduce((s, l) => s + l.decidingCount, 0)
  const hasActionableSelections = totalNotStarted > 0 || totalDeciding > 0

  const hasRecentActivity = !!lastActivityAt && (Date.now() - new Date(lastActivityAt).getTime() <= SEVEN_DAYS_MS)

  const isQuiet = !hasActionableFixes && !hasActionableSelections && !hasRecentActivity

  // Batch-fetch recent activity events per tool (2 per tool)
  const recentEvents = await prisma.activityEvent.findMany({
    where: { projectId, toolKey: { in: TOOL_KEYS } },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { toolKey: true, action: true, summaryText: true, entityLabel: true, detailText: true, createdAt: true, actor: { select: { name: true } } },
  })

  const recentActivity: Partial<Record<ToolKey, RecentActivityExcerpt[]>> = {}
  for (const e of recentEvents) {
    const tk = e.toolKey as ToolKey
    if (!recentActivity[tk]) recentActivity[tk] = []
    if (recentActivity[tk]!.length < 2) {
      recentActivity[tk]!.push({
        summaryText: e.summaryText,
        entityLabel: e.entityLabel ?? null,
        detailText: e.detailText ?? null,
        action: e.action,
        actorName: e.actor?.name ?? null,
        createdAt: e.createdAt.toISOString(),
      })
    }
  }

  return {
    selectionLists,
    fixLists,
    moodBoards,
    beforeYouSign,
    toolMeta,
    noNews: { isQuiet, lastActivityAt },
    recentActivity,
  }
}
