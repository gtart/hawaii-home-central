/**
 * Server-side selection-level access enforcement.
 *
 * Loads the collection payload, finds the target selection, and resolves
 * whether the requesting user has access to it. This is the canonical
 * server-side check — call it from any API route that touches a specific
 * selection (comments, export, etc.).
 */

import { prisma } from '@/lib/prisma'
import { resolveCollectionAccess, type CollectionAccessLevel } from '@/lib/collection-access'
import { resolveSelectionAccess, type SelectionV4 } from '@/data/finish-decisions'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SelectionAccessResult {
  /** null = no access */
  selectionAccess: 'edit' | 'view' | null
  /** The workspace-level access (OWNER/EDITOR/VIEWER) */
  workspaceAccess: CollectionAccessLevel
  /** The collection's toolKey */
  toolKey: string
}

// ---------------------------------------------------------------------------
// Main helper
// ---------------------------------------------------------------------------

/**
 * Check whether a user can access a specific selection within a collection.
 *
 * Returns null if the collection doesn't exist, is not a finish_decisions
 * collection, or the user has no workspace access at all.
 *
 * For non-finish_decisions collections, always returns the capped workspace
 * access (comments on punchlist items, mood boards, etc. are not restricted
 * at the entity level).
 */
export async function resolveServerSelectionAccess(
  userId: string,
  userEmail: string,
  collectionId: string,
  selectionId: string,
): Promise<SelectionAccessResult | null> {
  // 1. Resolve workspace-level access
  const workspaceAccess = await resolveCollectionAccess(userId, collectionId)
  if (!workspaceAccess) return null

  // 2. Load the collection to check toolKey and payload
  const collection = await prisma.toolCollection.findUnique({
    where: { id: collectionId },
    select: { toolKey: true, payload: true },
  })
  if (!collection) return null

  // Non-selections tools: no entity-level restrictions
  if (collection.toolKey !== 'finish_decisions') {
    const capped: 'edit' | 'view' =
      workspaceAccess === 'OWNER' || workspaceAccess === 'EDITOR' ? 'edit' : 'view'
    return { selectionAccess: capped, workspaceAccess, toolKey: collection.toolKey }
  }

  // 3. Find the selection in the payload
  const payload = collection.payload as Record<string, unknown> | null
  if (!payload) return null

  const selections = Array.isArray(payload.selections)
    ? (payload.selections as SelectionV4[])
    : []

  const selection = selections.find((s) => s.id === selectionId)
  if (!selection) {
    // Selection not found — could be deleted or invalid ID.
    // Return null access (caller decides how to handle).
    return { selectionAccess: null, workspaceAccess, toolKey: collection.toolKey }
  }

  // 4. Resolve selection-level access
  const selectionAccess = resolveSelectionAccess(selection, userEmail, workspaceAccess)

  return { selectionAccess, workspaceAccess, toolKey: collection.toolKey }
}

// ---------------------------------------------------------------------------
// Bulk helpers — filter selections & get restricted IDs for a user
// ---------------------------------------------------------------------------

/**
 * Return the set of selection IDs that a user CANNOT access within a
 * finish_decisions payload. Used to filter comments and payload responses.
 *
 * If the collection is not finish_decisions or the user is OWNER,
 * returns an empty set (nothing is restricted).
 */
export function getRestrictedSelectionIds(
  selections: SelectionV4[],
  userEmail: string,
  workspaceAccess: CollectionAccessLevel,
): Set<string> {
  // Owners see everything
  if (workspaceAccess === 'OWNER') return new Set()

  const blocked = new Set<string>()
  for (const s of selections) {
    const access = resolveSelectionAccess(s, userEmail, workspaceAccess)
    if (access === null) blocked.add(s.id)
  }
  return blocked
}

/**
 * Filter a selections array to only those the user can access.
 * Returns a new array (does not mutate the input).
 */
export function filterSelectionsForUser(
  selections: SelectionV4[],
  userEmail: string,
  workspaceAccess: CollectionAccessLevel,
): SelectionV4[] {
  if (workspaceAccess === 'OWNER') return selections
  return selections.filter(
    (s) => resolveSelectionAccess(s, userEmail, workspaceAccess) !== null
  )
}
