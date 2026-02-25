import { prisma } from '@/lib/prisma'
import type { FinishDecisionKit, KitDecision } from '@/data/finish-decision-kits'
import type { KitAuthorType, RoomTypeV3 } from '@/data/finish-decisions'

// Fallback to static JSON when DB is empty
import ideaPacksJson from '@/data/idea-packs.json'

/**
 * Load published idea packs from the database.
 * Returns FinishDecisionKit[] for user-facing consumption.
 * Falls back to static JSON if DB has no published packs.
 */
export async function getPublishedIdeaPacks(): Promise<FinishDecisionKit[]> {
  try {
    const rows = await prisma.ideaPack.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { sortOrder: 'asc' },
    })

    if (rows.length === 0) {
      // Fallback to static JSON
      return ideaPacksJson as FinishDecisionKit[]
    }

    return rows.map((row) => ({
      id: row.packId,
      label: row.label,
      description: row.description,
      author: row.author.toLowerCase() as KitAuthorType,
      roomTypes: row.roomTypes as RoomTypeV3[],
      decisionTitles: (row.decisions as unknown as KitDecision[]).map((d) => d.title),
      decisions: row.decisions as unknown as KitDecision[],
    }))
  } catch {
    // DB unavailable — use static fallback
    return ideaPacksJson as FinishDecisionKit[]
  }
}

/**
 * Load all idea packs for admin (all statuses).
 */
export async function getAllIdeaPacks() {
  return prisma.ideaPack.findMany({
    orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
  })
}

/**
 * Get a single idea pack by Prisma id.
 */
export async function getIdeaPackById(id: string) {
  return prisma.ideaPack.findUnique({ where: { id } })
}

/**
 * Get a single idea pack by packId slug.
 */
export async function getIdeaPackByPackId(packId: string) {
  return prisma.ideaPack.findUnique({ where: { packId } })
}
