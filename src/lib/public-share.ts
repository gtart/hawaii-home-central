import { prisma } from '@/lib/prisma'
import { validateShareToken, getReportSettings } from '@/lib/share-tokens'
import { validateCollectionShareToken } from '@/lib/collection-access'
import { toPublicItem } from '@/app/app/tools/punchlist/types'
import type { PunchlistItem } from '@/app/app/tools/punchlist/types'
import { toPublicBoard } from '@/data/mood-boards'
import type { Board } from '@/data/mood-boards'
import { toPublicRoom, toPublicSelection } from '@/data/finish-decisions'
import type { RoomV3, SelectionV4 } from '@/data/finish-decisions'
import { toPublicAlignmentItem } from '@/data/alignment'
import type { AlignmentItem } from '@/data/alignment'

const SUPPORTED_TOOLS = new Set(['punchlist', 'mood_boards', 'finish_decisions', 'project_alignment'])

interface ResolvedToken {
  id: string
  token: string
  projectId: string
  toolKey: string
  permissions: string
  settings: unknown
  createdBy: string | null
  revokedAt: Date | null
  expiresAt: Date | null
  createdAt: Date
  updatedAt: Date
  project: { id: string; name: string }
}

interface ShareResolution {
  record: ResolvedToken
  payloadData: unknown
  toolKey: string
  collectionId?: string
}

/**
 * Resolve a share token to its record + raw payload.
 * Tries collection tokens first, then falls back to legacy ToolShareToken.
 *
 * @param token - The share token string
 * @param expectedToolKey - If provided, validates the tool key matches. Required for legacy tokens.
 */
export async function resolveShareToken(
  token: string,
  expectedToolKey?: string
): Promise<ShareResolution | { error: string; status: number }> {
  const collectionToken = await validateCollectionShareToken(token)

  if (collectionToken) {
    const toolKey = collectionToken.collection.toolKey
    if (expectedToolKey && toolKey !== expectedToolKey) {
      return { error: 'Invalid or expired link', status: 404 }
    }
    if (!SUPPORTED_TOOLS.has(toolKey)) {
      return { error: 'Invalid tool', status: 400 }
    }

    const record: ResolvedToken = {
      id: collectionToken.id,
      token: collectionToken.token,
      projectId: collectionToken.collection.projectId,
      toolKey,
      permissions: collectionToken.permissions,
      settings: collectionToken.settings,
      createdBy: collectionToken.createdBy,
      revokedAt: collectionToken.revokedAt,
      expiresAt: collectionToken.expiresAt,
      createdAt: collectionToken.createdAt,
      updatedAt: collectionToken.updatedAt,
      project: collectionToken.collection.project,
    }

    return {
      record,
      payloadData: collectionToken.collection.payload,
      toolKey,
      collectionId: collectionToken.collectionId,
    }
  }

  // Legacy fallback — requires expectedToolKey
  if (!expectedToolKey) {
    return { error: 'Invalid or expired share link', status: 404 }
  }

  if (!SUPPORTED_TOOLS.has(expectedToolKey)) {
    return { error: 'Invalid tool', status: 400 }
  }

  const legacyRecord = await validateShareToken(token)
  if (!legacyRecord || legacyRecord.toolKey !== expectedToolKey) {
    return { error: 'Invalid or expired link', status: 404 }
  }

  const instance = await prisma.toolInstance.findUnique({
    where: {
      projectId_toolKey: {
        projectId: legacyRecord.projectId,
        toolKey: expectedToolKey,
      },
    },
    select: { payload: true },
  })

  if (!instance) {
    return { error: 'No data found', status: 404 }
  }

  return {
    record: legacyRecord,
    payloadData: instance.payload,
    toolKey: expectedToolKey,
  }
}

/**
 * Given a resolved share token and its raw payload, apply tool-specific
 * sanitization and return the public-safe response body.
 */
export async function buildSanitizedShareResponse(resolution: ShareResolution) {
  const { record, payloadData, toolKey, collectionId } = resolution
  const settings = record.settings as Record<string, unknown>

  let includeNotes = settings?.includeNotes === true
  const includeComments = settings?.includeComments === true
  const includePhotos = settings?.includePhotos === true
  const includeSourceUrl = settings?.includeSourceUrl === true
  const filterLocations: string[] = Array.isArray(settings?.locations) ? (settings.locations as string[]) : []
  const filterAssignees: string[] = Array.isArray(settings?.assignees) ? (settings.assignees as string[]) : []
  const filterStatuses: string[] = Array.isArray(settings?.statuses) ? (settings.statuses as string[]) : []
  const filterPriorities: string[] = Array.isArray(settings?.priorities) ? (settings.priorities as string[]) : []

  // Admin failsafe: override at render time
  const reportSettings = await getReportSettings()
  if (reportSettings.hideNotesInPublicShare) {
    includeNotes = false
  }

  const boardId = typeof settings?.boardId === 'string' ? (settings.boardId as string) : null
  let payload: Record<string, unknown> = payloadData as Record<string, unknown>

  // Inject DB comments into payload entities so toPublicXxx functions pick them up
  if (includeComments && collectionId) {
    const dbComments = await prisma.comment.findMany({
      where: { collectionId },
      select: {
        targetType: true,
        targetId: true,
        text: true,
        authorName: true,
        authorEmail: true,
        createdAt: true,
        refEntityType: true,
        refEntityId: true,
        refEntityLabel: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    if (dbComments.length > 0) {
      // Group by targetType:targetId
      const grouped = new Map<string, typeof dbComments>()
      for (const c of dbComments) {
        const key = `${c.targetType}:${c.targetId}`
        if (!grouped.has(key)) grouped.set(key, [])
        grouped.get(key)!.push(c)
      }

      // Inject into finish_decisions V4 selections
      if (toolKey === 'finish_decisions' && Array.isArray(payload?.selections)) {
        for (const s of payload.selections as SelectionV4[]) {
          const sComments = grouped.get(`decision:${s.id}`)
          if (sComments) {
            (s as any).comments = sComments.map((c) => ({
              id: '',
              text: c.text,
              authorName: c.authorName,
              authorEmail: c.authorEmail,
              createdAt: c.createdAt.toISOString(),
              ...(c.refEntityId ? { refOptionId: c.refEntityId, refOptionLabel: c.refEntityLabel ?? undefined } : {}),
            }))
          }
        }
      }

      // Inject into finish_decisions V3 rooms and decisions (legacy)
      if (toolKey === 'finish_decisions' && Array.isArray(payload?.rooms)) {
        for (const room of payload.rooms as RoomV3[]) {
          const roomComments = grouped.get(`room:${room.id}`)
          if (roomComments) {
            room.comments = roomComments.map((c) => ({
              id: '',
              text: c.text,
              authorName: c.authorName,
              authorEmail: c.authorEmail,
              createdAt: c.createdAt.toISOString(),
              ...(c.refEntityId ? { refDecisionId: c.refEntityId, refDecisionTitle: c.refEntityLabel ?? undefined } : {}),
            }))
          }
          for (const d of room.decisions || []) {
            const dComments = grouped.get(`decision:${d.id}`)
            if (dComments) {
              d.comments = dComments.map((c) => ({
                id: '',
                text: c.text,
                authorName: c.authorName,
                authorEmail: c.authorEmail,
                createdAt: c.createdAt.toISOString(),
                ...(c.refEntityId ? { refOptionId: c.refEntityId, refOptionLabel: c.refEntityLabel ?? undefined } : {}),
              }))
            }
          }
        }
      }

      // Inject into mood_boards boards
      if (toolKey === 'mood_boards' && Array.isArray(payload?.boards)) {
        for (const board of payload.boards as Board[]) {
          const boardComments = grouped.get(`board:${board.id}`)
          if (boardComments) {
            board.comments = boardComments.map((c) => ({
              id: '',
              text: c.text,
              authorName: c.authorName,
              authorEmail: c.authorEmail,
              createdAt: c.createdAt.toISOString(),
              ...(c.refEntityId ? { refIdeaId: c.refEntityId, refIdeaLabel: c.refEntityLabel ?? undefined } : {}),
            }))
          }
        }
      }

      // Inject into punchlist items
      if (toolKey === 'punchlist' && Array.isArray(payload?.items)) {
        for (const item of payload.items as PunchlistItem[]) {
          const itemComments = grouped.get(`item:${item.id}`)
          if (itemComments) {
            item.comments = itemComments.map((c) => ({
              id: '',
              text: c.text,
              authorName: c.authorName,
              authorEmail: c.authorEmail,
              createdAt: c.createdAt.toISOString(),
            }))
          }
        }
      }
    }
  }

  // Mood boards: allowlist sanitization — strip sensitive fields, respect token flags
  if (toolKey === 'mood_boards' && Array.isArray(payload?.boards)) {
    let boards = payload.boards as Board[]

    const mbScope = settings?.scope as { mode?: string; boardIds?: string[] } | undefined
    if (mbScope?.mode === 'selected' && Array.isArray(mbScope.boardIds) && mbScope.boardIds.length > 0) {
      boards = boards.filter((b) => mbScope.boardIds!.includes(b.id))
    } else if (mbScope?.mode === 'all') {
      boards = boards.filter((b) => !(b as Board & { isDefault?: boolean }).isDefault)
    } else if (boardId) {
      const targetBoard = boards.find((b) => b.id === boardId)
      if (!targetBoard) {
        return { error: 'Board not found', status: 404 }
      }
      boards = [targetBoard]
    }

    payload = {
      version: 1,
      boards: boards.map((b) =>
        toPublicBoard(b, { includeNotes, includeComments, includePhotos, includeSourceUrl })
      ),
    }
  }

  // Decision Tracker: allowlist sanitization — strip PII, respect token flags + scope
  if (toolKey === 'finish_decisions' && Array.isArray(payload?.selections)) {
    // V4: flat selections
    let selections = (payload.selections as SelectionV4[])

    const fdScope = settings?.scope as { mode?: string; selectionIds?: string[]; roomIds?: string[] } | undefined
    const isScopedToSpecificSelections =
      fdScope?.mode === 'selected' && Array.isArray(fdScope.selectionIds) && fdScope.selectionIds.length > 0

    if (isScopedToSpecificSelections) {
      // Scoped share: only include the specified selection IDs (intentional share)
      selections = selections.filter((s) => fdScope!.selectionIds!.includes(s.id))
    } else {
      // Unscoped share: exclude restricted selections (no user identity in public links)
      selections = selections.filter((s) => s.visibility !== 'restricted')
    }

    payload = {
      version: 4,
      selections: selections.map((s) =>
        toPublicSelection(s, { includeNotes, includeComments, includePhotos })
      ),
    }
  } else if (toolKey === 'finish_decisions' && Array.isArray(payload?.rooms)) {
    // V3 legacy: rooms-based
    let rooms = (payload.rooms as RoomV3[]).filter(
      (r) => r.systemKey !== 'global_uncategorized'
    )

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

  // Punchlist: allowlist sanitization — map raw items to PublicPunchlistItem
  if (toolKey === 'punchlist' && Array.isArray(payload?.items)) {
    const rawItems = payload.items as PunchlistItem[]

    const filtered = rawItems.filter((item) => {
      if (filterStatuses.length > 0) {
        const wantUnassigned = filterStatuses.includes('__unassigned__')
        if (!filterStatuses.includes(item.status) && !(wantUnassigned && !item.status)) return false
      }
      if (filterPriorities.length > 0) {
        const wantUnassigned = filterPriorities.includes('__unassigned__')
        if (!filterPriorities.includes(item.priority ?? '') && !(wantUnassigned && !item.priority)) return false
      }
      if (filterLocations.length > 0) {
        const wantUnassigned = filterLocations.includes('__unassigned__')
        if (!filterLocations.includes(item.location) && !(wantUnassigned && !item.location)) return false
      }
      if (filterAssignees.length > 0) {
        const wantUnassigned = filterAssignees.includes('__unassigned__')
        if (!filterAssignees.includes(item.assigneeLabel) && !(wantUnassigned && !item.assigneeLabel)) return false
      }
      return true
    })

    payload = {
      items: filtered.map((item) =>
        toPublicItem(item, { includeNotes, includeComments, includePhotos })
      ),
    }
  }

  // Project Alignment: allowlist sanitization — strip internal fields, scope to shared items
  if (toolKey === 'project_alignment' && Array.isArray(payload?.items)) {
    let items = payload.items as AlignmentItem[]

    const alScope = settings?.scope as { mode?: string; itemIds?: string[] } | undefined
    if (alScope?.mode === 'selected' && Array.isArray(alScope.itemIds) && alScope.itemIds.length > 0) {
      items = items.filter((it) => alScope.itemIds!.includes(it.id))
    }

    payload = {
      version: 1,
      items: items.map((it) =>
        toPublicAlignmentItem(it, { includeNotes, includePhotos })
      ),
      allowResponses: (settings as Record<string, unknown>)?.allowResponses === true,
    }
  }

  const scope = settings?.scope as Record<string, unknown> | undefined

  return {
    body: {
      payload,
      projectName: record.project.name,
      toolKey,
      includeNotes,
      includePhotos,
      includeComments,
      includeSourceUrl,
      boardId,
      scope: scope ?? null,
      filters: { locations: filterLocations, assignees: filterAssignees, statuses: filterStatuses, priorities: filterPriorities },
    },
  }
}
