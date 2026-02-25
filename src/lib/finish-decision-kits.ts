import type {
  RoomV3,
  DecisionV3,
  OptionV3,
  RoomTypeV3,
  OptionOriginV3,
} from '@/data/finish-decisions'
import { type FinishDecisionKit } from '@/data/finish-decision-kits'

// ============================================================================
// Finders (parameterized — caller passes the kits array)
// ============================================================================

/** Return kits that match a given room type */
export function findKitsForRoomType(
  kits: FinishDecisionKit[],
  roomType: RoomTypeV3
): FinishDecisionKit[] {
  return kits.filter(
    (kit) => kit.roomTypes.length === 0 || kit.roomTypes.includes(roomType)
  )
}

/** Return kits that have options for a specific decision title */
export function findKitsForDecisionTitle(
  kits: FinishDecisionKit[],
  decisionTitle: string,
  roomType: RoomTypeV3
): FinishDecisionKit[] {
  const titleLower = decisionTitle.toLowerCase()
  return kits.filter(
    (kit) =>
      (kit.roomTypes.length === 0 || kit.roomTypes.includes(roomType)) &&
      kit.decisionTitles.some((t) => t.toLowerCase() === titleLower)
  )
}

/** Get a kit by ID */
export function getKitById(
  kits: FinishDecisionKit[],
  kitId: string
): FinishDecisionKit | undefined {
  return kits.find((k) => k.id === kitId)
}

// ============================================================================
// Apply Kit → Room (pure function, returns new room)
// ============================================================================

export interface ApplyKitResult {
  room: RoomV3
  addedDecisionCount: number
  addedOptionCount: number
}

/**
 * Apply an ideas pack to a room.
 *
 * - For each kit decision, if a matching room decision exists (title match,
 *   case-insensitive), new options are appended.
 * - If no matching decision exists, a new decision is created.
 * - Options are tagged with `origin` for provenance.
 * - The kit ID is recorded in `room.appliedKitIds`.
 */
export function applyKitToRoom(
  room: RoomV3,
  kit: FinishDecisionKit
): ApplyKitResult {
  const now = new Date().toISOString()
  let addedDecisionCount = 0
  let addedOptionCount = 0

  const origin: OptionOriginV3 = {
    kitId: kit.id,
    kitLabel: kit.label,
    author: kit.author,
  }

  // Clone decisions array for mutation
  const decisions = room.decisions.map((d) => ({ ...d }))

  for (const kitDec of kit.decisions) {
    const titleLower = kitDec.title.toLowerCase()
    const existingIdx = decisions.findIndex(
      (d) => d.title.toLowerCase() === titleLower
    )

    const newOptions: OptionV3[] = kitDec.options.map((ko) => ({
      id: crypto.randomUUID(),
      name: ko.name,
      notes: ko.notes,
      urls: [],
      origin,
      createdAt: now,
      updatedAt: now,
    }))

    addedOptionCount += newOptions.length

    if (existingIdx >= 0) {
      // Merge options into existing decision
      decisions[existingIdx] = {
        ...decisions[existingIdx],
        options: [...decisions[existingIdx].options, ...newOptions],
        updatedAt: now,
      }
    } else {
      // Create new decision
      addedDecisionCount++
      const newDecision: DecisionV3 = {
        id: crypto.randomUUID(),
        title: kitDec.title,
        status: 'deciding',
        notes: '',
        options: newOptions,
        originKitId: kit.id,
        createdAt: now,
        updatedAt: now,
      }
      decisions.push(newDecision)
    }
  }

  const appliedKitIds = [...(room.appliedKitIds || []), kit.id]

  return {
    room: { ...room, decisions, appliedKitIds, updatedAt: now },
    addedDecisionCount,
    addedOptionCount,
  }
}

// ============================================================================
// Apply Kit → Single Decision (for decision-level import)
// ============================================================================

export interface ApplyKitToDecisionResult {
  decision: DecisionV3
  addedOptionCount: number
}

/**
 * Apply options from a kit for a specific decision title.
 * Only adds options that match the decision's title.
 */
export function applyKitToDecision(
  decision: DecisionV3,
  kit: FinishDecisionKit
): ApplyKitToDecisionResult {
  const now = new Date().toISOString()
  const titleLower = decision.title.toLowerCase()

  const origin: OptionOriginV3 = {
    kitId: kit.id,
    kitLabel: kit.label,
    author: kit.author,
  }

  const matchingKitDecisions = kit.decisions.filter(
    (kd) => kd.title.toLowerCase() === titleLower
  )

  const newOptions: OptionV3[] = matchingKitDecisions.flatMap((kd) =>
    kd.options.map((ko) => ({
      id: crypto.randomUUID(),
      name: ko.name,
      notes: ko.notes,
      urls: [],
      origin,
      createdAt: now,
      updatedAt: now,
    }))
  )

  return {
    decision: {
      ...decision,
      options: [...decision.options, ...newOptions],
      updatedAt: now,
    },
    addedOptionCount: newOptions.length,
  }
}

// ============================================================================
// Remove Kit from Room (undo)
// ============================================================================

/**
 * Remove all options and decisions that were added by a specific kit.
 * Decisions that existed before the kit (but got kit options merged) keep
 * their non-kit options. Decisions that were wholly created by the kit
 * are removed entirely.
 */
export function removeKitFromRoom(room: RoomV3, kitId: string): RoomV3 {
  const now = new Date().toISOString()

  const decisions = room.decisions
    .map((d) => {
      // Filter out options from this kit
      const remainingOptions = d.options.filter(
        (o) => o.origin?.kitId !== kitId
      )

      // If decision was created by this kit and has no remaining options, remove it
      if (d.originKitId === kitId && remainingOptions.length === 0) {
        return null
      }

      return { ...d, options: remainingOptions, updatedAt: now }
    })
    .filter((d): d is DecisionV3 => d !== null)

  const appliedKitIds = (room.appliedKitIds || []).filter((id) => id !== kitId)

  return { ...room, decisions, appliedKitIds, updatedAt: now }
}
