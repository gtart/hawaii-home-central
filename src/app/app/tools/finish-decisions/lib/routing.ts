/**
 * Centralized routing helpers for Selection Boards (finish-decisions).
 * All decision links should use these helpers to ensure consistent routing.
 */

const BASE = '/app/tools/finish-decisions'

export function buildDecisionHref({
  decisionId,
  collectionId,
}: {
  decisionId: string
  collectionId?: string
}): string {
  if (collectionId) {
    return `${BASE}/${collectionId}/decision/${decisionId}`
  }
  return `${BASE}/decision/${decisionId}`
}

export function buildBoardHref(collectionId?: string): string {
  if (collectionId) {
    return `${BASE}/${collectionId}`
  }
  return BASE
}
