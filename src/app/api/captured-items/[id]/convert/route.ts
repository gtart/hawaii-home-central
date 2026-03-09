import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { ensureCurrentProject } from '@/lib/project'
import { prisma } from '@/lib/prisma'
import { writeActivityEvents } from '@/server/activity/writeActivityEvent'
import type { Prisma } from '@prisma/client'

const TOOL_LABELS: Record<string, string> = {
  finish_decisions: 'Selections',
  punchlist: 'Fix List',
  mood_boards: 'Mood Boards',
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  let projectId: string
  try {
    projectId = await ensureCurrentProject(userId)
  } catch {
    return NextResponse.json({ error: 'No active project' }, { status: 404 })
  }

  const { id } = await params

  const item = await prisma.capturedItem.findUnique({ where: { id } })
  if (!item || item.projectId !== projectId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (item.status !== 'UNSORTED') {
    return NextResponse.json({ error: 'Item already sorted' }, { status: 409 })
  }

  let body: {
    toolKey: string
    collectionId: string
    decisionId?: string
    title?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { toolKey, collectionId, decisionId, title } = body
  if (!toolKey || !collectionId) {
    return NextResponse.json({ error: 'toolKey and collectionId required' }, { status: 400 })
  }
  if (!['finish_decisions', 'punchlist', 'mood_boards'].includes(toolKey)) {
    return NextResponse.json({ error: 'Invalid toolKey' }, { status: 400 })
  }

  // Load target collection
  const collection = await prisma.toolCollection.findUnique({
    where: { id: collectionId },
  })
  if (!collection || collection.projectId !== projectId || collection.toolKey !== toolKey) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
  }

  const payload = collection.payload as Record<string, unknown>
  const ts = new Date().toISOString()
  const entityName = title || item.title || item.note || 'Imported item'
  let entityId: string
  let updatedPayload: Record<string, unknown>

  try {
    if (toolKey === 'finish_decisions') {
      const result = convertToSelection(payload, item, decisionId, entityName, ts)
      entityId = result.entityId
      updatedPayload = result.payload
    } else if (toolKey === 'punchlist') {
      const result = convertToPunchlist(payload, item, entityName, ts, session.user.name || undefined, session.user.email || undefined)
      entityId = result.entityId
      updatedPayload = result.payload
    } else {
      const result = convertToMoodBoard(payload, item, entityName, ts)
      entityId = result.entityId
      updatedPayload = result.payload
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Conversion failed'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  // Save updated collection payload
  await prisma.toolCollection.update({
    where: { id: collectionId },
    data: { payload: updatedPayload as Prisma.InputJsonValue, updatedAt: new Date() },
  })

  // Mark CapturedItem as sorted
  await prisma.capturedItem.update({
    where: { id },
    data: {
      status: 'SORTED',
      sortedToToolKey: toolKey,
      sortedToCollectionId: collectionId,
      sortedToEntityId: entityId,
    },
  })

  // Activity events
  const toolLabel = TOOL_LABELS[toolKey] || toolKey
  const collTitle = collection.title
  writeActivityEvents([
    {
      projectId,
      toolKey: 'inbox',
      action: 'sorted',
      summaryText: `Sorted ${item.type.toLowerCase()} to ${collTitle}`,
      entityLabel: collTitle,
      actorUserId: userId,
    },
    {
      projectId,
      toolKey,
      collectionId,
      entityType: toolKey === 'finish_decisions' ? 'option' : toolKey === 'punchlist' ? 'item' : 'idea',
      entityId,
      action: 'added',
      summaryText: `Added "${entityName}" from inbox`,
      entityLabel: entityName,
      actorUserId: userId,
    },
  ]).catch(() => {})

  return NextResponse.json({ entityId, collectionId, toolKey }, { status: 200 })
}

// ---------------------------------------------------------------------------
// Conversion helpers
// ---------------------------------------------------------------------------

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

interface ConvertResult {
  entityId: string
  payload: Record<string, unknown>
}

interface CapturedItemData {
  title: string | null
  description: string | null
  note: string | null
  sourceUrl: string | null
  imageUrl: string | null
  thumbnailUrl: string | null
  originalImageUrl: string | null
  siteName: string | null
}

function convertToSelection(
  payload: Record<string, unknown>,
  item: CapturedItemData,
  decisionId: string | undefined,
  name: string,
  ts: string,
): ConvertResult {
  if (!decisionId) {
    throw new Error('decisionId required for Selections')
  }

  const optionId = crypto.randomUUID()
  const imageId = crypto.randomUUID()

  const option = {
    id: optionId,
    name,
    notes: item.description || '',
    urls: item.sourceUrl ? [{ id: crypto.randomUUID(), url: item.sourceUrl }] : [],
    kind: item.imageUrl ? 'image' : 'text',
    images: item.imageUrl ? [{
      id: imageId,
      url: item.imageUrl,
      thumbnailUrl: item.thumbnailUrl || undefined,
      label: item.title || undefined,
      sourceUrl: item.sourceUrl || undefined,
    }] : undefined,
    heroImageId: item.imageUrl ? imageId : null,
    imageUrl: item.imageUrl || item.thumbnailUrl || undefined,
    thumbnailUrl: item.thumbnailUrl || undefined,
    createdAt: ts,
    updatedAt: ts,
  }

  const version = typeof payload.version === 'number' ? payload.version : 0

  // V4: flat selections array
  if (version >= 4 || Array.isArray(payload.selections)) {
    const selections = (payload.selections || []) as Array<{
      id: string; options: unknown[]; updatedAt: string; [k: string]: unknown
    }>

    let found = false
    const updatedSelections = selections.map((sel) => {
      if (sel.id === decisionId) {
        found = true
        return { ...sel, options: [...(sel.options || []), option], updatedAt: ts }
      }
      return sel
    })

    if (!found) {
      throw new Error('Selection not found in collection')
    }

    return {
      entityId: optionId,
      payload: { ...payload, selections: updatedSelections },
    }
  }

  // V3 legacy: rooms → decisions
  const rooms = (payload.rooms || []) as Array<{
    id: string
    decisions: Array<{ id: string; options: unknown[]; updatedAt: string; [k: string]: unknown }>
    [k: string]: unknown
  }>

  let found = false
  const updatedRooms = rooms.map((room) => ({
    ...room,
    decisions: room.decisions.map((dec) => {
      if (dec.id === decisionId) {
        found = true
        return {
          ...dec,
          options: [...(dec.options || []), option],
          updatedAt: ts,
        }
      }
      return dec
    }),
  }))

  if (!found) {
    throw new Error('Decision not found in collection')
  }

  return {
    entityId: optionId,
    payload: { ...payload, rooms: updatedRooms },
  }
}

function convertToPunchlist(
  payload: Record<string, unknown>,
  item: CapturedItemData,
  title: string,
  ts: string,
  userName?: string,
  userEmail?: string,
): ConvertResult {
  const entityId = genId('pl')
  const nextItemNumber = (payload.nextItemNumber as number) || 1

  const plItem = {
    id: entityId,
    itemNumber: nextItemNumber,
    title,
    location: '',
    assigneeLabel: '',
    status: 'OPEN',
    notes: item.description || item.note || '',
    photos: item.imageUrl ? [{
      id: genId('ph'),
      url: item.imageUrl,
      thumbnailUrl: item.thumbnailUrl || item.imageUrl,
      uploadedAt: ts,
    }] : [],
    comments: [],
    createdByName: userName,
    createdByEmail: userEmail,
    createdAt: ts,
    updatedAt: ts,
  }

  const items = (payload.items || []) as unknown[]

  return {
    entityId,
    payload: {
      ...payload,
      items: [...items, plItem],
      nextItemNumber: nextItemNumber + 1,
    },
  }
}

function convertToMoodBoard(
  payload: Record<string, unknown>,
  item: CapturedItemData,
  name: string,
  ts: string,
): ConvertResult {
  const entityId = genId('idea')
  const imgId = genId('img')

  const idea = {
    id: entityId,
    name,
    notes: item.description || '',
    images: item.imageUrl ? [{
      id: imgId,
      url: item.imageUrl,
      thumbnailUrl: item.thumbnailUrl,
      label: item.title || undefined,
      sourceUrl: item.sourceUrl || undefined,
    }] : [],
    heroImageId: item.imageUrl ? imgId : null,
    sourceUrl: item.sourceUrl || null,
    sourceTitle: item.title || null,
    tags: [],
    createdAt: ts,
    updatedAt: ts,
  }

  // Collection-based mood boards use v2 format (flat ideas array)
  const version = payload.version as number | undefined
  if (version === 2 || (!version && 'ideas' in payload)) {
    // v2 collection format
    const ideas = (payload.ideas || []) as unknown[]
    return {
      entityId,
      payload: { ...payload, ideas: [...ideas, idea] },
    }
  }

  // v1 format (boards array) — add to first/default board
  const boards = (payload.boards || []) as Array<{
    id: string
    ideas: unknown[]
    isDefault?: boolean
    updatedAt: string
    [k: string]: unknown
  }>
  const targetBoard = boards.find((b) => b.isDefault) || boards[0]
  if (!targetBoard) {
    throw new Error('No board found in collection')
  }

  const updatedBoards = boards.map((b) =>
    b.id === targetBoard.id
      ? { ...b, ideas: [...b.ideas, idea], updatedAt: ts }
      : b
  )

  return {
    entityId,
    payload: { ...payload, boards: updatedBoards },
  }
}
