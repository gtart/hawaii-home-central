import { prisma } from '@/lib/prisma'
import type { RoomTypeV3 } from '@/data/finish-decisions'

// Fallback to static JSON
import defaultSelectionsJson from '@/data/default-selections.json'

/**
 * Load default decisions by room type from SiteSetting.
 * Falls back to static JSON if not found.
 */
export async function getDefaultDecisionsByRoomType(): Promise<Record<RoomTypeV3, string[]>> {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: 'default_decisions_by_room_type' },
    })
    if (setting) return JSON.parse(setting.value)
  } catch { /* fall through */ }
  return defaultSelectionsJson.decisionsByRoomType as Record<RoomTypeV3, string[]>
}

/**
 * Load selection emoji map from SiteSetting.
 * Falls back to static JSON if not found.
 */
export async function getSelectionEmojiMap(): Promise<Record<string, string>> {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: 'selection_emoji_map' },
    })
    if (setting) return JSON.parse(setting.value)
  } catch { /* fall through */ }
  return defaultSelectionsJson.selectionEmojis
}
