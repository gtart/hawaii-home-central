import type { SelectionV4 } from '@/data/finish-decisions'

// ============================================================================
// Tag helpers (V4 — flat selections with tags)
// ============================================================================

/** Add a tag to a selection (no-op if already present). */
export function addTag(selection: SelectionV4, tag: string): SelectionV4 {
  if (selection.tags.includes(tag)) return selection
  return { ...selection, tags: [...selection.tags, tag], updatedAt: new Date().toISOString() }
}

/** Remove a tag from a selection. */
export function removeTag(selection: SelectionV4, tag: string): SelectionV4 {
  if (!selection.tags.includes(tag)) return selection
  return { ...selection, tags: selection.tags.filter((t) => t !== tag), updatedAt: new Date().toISOString() }
}

/** Get all unique tags across selections. */
export function getUniqueTags(selections: SelectionV4[]): string[] {
  const tags = new Set<string>()
  for (const s of selections) {
    for (const t of s.tags) tags.add(t)
  }
  return Array.from(tags).sort()
}

/** Filter selections by tag (returns all selections that have the tag). */
export function filterByTag(selections: SelectionV4[], tag: string): SelectionV4[] {
  return selections.filter((s) => s.tags.includes(tag))
}

/** Filter selections by multiple tags (returns selections that have ANY of the tags). */
export function filterByTags(selections: SelectionV4[], tags: string[]): SelectionV4[] {
  if (tags.length === 0) return selections
  return selections.filter((s) => tags.some((t) => s.tags.includes(t)))
}

/** Group selections by a specific tag dimension. Returns a Map of tag → selections. */
export function groupByTag(selections: SelectionV4[]): Map<string, SelectionV4[]> {
  const groups = new Map<string, SelectionV4[]>()
  const untagged: SelectionV4[] = []

  for (const s of selections) {
    if (s.tags.length === 0) {
      untagged.push(s)
    } else {
      for (const t of s.tags) {
        if (!groups.has(t)) groups.set(t, [])
        groups.get(t)!.push(s)
      }
    }
  }

  if (untagged.length > 0) {
    groups.set('Untagged', untagged)
  }

  return groups
}

// ============================================================================
// Location helpers (V4 — single-value location field)
// ============================================================================

/** Get all unique locations across selections (sorted, excludes empty). */
export function getUniqueLocations(selections: SelectionV4[]): string[] {
  const locs = new Set<string>()
  for (const s of selections) {
    if (s.location) locs.add(s.location)
  }
  return Array.from(locs).sort()
}

/** Filter selections by location (returns selections with matching location). */
export function filterByLocations(selections: SelectionV4[], locations: string[]): SelectionV4[] {
  if (locations.length === 0) return selections
  return selections.filter((s) => s.location && locations.includes(s.location))
}

/** Group selections by location. Returns a Map of location → selections. */
export function groupByLocation(selections: SelectionV4[]): Map<string, SelectionV4[]> {
  const groups = new Map<string, SelectionV4[]>()
  const noLocation: SelectionV4[] = []

  for (const s of selections) {
    if (!s.location) {
      noLocation.push(s)
    } else {
      if (!groups.has(s.location)) groups.set(s.location, [])
      groups.get(s.location)!.push(s)
    }
  }

  if (noLocation.length > 0) {
    groups.set('No location', noLocation)
  }

  return groups
}

// ============================================================================
// Move helper (V4 — move an idea between selections)
// ============================================================================

/**
 * Move an idea from one selection to another.
 * If targetSelectionId is null and newSelectionTitle is provided, creates a new selection.
 */
export function moveIdea(
  selections: SelectionV4[],
  sourceSelectionId: string,
  optionId: string,
  targetSelectionId: string | null,
  newSelectionTitle?: string,
): SelectionV4[] {
  const now = new Date().toISOString()

  // Find the option to move
  const sourceSelection = selections.find((s) => s.id === sourceSelectionId)
  const option = sourceSelection?.options.find((o) => o.id === optionId)
  if (!option) return selections

  let resolvedTargetId = targetSelectionId
  let result = [...selections]

  // Create new selection if title provided and no target
  if (newSelectionTitle && !resolvedTargetId) {
    const newSelection: SelectionV4 = {
      id: crypto.randomUUID(),
      title: newSelectionTitle,
      status: 'deciding',
      notes: '',
      options: [],
      tags: sourceSelection?.tags ?? [],
      createdAt: now,
      updatedAt: now,
    }
    result = [...result, newSelection]
    resolvedTargetId = newSelection.id
  }

  if (!resolvedTargetId || resolvedTargetId === sourceSelectionId) return selections

  return result.map((s) => {
    if (s.id === sourceSelectionId) {
      return { ...s, options: s.options.filter((o) => o.id !== optionId), updatedAt: now }
    }
    if (s.id === resolvedTargetId) {
      return { ...s, options: [...s.options, { ...option, updatedAt: now }], updatedAt: now }
    }
    return s
  })
}
