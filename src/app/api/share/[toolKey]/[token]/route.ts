import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateShareToken, getReportSettings } from '@/lib/share-tokens'
import { toPublicItem } from '@/app/app/tools/punchlist/types'
import type { PunchlistItem } from '@/app/app/tools/punchlist/types'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ toolKey: string; token: string }> }
) {
  const { toolKey, token } = await params

  const record = await validateShareToken(token)
  if (!record || record.toolKey !== toolKey) {
    return NextResponse.json(
      { error: 'Invalid or expired link' },
      { status: 404 }
    )
  }

  // Load tool data
  const instance = await prisma.toolInstance.findUnique({
    where: {
      projectId_toolKey: {
        projectId: record.projectId,
        toolKey,
      },
    },
    select: { payload: true },
  })

  if (!instance) {
    return NextResponse.json(
      { error: 'No data found' },
      { status: 404 }
    )
  }

  // Determine settings from token
  const settings = record.settings as Record<string, unknown>
  let includeNotes = settings?.includeNotes === true
  const includeComments = settings?.includeComments === true
  const includePhotos = settings?.includePhotos === true
  const filterLocations: string[] = Array.isArray(settings?.locations) ? (settings.locations as string[]) : []
  const filterAssignees: string[] = Array.isArray(settings?.assignees) ? (settings.assignees as string[]) : []
  const filterStatuses: string[] = Array.isArray(settings?.statuses) ? (settings.statuses as string[]) : []

  // Admin failsafe: override at render time
  const reportSettings = await getReportSettings()
  if (reportSettings.hideNotesInPublicShare) {
    includeNotes = false
  }

  // Mood boards: filter to a single board if boardId is set
  const boardId = typeof settings?.boardId === 'string' ? (settings.boardId as string) : null
  let payload = instance.payload as Record<string, unknown>

  if (toolKey === 'mood_boards' && boardId && Array.isArray(payload?.boards)) {
    const boards = payload.boards as Record<string, unknown>[]
    const targetBoard = boards.find((b) => b.id === boardId)
    if (!targetBoard) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }
    payload = { ...payload, boards: [targetBoard] }
  }

  // Punchlist: whitelist sanitization — map raw items to PublicPunchlistItem
  if (toolKey === 'punchlist' && Array.isArray(payload?.items)) {
    const rawItems = payload.items as PunchlistItem[]

    const filtered = rawItems.filter((item) => {
      if (filterStatuses.length > 0 && !filterStatuses.includes(item.status)) return false
      if (filterLocations.length > 0 && !filterLocations.includes(item.location)) return false
      if (filterAssignees.length > 0 && !filterAssignees.includes(item.assigneeLabel)) return false
      return true
    })

    payload = {
      items: filtered.map((item) =>
        toPublicItem(item, { includeNotes, includeComments, includePhotos })
      ),
    }
  }

  return NextResponse.json({
    payload,
    projectName: record.project.name,
    toolKey,
    includeNotes,
    includePhotos,
    boardId,
    includeComments,
    filters: { locations: filterLocations, assignees: filterAssignees, statuses: filterStatuses },
  })
}
