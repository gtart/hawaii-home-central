import type { DecisionV3, RoomV3, StatusV3 } from '@/data/finish-decisions'

/**
 * Find the Uncategorized system selection in a room, if it exists.
 */
export function findUncategorizedDecision(room: RoomV3): DecisionV3 | undefined {
  return room.decisions.find((d) => d.systemKey === 'uncategorized')
}

/**
 * Returns true if this decision is a system-managed "Uncategorized" selection.
 */
export function isUncategorized(decision: DecisionV3): boolean {
  return decision.systemKey === 'uncategorized'
}

/**
 * Create a new Uncategorized decision object (does NOT insert it into a room).
 */
export function createUncategorizedDecision(): DecisionV3 {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    title: 'Uncategorized',
    status: 'deciding' as StatusV3,
    notes: '',
    options: [],
    systemKey: 'uncategorized',
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Ensure a room has an Uncategorized decision. Returns the room unchanged if
 * it already has one, or a new room object with Uncategorized prepended.
 */
export function ensureUncategorizedDecision(room: RoomV3): RoomV3 {
  const existing = findUncategorizedDecision(room)
  if (existing) return room
  return {
    ...room,
    decisions: [createUncategorizedDecision(), ...room.decisions],
    updatedAt: new Date().toISOString(),
  }
}
