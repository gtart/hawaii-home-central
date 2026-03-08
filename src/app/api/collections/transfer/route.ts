import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { resolveCollectionAccess } from '@/lib/collection-access'
import { writeActivityEvents } from '@/server/activity/writeActivityEvent'
import type { Prisma } from '@prisma/client'

type EntityType = 'punchlist_item' | 'decision' | 'option'
type Operation = 'move' | 'copy'

interface TransferBody {
  sourceCollectionId: string
  destinationCollectionId: string
  operation: Operation
  entityType: EntityType
  entityId: string
  sourceDecisionId?: string
  destinationRoomId?: string
  destinationDecisionId?: string
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id

  let body: TransferBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const {
    sourceCollectionId,
    destinationCollectionId,
    operation,
    entityType,
    entityId,
    sourceDecisionId,
    destinationRoomId,
    destinationDecisionId,
  } = body

  if (!sourceCollectionId || !destinationCollectionId || !operation || !entityType || !entityId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (sourceCollectionId === destinationCollectionId) {
    return NextResponse.json({ error: 'Source and destination must differ' }, { status: 400 })
  }
  if (!['move', 'copy'].includes(operation)) {
    return NextResponse.json({ error: 'Invalid operation' }, { status: 400 })
  }
  if (!['punchlist_item', 'decision', 'option'].includes(entityType)) {
    return NextResponse.json({ error: 'Invalid entityType' }, { status: 400 })
  }

  // Access checks
  const [srcAccess, destAccess] = await Promise.all([
    resolveCollectionAccess(userId, sourceCollectionId),
    resolveCollectionAccess(userId, destinationCollectionId),
  ])

  if (operation === 'move') {
    if (!srcAccess || srcAccess === 'VIEWER') {
      return NextResponse.json({ error: 'No edit access on source' }, { status: 403 })
    }
    if (!destAccess || destAccess === 'VIEWER') {
      return NextResponse.json({ error: 'No edit access on destination' }, { status: 403 })
    }
  } else {
    // copy: viewer on source is fine, editor on dest required
    if (!srcAccess) {
      return NextResponse.json({ error: 'No access on source' }, { status: 403 })
    }
    if (!destAccess || destAccess === 'VIEWER') {
      return NextResponse.json({ error: 'No edit access on destination' }, { status: 403 })
    }
  }

  // Load both collections
  const [srcColl, destColl] = await Promise.all([
    prisma.toolCollection.findUnique({ where: { id: sourceCollectionId } }),
    prisma.toolCollection.findUnique({ where: { id: destinationCollectionId } }),
  ])

  if (!srcColl || !destColl) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
  }
  if (srcColl.projectId !== destColl.projectId) {
    return NextResponse.json({ error: 'Collections must be in the same project' }, { status: 400 })
  }
  if (srcColl.toolKey !== destColl.toolKey) {
    return NextResponse.json({ error: 'Collections must be the same tool type' }, { status: 400 })
  }
  if (srcColl.archivedAt || destColl.archivedAt) {
    return NextResponse.json({ error: 'Cannot transfer to/from archived collection' }, { status: 400 })
  }

  const srcPayload = srcColl.payload as Record<string, unknown>
  const destPayload = destColl.payload as Record<string, unknown>
  const ts = new Date().toISOString()
  const now = new Date()

  let resultEntityId = entityId
  let entityName = ''
  let updatedSrcPayload: Record<string, unknown> | null = null
  let updatedDestPayload: Record<string, unknown>

  try {
    if (entityType === 'punchlist_item') {
      const result = transferPunchlistItem(srcPayload, destPayload, entityId, ts)
      updatedSrcPayload = result.srcPayload
      updatedDestPayload = result.destPayload
      entityName = result.entityName
    } else if (entityType === 'decision') {
      const result = transferDecision(srcPayload, destPayload, entityId, destinationRoomId, ts)
      updatedSrcPayload = result.srcPayload
      updatedDestPayload = result.destPayload
      entityName = result.entityName
    } else if (entityType === 'option') {
      if (!sourceDecisionId) {
        return NextResponse.json({ error: 'sourceDecisionId required for option copy' }, { status: 400 })
      }
      if (!destinationRoomId || !destinationDecisionId) {
        return NextResponse.json({ error: 'destinationRoomId and destinationDecisionId required' }, { status: 400 })
      }
      const result = copyOption(srcPayload, destPayload, entityId, sourceDecisionId, destinationRoomId, destinationDecisionId, ts)
      updatedSrcPayload = null // copy doesn't modify source
      updatedDestPayload = result.destPayload
      resultEntityId = result.newOptionId
      entityName = result.entityName
    } else {
      return NextResponse.json({ error: 'Unsupported entityType' }, { status: 400 })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Transfer failed'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  // Write both collections atomically
  await prisma.$transaction(
    [
      ...(updatedSrcPayload
        ? [
            prisma.toolCollection.update({
              where: { id: sourceCollectionId },
              data: { payload: updatedSrcPayload as Prisma.InputJsonValue, updatedAt: now, updatedById: userId },
            }),
          ]
        : []),
      prisma.toolCollection.update({
        where: { id: destinationCollectionId },
        data: { payload: updatedDestPayload as Prisma.InputJsonValue, updatedAt: now, updatedById: userId },
      }),
    ]
  )

  // Activity events
  const actionVerb = operation === 'move' ? 'Moved' : 'Copied'
  const entityLabel = entityType === 'punchlist_item' ? 'fix' : entityType === 'decision' ? 'selection' : 'option'
  const events = [
    {
      projectId: srcColl.projectId,
      toolKey: srcColl.toolKey,
      collectionId: destinationCollectionId,
      entityId: resultEntityId,
      action: operation === 'move' ? 'moved_in' : 'copied_in',
      summaryText: `${actionVerb} ${entityLabel} "${entityName}" from ${srcColl.title}`,
      entityLabel: entityName,
      detailText: `from ${srcColl.title}`,
      actorUserId: userId,
    },
  ]
  if (operation === 'move') {
    events.push({
      projectId: srcColl.projectId,
      toolKey: srcColl.toolKey,
      collectionId: sourceCollectionId,
      entityId,
      action: 'moved_out',
      summaryText: `${actionVerb} ${entityLabel} "${entityName}" to ${destColl.title}`,
      entityLabel: entityName,
      detailText: `to ${destColl.title}`,
      actorUserId: userId,
    })
  }
  writeActivityEvents(events).catch(() => {})

  return NextResponse.json({
    success: true,
    entityId: resultEntityId,
    destinationCollectionTitle: destColl.title,
  })
}

// ---------------------------------------------------------------------------
// Transfer helpers
// ---------------------------------------------------------------------------

interface PunchlistItem {
  id: string
  itemNumber: number
  title: string
  [k: string]: unknown
}

function transferPunchlistItem(
  srcPayload: Record<string, unknown>,
  destPayload: Record<string, unknown>,
  itemId: string,
  ts: string,
) {
  const srcItems = (srcPayload.items || []) as PunchlistItem[]
  const item = srcItems.find((i) => i.id === itemId)
  if (!item) throw new Error('Item not found in source')

  const destItems = (destPayload.items || []) as PunchlistItem[]
  const nextNum = (destPayload.nextItemNumber as number) || destItems.length + 1

  return {
    srcPayload: {
      ...srcPayload,
      items: srcItems.filter((i) => i.id !== itemId),
    },
    destPayload: {
      ...destPayload,
      items: [...destItems, { ...item, itemNumber: nextNum, updatedAt: ts }],
      nextItemNumber: nextNum + 1,
    },
    entityName: item.title || 'Untitled fix',
  }
}

interface DecisionV3Like {
  id: string
  title: string
  [k: string]: unknown
}

interface RoomV3Like {
  id: string
  name: string
  type?: string
  systemKey?: string
  decisions: DecisionV3Like[]
  [k: string]: unknown
}

function transferDecision(
  srcPayload: Record<string, unknown>,
  destPayload: Record<string, unknown>,
  decisionId: string,
  destRoomId: string | undefined,
  ts: string,
) {
  // V4: flat selections
  if (Array.isArray(srcPayload.selections)) {
    const srcSelections = srcPayload.selections as DecisionV3Like[]
    const found = srcSelections.find((s) => s.id === decisionId)
    if (!found) throw new Error('Selection not found in source')

    const updatedSrc = srcSelections.filter((s) => s.id !== decisionId)
    const destSelections = (destPayload.selections || []) as DecisionV3Like[]

    return {
      srcPayload: { ...srcPayload, selections: updatedSrc },
      destPayload: { ...destPayload, selections: [...destSelections, { ...found, updatedAt: ts }] },
      entityName: found.title || 'Untitled selection',
    }
  }

  // V3: rooms-based (legacy)
  const srcRooms = (srcPayload.rooms || []) as RoomV3Like[]
  let foundDecision: DecisionV3Like | null = null
  let foundRoomId: string | null = null

  const updatedSrcRooms = srcRooms.map((room) => {
    const dec = room.decisions.find((d) => d.id === decisionId)
    if (dec) {
      foundDecision = dec
      foundRoomId = room.id
      return {
        ...room,
        decisions: room.decisions.filter((d) => d.id !== decisionId),
        updatedAt: ts,
      }
    }
    return room
  })

  if (!foundDecision || !foundRoomId) {
    throw new Error('Decision not found in source')
  }
  const decision: DecisionV3Like = foundDecision

  const destRooms = (destPayload.rooms || []) as RoomV3Like[]
  let targetRoom: RoomV3Like | undefined

  if (destRoomId) {
    targetRoom = destRooms.find((r) => r.id === destRoomId)
  }
  if (!targetRoom) {
    targetRoom = destRooms.find((r) => !r.systemKey) || destRooms[0]
  }
  if (!targetRoom) {
    const newRoom: RoomV3Like = {
      id: crypto.randomUUID(),
      name: 'General',
      type: 'other',
      decisions: [],
      createdAt: ts,
      updatedAt: ts,
    }
    destRooms.push(newRoom)
    targetRoom = newRoom
  }

  const updatedDestRooms = destRooms.map((room) =>
    room.id === targetRoom!.id
      ? {
          ...room,
          decisions: [...room.decisions, { ...decision, updatedAt: ts }],
          updatedAt: ts,
        }
      : room
  )

  return {
    srcPayload: { ...srcPayload, rooms: updatedSrcRooms },
    destPayload: { ...destPayload, rooms: updatedDestRooms },
    entityName: decision.title || 'Untitled selection',
  }
}

interface OptionV3Like {
  id: string
  name: string
  [k: string]: unknown
}

function copyOption(
  srcPayload: Record<string, unknown>,
  destPayload: Record<string, unknown>,
  optionId: string,
  sourceDecisionId: string,
  destRoomId: string,
  destDecisionId: string,
  ts: string,
) {
  let foundOption: OptionV3Like | null = null

  // V4: flat selections
  if (Array.isArray(srcPayload.selections)) {
    const srcSelections = srcPayload.selections as DecisionV3Like[]
    for (const sel of srcSelections) {
      if (sel.id === sourceDecisionId) {
        const options = (sel.options || []) as OptionV3Like[]
        const opt = options.find((o) => o.id === optionId)
        if (opt) foundOption = opt
      }
    }
  } else {
    // V3: rooms-based
    const srcRooms = (srcPayload.rooms || []) as RoomV3Like[]
    for (const room of srcRooms) {
      for (const dec of room.decisions) {
        if (dec.id === sourceDecisionId) {
          const options = (dec.options || []) as OptionV3Like[]
          const opt = options.find((o) => o.id === optionId)
          if (opt) foundOption = opt
        }
      }
    }
  }

  if (!foundOption) throw new Error('Option not found in source')
  const option: OptionV3Like = foundOption

  // Clone with new ID and timestamps
  const newOptionId = crypto.randomUUID()
  const cloned: OptionV3Like = {
    ...option,
    id: newOptionId,
    createdAt: ts,
    updatedAt: ts,
    isSelected: undefined,
    votes: undefined,
  }
  if (cloned.isSelected === undefined) delete cloned.isSelected
  if (cloned.votes === undefined) delete cloned.votes

  // Insert into destination
  if (Array.isArray(destPayload.selections)) {
    // V4 destination
    const destSelections = destPayload.selections as DecisionV3Like[]
    let found = false
    const updatedDest = destSelections.map((sel) => {
      if (sel.id !== destDecisionId) return sel
      found = true
      const options = (sel.options || []) as OptionV3Like[]
      return { ...sel, options: [...options, cloned], updatedAt: ts }
    })
    if (!found) throw new Error('Destination selection not found')
    return {
      destPayload: { ...destPayload, selections: updatedDest },
      newOptionId,
      entityName: option.name || 'Untitled option',
    }
  }

  // V3 destination
  const destRooms = (destPayload.rooms || []) as RoomV3Like[]
  let found = false

  const updatedDestRooms = destRooms.map((room) => {
    if (room.id !== destRoomId) return room
    return {
      ...room,
      decisions: room.decisions.map((dec) => {
        if (dec.id !== destDecisionId) return dec
        found = true
        const options = (dec.options || []) as OptionV3Like[]
        return {
          ...dec,
          options: [...options, cloned],
          updatedAt: ts,
        }
      }),
      updatedAt: ts,
    }
  })

  if (!found) throw new Error('Destination decision not found')

  return {
    destPayload: { ...destPayload, rooms: updatedDestRooms },
    newOptionId,
    entityName: option.name || 'Untitled option',
  }
}
