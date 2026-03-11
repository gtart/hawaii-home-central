import { NextResponse } from 'next/server'
import { type Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { validateCollectionShareToken } from '@/lib/collection-access'
import { writeActivityEvents } from '@/server/activity/writeActivityEvent'
import type { AlignmentItem, AlignmentGuestResponse } from '@/data/alignment'

const MAX_RESPONSES_PER_HOUR = 10
const MAX_TEXT_LENGTH = 1000
const MAX_NAME_LENGTH = 100

/**
 * POST /api/share/[token]/respond
 *
 * Guest contractor response endpoint. Appends a structured response
 * to a single alignment item's guest_responses[] array.
 *
 * Uses narrowest possible append-only payload mutation with
 * optimistic concurrency (updatedAt check + single retry).
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  // Validate share token
  const tokenRecord = await validateCollectionShareToken(token)
  if (!tokenRecord) {
    return NextResponse.json({ error: 'Invalid or expired share link' }, { status: 404 })
  }

  const { collection } = tokenRecord
  if (collection.toolKey !== 'project_alignment') {
    return NextResponse.json({ error: 'This link does not support responses' }, { status: 400 })
  }

  const settings = tokenRecord.settings as Record<string, unknown> | null
  if (!settings || settings.allowResponses !== true) {
    return NextResponse.json({ error: 'Responses are not enabled for this link' }, { status: 403 })
  }

  // Rate limiting by IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const oneHourAgo = new Date(Date.now() - 3600_000)
  const recentCount = await prisma.activityEvent.count({
    where: {
      collectionId: collection.id,
      action: 'guest_responded',
      createdAt: { gte: oneHourAgo },
      metadata: { path: ['ip'], equals: ip },
    },
  })
  if (recentCount >= MAX_RESPONSES_PER_HOUR) {
    return NextResponse.json({ error: 'Too many responses. Please try again later.' }, { status: 429 })
  }

  // Parse request body
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const itemId = typeof body.itemId === 'string' ? body.itemId : ''
  const respondentName = typeof body.respondent_name === 'string' ? body.respondent_name.trim().slice(0, MAX_NAME_LENGTH) : ''

  if (!itemId) return NextResponse.json({ error: 'itemId is required' }, { status: 400 })
  if (!respondentName) return NextResponse.json({ error: 'respondent_name is required' }, { status: 400 })

  // Build response object
  const guestResponse: AlignmentGuestResponse = {
    id: `gr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    share_token: token,
    respondent_name: respondentName,
    respondent_email: typeof body.respondent_email === 'string' ? body.respondent_email.trim().slice(0, 200) : undefined,
    understanding_of_issue: truncateOpt(body.understanding_of_issue),
    included_not_included_unsure: validateInclusion(body.included_not_included_unsure),
    cost_impact: truncateOpt(body.cost_impact),
    schedule_impact: truncateOpt(body.schedule_impact),
    suggested_resolution: truncateOpt(body.suggested_resolution),
    note: truncateOpt(body.note),
    created_at: new Date().toISOString(),
  }

  // Attempt append with optimistic concurrency + single retry
  for (let attempt = 0; attempt < 2; attempt++) {
    const current = await prisma.toolCollection.findUnique({
      where: { id: collection.id },
      select: { payload: true, updatedAt: true },
    })

    if (!current) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    const payload = current.payload as Record<string, unknown>
    const items = Array.isArray(payload.items) ? (payload.items as AlignmentItem[]) : []

    // Verify the item exists and is in scope
    const scope = settings.scope as { mode?: string; itemIds?: string[] } | undefined
    const isInScope = !scope || scope.mode === 'all' || (Array.isArray(scope.itemIds) && scope.itemIds.includes(itemId))
    const targetItem = items.find((i) => i.id === itemId)

    if (!targetItem || !isInScope) {
      return NextResponse.json({ error: 'Item not found or not accessible' }, { status: 404 })
    }

    // Narrowest append-only mutation: only touch this item's guest_responses[]
    const updatedItems = items.map((item) => {
      if (item.id !== itemId) return item
      const updatedItem = {
        ...item,
        guest_responses: [...(item.guest_responses || []), guestResponse],
        updated_at: new Date().toISOString(),
      }
      // Auto-update status if currently waiting on contractor
      if (item.status === 'waiting_on_contractor') {
        updatedItem.status = 'waiting_on_homeowner'
      }
      return updatedItem
    })

    // Optimistic concurrency: check updatedAt hasn't changed
    const result = await prisma.toolCollection.updateMany({
      where: {
        id: collection.id,
        updatedAt: current.updatedAt,
      },
      data: {
        payload: { ...payload, items: updatedItems } as unknown as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
    })

    if (result.count === 0) {
      // Conflict — retry once
      if (attempt === 0) continue
      return NextResponse.json(
        { error: 'Another update was in progress. Please try again.' },
        { status: 409 }
      )
    }

    // Success — log activity event (fire-and-forget)
    writeActivityEvents([{
      projectId: collection.projectId,
      toolKey: 'project_alignment',
      collectionId: collection.id,
      entityType: 'item',
      entityId: itemId,
      action: 'guest_responded',
      summaryText: `${respondentName} responded to #${targetItem.itemNumber}: "${targetItem.title}"`,
      entityLabel: targetItem.title,
      metadata: { ip, respondentName: respondentName },
    }]).catch(() => {})

    return NextResponse.json({ success: true }, { status: 200 })
  }

  // Should not reach here, but just in case
  return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
}

function truncateOpt(val: unknown): string | undefined {
  if (typeof val !== 'string') return undefined
  const trimmed = val.trim()
  if (!trimmed) return undefined
  return trimmed.slice(0, MAX_TEXT_LENGTH)
}

function validateInclusion(val: unknown): 'included' | 'not_included' | 'unsure' | undefined {
  if (val === 'included' || val === 'not_included' || val === 'unsure') return val
  return undefined
}
