import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export interface ActivityEventInput {
  projectId: string
  toolKey: string
  collectionId?: string
  entityType?: string
  entityId?: string
  action: string
  summaryText: string
  entityLabel?: string
  detailText?: string
  actorUserId?: string
  /** Structured metadata for durable context (e.g. commentId, refEntityId) */
  metadata?: Record<string, unknown>
}

const MAX_SUMMARY_LENGTH = 200

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + '…' : text
}

/**
 * Write one or more activity events. Never throws — errors are logged
 * but swallowed so mutations are never blocked by feed writes.
 */
export async function writeActivityEvents(events: ActivityEventInput[]): Promise<void> {
  if (events.length === 0) return
  try {
    await prisma.activityEvent.createMany({
      data: events.map((e) => ({
        projectId: e.projectId,
        toolKey: e.toolKey,
        collectionId: e.collectionId ?? null,
        entityType: e.entityType ?? null,
        entityId: e.entityId ?? null,
        action: e.action,
        summaryText: truncate(e.summaryText, MAX_SUMMARY_LENGTH),
        entityLabel: e.entityLabel ? truncate(e.entityLabel, MAX_SUMMARY_LENGTH) : null,
        detailText: e.detailText ? truncate(e.detailText, MAX_SUMMARY_LENGTH) : null,
        actorUserId: e.actorUserId ?? null,
        metadata: (e.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      })),
    })
  } catch (err) {
    console.error('[activity] Failed to write events:', err)
  }
}
