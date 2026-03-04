import { prisma } from '@/lib/prisma'
import type { FinishDecisionsPayloadV3, DecisionV3 } from '@/data/finish-decisions'
import type { PunchlistPayload, PunchlistItem } from '@/app/app/tools/punchlist/types'
import type { MoodBoardPayload } from '@/data/mood-boards'

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface SelectionListSummary {
  id: string
  title: string
  updatedAt: string
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
  openCount: number
  staleCount: number
  highPriorityCount: number
}

export interface MoodBoardSummary {
  id: string
  title: string
  updatedAt: string
  itemCount: number
  thumbnailUrl?: string
}

export interface BeforeYouSignSummary {
  id: string
  title: string
  updatedAt: string
  contractorCount: number
  selectedContractorCount: number
}

export interface DashboardResponse {
  selectionLists: SelectionListSummary[]
  fixLists: FixListSummary[]
  moodBoards: MoodBoardSummary[]
  beforeYouSign: BeforeYouSignSummary[]
  noNews: { isQuiet: boolean; lastActivityAt?: string }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000

function getOptionThumb(option: { images?: { thumbnailUrl?: string; url: string }[]; thumbnailUrl?: string; imageUrl?: string }): string | null {
  if (option.images?.length) {
    return option.images[0].thumbnailUrl || option.images[0].url
  }
  return option.thumbnailUrl || option.imageUrl || null
}

function summarizeSelectionList(id: string, title: string, updatedAt: Date, raw: unknown): SelectionListSummary {
  const payload = raw as FinishDecisionsPayloadV3 | null
  const rooms = payload?.rooms ?? []
  const decisions: DecisionV3[] = rooms.flatMap((r) => r.decisions ?? [])

  let notStartedCount = 0
  let decidingCount = 0
  let doneCount = 0
  let thumbnailUrl: string | null = null

  for (const d of decisions) {
    const status = d.status ?? 'deciding'
    if (status === 'deciding') {
      if ((d.options?.length ?? 0) === 0) notStartedCount++
      else decidingCount++
    } else {
      doneCount++
    }
    // Get thumbnail from first selected option
    if (!thumbnailUrl) {
      const sel = d.options?.find((o) => o.isSelected)
      if (sel) thumbnailUrl = getOptionThumb(sel)
    }
  }

  // Find last user comment (non-system) across all decisions
  let lastComment: SelectionListSummary['lastComment'] | undefined
  let lastCommentTime = 0
  for (const d of decisions) {
    for (const c of d.comments ?? []) {
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
    notStartedCount,
    decidingCount,
    doneCount,
    lastComment,
    thumbnailUrl: thumbnailUrl ?? undefined,
  }
}

function summarizeFixList(id: string, title: string, updatedAt: Date, raw: unknown): FixListSummary {
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

  return { id, title, updatedAt: updatedAt.toISOString(), openCount, staleCount, highPriorityCount }
}

function summarizeMoodBoard(id: string, title: string, updatedAt: Date, raw: unknown): MoodBoardSummary {
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

  return { id, title, updatedAt: updatedAt.toISOString(), itemCount, thumbnailUrl: thumbnailUrl ?? undefined }
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
    },
    orderBy: { updatedAt: 'desc' },
  })

  const selectionLists: SelectionListSummary[] = []
  const fixLists: FixListSummary[] = []
  const moodBoards: MoodBoardSummary[] = []
  const beforeYouSign: BeforeYouSignSummary[] = []

  for (const c of collections) {
    switch (c.toolKey) {
      case 'finish_decisions':
        selectionLists.push(summarizeSelectionList(c.id, c.title, c.updatedAt, c.payload))
        break
      case 'punchlist':
        fixLists.push(summarizeFixList(c.id, c.title, c.updatedAt, c.payload))
        break
      case 'mood_boards':
        moodBoards.push(summarizeMoodBoard(c.id, c.title, c.updatedAt, c.payload))
        break
      case 'before_you_sign': {
        const bysPayload = c.payload as { contractors?: unknown[]; selectedContractorIds?: unknown[] } | null
        const contractorCount = Array.isArray(bysPayload?.contractors) ? bysPayload.contractors.length : 0
        const selectedContractorCount = Array.isArray(bysPayload?.selectedContractorIds) ? bysPayload.selectedContractorIds.length : 0
        beforeYouSign.push({ id: c.id, title: c.title, updatedAt: c.updatedAt.toISOString(), contractorCount, selectedContractorCount })
        break
      }
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

  return {
    selectionLists,
    fixLists,
    moodBoards,
    beforeYouSign,
    noNews: { isQuiet, lastActivityAt },
  }
}
