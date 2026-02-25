import type { FinishDecisionKit, KitDecision } from '@/data/finish-decision-kits'

export interface DecisionDiff {
  title: string
  addedOptions: string[]
  removedOptions: string[]
}

export interface PackDiff {
  type: 'new' | 'update'
  packId: string
  label: string
  metadataChanges: string[]
  addedDecisions: string[]
  removedDecisions: string[]
  modifiedDecisions: DecisionDiff[]
  summary: string
}

/**
 * Compare an existing pack (or null for new) against an incoming pack.
 * Returns a structured diff describing what changed.
 */
export function diffPack(
  existing: FinishDecisionKit | null,
  incoming: FinishDecisionKit
): PackDiff {
  if (!existing) {
    const totalOptions = incoming.decisions.reduce((sum, d) => sum + d.options.length, 0)
    return {
      type: 'new',
      packId: incoming.id,
      label: incoming.label,
      metadataChanges: [],
      addedDecisions: incoming.decisions.map((d) => d.title),
      removedDecisions: [],
      modifiedDecisions: [],
      summary: `New pack "${incoming.label}" with ${incoming.decisions.length} decisions, ${totalOptions} options`,
    }
  }

  const metadataChanges: string[] = []
  if (existing.label !== incoming.label) {
    metadataChanges.push(`Label: "${existing.label}" → "${incoming.label}"`)
  }
  if (existing.description !== incoming.description) {
    metadataChanges.push('Description changed')
  }
  if (existing.author !== incoming.author) {
    metadataChanges.push(`Author: ${existing.author} → ${incoming.author}`)
  }
  const existingRooms = [...existing.roomTypes].sort().join(',')
  const incomingRooms = [...incoming.roomTypes].sort().join(',')
  if (existingRooms !== incomingRooms) {
    metadataChanges.push(`Room types: [${existingRooms}] → [${incomingRooms}]`)
  }

  const existingDecisionMap = new Map<string, KitDecision>()
  for (const d of existing.decisions) {
    existingDecisionMap.set(d.title.toLowerCase(), d)
  }

  const incomingDecisionMap = new Map<string, KitDecision>()
  for (const d of incoming.decisions) {
    incomingDecisionMap.set(d.title.toLowerCase(), d)
  }

  const addedDecisions: string[] = []
  const removedDecisions: string[] = []
  const modifiedDecisions: DecisionDiff[] = []

  // Check for added and modified
  for (const d of incoming.decisions) {
    const key = d.title.toLowerCase()
    const existingD = existingDecisionMap.get(key)
    if (!existingD) {
      addedDecisions.push(d.title)
    } else {
      const existingNames = new Set(existingD.options.map((o) => o.name.toLowerCase()))
      const incomingNames = new Set(d.options.map((o) => o.name.toLowerCase()))

      const added = d.options.filter((o) => !existingNames.has(o.name.toLowerCase())).map((o) => o.name)
      const removed = existingD.options.filter((o) => !incomingNames.has(o.name.toLowerCase())).map((o) => o.name)

      if (added.length > 0 || removed.length > 0) {
        modifiedDecisions.push({ title: d.title, addedOptions: added, removedOptions: removed })
      }
    }
  }

  // Check for removed
  for (const d of existing.decisions) {
    if (!incomingDecisionMap.has(d.title.toLowerCase())) {
      removedDecisions.push(d.title)
    }
  }

  const parts: string[] = []
  if (metadataChanges.length > 0) parts.push(`${metadataChanges.length} metadata change(s)`)
  if (addedDecisions.length > 0) parts.push(`+${addedDecisions.length} decision(s)`)
  if (removedDecisions.length > 0) parts.push(`-${removedDecisions.length} decision(s)`)
  if (modifiedDecisions.length > 0) parts.push(`${modifiedDecisions.length} modified decision(s)`)

  return {
    type: 'update',
    packId: incoming.id,
    label: incoming.label,
    metadataChanges,
    addedDecisions,
    removedDecisions,
    modifiedDecisions,
    summary: parts.length > 0
      ? `Updates "${existing.label}": ${parts.join(', ')}`
      : `No changes to "${existing.label}"`,
  }
}
