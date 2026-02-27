import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateShareToken, getReportSettings } from '@/lib/share-tokens'
import { toPublicItem } from '@/app/app/tools/punchlist/types'
import type { PunchlistItem } from '@/app/app/tools/punchlist/types'
import { toPublicBoard } from '@/data/mood-boards'
import type { Board } from '@/data/mood-boards'
import { toPublicRoom } from '@/data/finish-decisions'
import type { RoomV3 } from '@/data/finish-decisions'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ toolKey: string; token: string }> }
) {
  const { toolKey, token } = await params

  // Reject unknown tool keys
  const SUPPORTED_TOOLS = new Set(['punchlist', 'mood_boards', 'finish_decisions'])
  if (!SUPPORTED_TOOLS.has(toolKey)) {
    return NextResponse.json({ error: 'Invalid tool' }, { status: 400 })
  }

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
  const includeSourceUrl = settings?.includeSourceUrl === true
  const filterLocations: string[] = Array.isArray(settings?.locations) ? (settings.locations as string[]) : []
  const filterAssignees: string[] = Array.isArray(settings?.assignees) ? (settings.assignees as string[]) : []
  const filterStatuses: string[] = Array.isArray(settings?.statuses) ? (settings.statuses as string[]) : []

  // Admin failsafe: override at render time
  const reportSettings = await getReportSettings()
  if (reportSettings.hideNotesInPublicShare) {
    includeNotes = false
  }

  const boardId = typeof settings?.boardId === 'string' ? (settings.boardId as string) : null
  let payload: Record<string, unknown> = instance.payload as Record<string, unknown>

  // Mood boards: allowlist sanitization — strip sensitive fields, respect token flags
  if (toolKey === 'mood_boards' && Array.isArray(payload?.boards)) {
    let boards = payload.boards as Board[]

    // Apply scope: multi-board, single-board (legacy), or all
    const mbScope = settings?.scope as { mode?: string; boardIds?: string[] } | undefined
    if (mbScope?.mode === 'selected' && Array.isArray(mbScope.boardIds) && mbScope.boardIds.length > 0) {
      boards = boards.filter((b) => mbScope.boardIds!.includes(b.id))
    } else if (mbScope?.mode === 'all') {
      // Exclude default/Uncategorized board for "All Boards" scope
      boards = boards.filter((b) => !(b as Board & { isDefault?: boolean }).isDefault)
    } else if (boardId) {
      // Legacy single-board back-compat
      const targetBoard = boards.find((b) => b.id === boardId)
      if (!targetBoard) {
        return NextResponse.json({ error: 'Board not found' }, { status: 404 })
      }
      boards = [targetBoard]
    }

    // Sanitize: map through allowlist — strips ACLs, emails, visibility, internal fields
    payload = {
      version: 1,
      boards: boards.map((b) =>
        toPublicBoard(b, { includeNotes, includeComments, includePhotos, includeSourceUrl })
      ),
    }
  }

  // Decision Tracker: allowlist sanitization — strip PII, respect token flags + scope
  if (toolKey === 'finish_decisions' && Array.isArray(payload?.rooms)) {
    let rooms = (payload.rooms as RoomV3[]).filter(
      (r) => r.systemKey !== 'global_uncategorized'
    )

    // Apply scope from token settings
    const scope = settings?.scope as { mode?: string; roomIds?: string[] } | undefined
    if (scope?.mode === 'selected' && Array.isArray(scope.roomIds)) {
      rooms = rooms.filter((r) => scope.roomIds!.includes(r.id))
    }

    payload = {
      version: 3,
      rooms: rooms.map((r) =>
        toPublicRoom(r, { includeNotes, includeComments, includePhotos })
      ),
    }
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

  const scope = settings?.scope as Record<string, unknown> | undefined

  return NextResponse.json({
    payload,
    projectName: record.project.name,
    toolKey,
    includeNotes,
    includePhotos,
    includeComments,
    includeSourceUrl,
    boardId,
    scope: scope ?? null,
    filters: { locations: filterLocations, assignees: filterAssignees, statuses: filterStatuses },
  })
}
