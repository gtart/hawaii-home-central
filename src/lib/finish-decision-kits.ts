import type {
  DecisionV3,
  OptionV3,
  OptionOriginV3,
  SelectionV4,
} from '@/data/finish-decisions'
import { ROOM_TYPE_OPTIONS_V3 } from '@/data/finish-decisions'
import { type FinishDecisionKit } from '@/data/finish-decision-kits'

/** Map a roomType slug to its user-facing label (e.g. "kitchen" → "Kitchen") */
function roomTypeLabel(roomType: string): string | null {
  const found = ROOM_TYPE_OPTIONS_V3.find((r) => r.value === roomType)
  return found?.label ?? null
}

// ============================================================================
// Deterministic option key for deduplication
// ============================================================================

/** Generate a stable key for a kit option (used to prevent duplicates on re-apply) */
export function generateOptionKey(kitId: string, decisionTitle: string, optionName: string): string {
  return [kitId, decisionTitle, optionName]
    .join('-')
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ============================================================================
// Finders (parameterized — caller passes the kits array)
// ============================================================================

/** Return kits that have options for a specific decision/selection title */
export function findKitsForDecisionTitle(
  kits: FinishDecisionKit[],
  decisionTitle: string,
  _roomType?: string,
): FinishDecisionKit[] {
  const titleLower = decisionTitle.toLowerCase()
  return kits.filter(
    (kit) => kit.decisionTitles.some((t) => t.toLowerCase() === titleLower)
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

  // Build set of existing option keys for dedup
  const existingKeys = new Set<string>()
  for (const opt of decision.options) {
    if (opt.origin?.kitId === kit.id && opt.origin?.optionKey) {
      existingKeys.add(opt.origin.optionKey)
    }
  }

  const matchingKitDecisions = kit.decisions.filter(
    (kd) => kd.title.toLowerCase() === titleLower
  )

  const newOptions: OptionV3[] = []
  for (const kd of matchingKitDecisions) {
    for (const ko of kd.options) {
      const optionKey = generateOptionKey(kit.id, kd.title, ko.name)
      if (existingKeys.has(optionKey)) continue

      const origin: OptionOriginV3 = {
        kitId: kit.id,
        kitLabel: kit.label,
        author: kit.author,
        optionKey,
      }

      newOptions.push({
        id: crypto.randomUUID(),
        name: ko.name,
        notes: ko.notes,
        urls: [],
        origin,
        createdAt: now,
        updatedAt: now,
      })
    }
  }

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
// V4 Workspace-level kit operations (flat selections, no room wrapper)
// ============================================================================

export interface ApplyKitToWorkspaceResult {
  selections: SelectionV4[]
  appliedKitIds: string[]
  addedSelectionCount: number
  addedOptionCount: number
}

/**
 * Apply an ideas pack to a flat selections array (V4 workspace-level).
 */
export function applyKitToWorkspace(
  selections: SelectionV4[],
  appliedKitIds: string[],
  kit: FinishDecisionKit
): ApplyKitToWorkspaceResult {
  const now = new Date().toISOString()
  let addedSelectionCount = 0
  let addedOptionCount = 0

  const updated = selections.map((s) => ({ ...s }))

  for (const kitDec of kit.decisions) {
    const titleLower = kitDec.title.toLowerCase()
    const existingIdx = updated.findIndex(
      (s) => s.title.toLowerCase() === titleLower
    )

    const existingKeys = new Set<string>()
    if (existingIdx >= 0) {
      for (const opt of updated[existingIdx].options) {
        if (opt.origin?.kitId === kit.id && opt.origin?.optionKey) {
          existingKeys.add(opt.origin.optionKey)
        }
      }
    }

    const newOptions: OptionV3[] = []
    for (const ko of kitDec.options) {
      const optionKey = generateOptionKey(kit.id, kitDec.title, ko.name)
      if (existingKeys.has(optionKey)) continue

      const origin: OptionOriginV3 = {
        kitId: kit.id,
        kitLabel: kit.label,
        author: kit.author,
        optionKey,
      }

      newOptions.push({
        id: crypto.randomUUID(),
        name: ko.name,
        notes: ko.notes,
        urls: [],
        origin,
        createdAt: now,
        updatedAt: now,
      })
    }

    addedOptionCount += newOptions.length

    if (existingIdx >= 0) {
      if (newOptions.length > 0) {
        updated[existingIdx] = {
          ...updated[existingIdx],
          options: [...updated[existingIdx].options, ...newOptions],
          updatedAt: now,
        }
      }
    } else {
      if (newOptions.length > 0) {
        addedSelectionCount++
        // Auto-set location from pack's room type (first room type)
        const packLocation = kit.roomTypes.length > 0 ? roomTypeLabel(kit.roomTypes[0]) : null
        // Auto-set labels from pack's room type labels
        const packLabels = kit.roomTypes
          .map((rt) => roomTypeLabel(rt))
          .filter((l): l is string => l !== null)
        const newSelection: SelectionV4 = {
          id: crypto.randomUUID(),
          title: kitDec.title,
          status: 'deciding',
          notes: '',
          options: newOptions,
          tags: packLabels,
          location: packLocation || undefined,
          originKitId: kit.id,
          createdAt: now,
          updatedAt: now,
        }
        updated.push(newSelection)
      }
    }
  }

  const newAppliedKitIds = appliedKitIds.includes(kit.id)
    ? appliedKitIds
    : [...appliedKitIds, kit.id]

  return {
    selections: updated,
    appliedKitIds: newAppliedKitIds,
    addedSelectionCount,
    addedOptionCount,
  }
}

/**
 * Remove all options/selections added by a specific kit (V4 workspace-level).
 */
export function removeKitFromWorkspace(
  selections: SelectionV4[],
  appliedKitIds: string[],
  kitId: string
): { selections: SelectionV4[]; appliedKitIds: string[] } {
  const now = new Date().toISOString()

  const filtered = selections
    .map((s) => {
      const remainingOptions = s.options.filter(
        (o) => o.origin?.kitId !== kitId
      )
      if (s.originKitId === kitId && remainingOptions.length === 0) {
        return null
      }
      return { ...s, options: remainingOptions, updatedAt: now }
    })
    .filter((s): s is SelectionV4 => s !== null)

  return {
    selections: filtered,
    appliedKitIds: appliedKitIds.filter((id) => id !== kitId),
  }
}
