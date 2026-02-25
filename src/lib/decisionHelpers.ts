import type { DecisionV3, OptionV3, RoomV3, StatusV3 } from '@/data/finish-decisions'

// ============================================================================
// Room-level Uncategorized (per-room unsorted ideas)
// ============================================================================

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

// ============================================================================
// Global Unsorted Room (cross-room dump bucket)
// ============================================================================

/**
 * Find the Global Unsorted room in the rooms array.
 */
export function findGlobalUnsortedRoom(rooms: RoomV3[]): RoomV3 | undefined {
  return rooms.find((r) => r.systemKey === 'global_uncategorized')
}

/**
 * Returns true if this room is the global unsorted bucket.
 */
export function isGlobalUnsorted(room: RoomV3): boolean {
  return room.systemKey === 'global_uncategorized'
}

/**
 * Create a new Global Unsorted room with an empty Uncategorized decision inside.
 */
export function createGlobalUnsortedRoom(): RoomV3 {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    type: 'other',
    name: 'Unsorted',
    systemKey: 'global_uncategorized',
    decisions: [createUncategorizedDecision()],
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Ensure the rooms array contains a Global Unsorted room.
 * Returns the array unchanged if one already exists, otherwise prepends it.
 */
export function ensureGlobalUnsortedRoom(rooms: RoomV3[]): RoomV3[] {
  if (findGlobalUnsortedRoom(rooms)) return rooms
  return [createGlobalUnsortedRoom(), ...rooms]
}

/**
 * Get the total number of unsorted ideas in the Global Unsorted room.
 */
export function getGlobalUnsortedCount(rooms: RoomV3[]): number {
  const room = findGlobalUnsortedRoom(rooms)
  if (!room) return 0
  const uncat = findUncategorizedDecision(room)
  return uncat ? uncat.options.length : 0
}

// ============================================================================
// Cross-room move helper
// ============================================================================

/**
 * Move an option from one room/decision to another room/decision.
 * Pure function — returns a new rooms array.
 *
 * If targetDecisionId is null, the option goes to the target room's Uncategorized
 * decision (created if needed).
 *
 * If newSelectionTitle is provided and targetDecisionId is null, a new decision
 * with that title is created in the target room instead.
 */
export function moveOption(
  rooms: RoomV3[],
  sourceRoomId: string,
  sourceDecisionId: string,
  optionId: string,
  targetRoomId: string,
  targetDecisionId: string | null,
  newSelectionTitle?: string,
): RoomV3[] {
  const now = new Date().toISOString()

  // Find the option to move
  const sourceRoom = rooms.find((r) => r.id === sourceRoomId)
  const sourceDecision = sourceRoom?.decisions.find((d) => d.id === sourceDecisionId)
  const option = sourceDecision?.options.find((o) => o.id === optionId)
  if (!option) return rooms

  // Determine actual target decision ID
  let resolvedTargetDecisionId = targetDecisionId

  return rooms.map((room) => {
    // Handle source room: remove the option
    if (room.id === sourceRoomId && room.id !== targetRoomId) {
      return {
        ...room,
        decisions: room.decisions.map((d) =>
          d.id === sourceDecisionId
            ? { ...d, options: d.options.filter((o) => o.id !== optionId), updatedAt: now }
            : d
        ),
        updatedAt: now,
      }
    }

    // Handle target room: add the option
    if (room.id === targetRoomId && room.id !== sourceRoomId) {
      let updatedRoom = { ...room }

      // Create new selection if title provided
      if (newSelectionTitle && !resolvedTargetDecisionId) {
        const newDecision: DecisionV3 = {
          id: crypto.randomUUID(),
          title: newSelectionTitle,
          status: 'deciding' as StatusV3,
          notes: '',
          options: [],
          createdAt: now,
          updatedAt: now,
        }
        updatedRoom = { ...updatedRoom, decisions: [...updatedRoom.decisions, newDecision] }
        resolvedTargetDecisionId = newDecision.id
      }

      // Fall back to uncategorized if no target decision
      if (!resolvedTargetDecisionId) {
        updatedRoom = ensureUncategorizedDecision(updatedRoom)
        const uncat = findUncategorizedDecision(updatedRoom)!
        resolvedTargetDecisionId = uncat.id
      }

      return {
        ...updatedRoom,
        decisions: updatedRoom.decisions.map((d) =>
          d.id === resolvedTargetDecisionId
            ? { ...d, options: [...d.options, { ...option, updatedAt: now }], updatedAt: now }
            : d
        ),
        updatedAt: now,
      }
    }

    // Handle same-room move (source === target)
    if (room.id === sourceRoomId && room.id === targetRoomId) {
      let updatedRoom = { ...room }

      // Create new selection if title provided
      if (newSelectionTitle && !resolvedTargetDecisionId) {
        const newDecision: DecisionV3 = {
          id: crypto.randomUUID(),
          title: newSelectionTitle,
          status: 'deciding' as StatusV3,
          notes: '',
          options: [],
          createdAt: now,
          updatedAt: now,
        }
        updatedRoom = { ...updatedRoom, decisions: [...updatedRoom.decisions, newDecision] }
        resolvedTargetDecisionId = newDecision.id
      }

      // Fall back to uncategorized if no target decision
      if (!resolvedTargetDecisionId) {
        updatedRoom = ensureUncategorizedDecision(updatedRoom)
        const uncat = findUncategorizedDecision(updatedRoom)!
        resolvedTargetDecisionId = uncat.id
      }

      return {
        ...updatedRoom,
        decisions: updatedRoom.decisions.map((d) => {
          if (d.id === sourceDecisionId && d.id === resolvedTargetDecisionId) {
            // Same decision — no-op
            return d
          }
          if (d.id === sourceDecisionId) {
            return { ...d, options: d.options.filter((o) => o.id !== optionId), updatedAt: now }
          }
          if (d.id === resolvedTargetDecisionId) {
            return { ...d, options: [...d.options, { ...option, updatedAt: now }], updatedAt: now }
          }
          return d
        }),
        updatedAt: now,
      }
    }

    return room
  })
}
