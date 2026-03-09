/**
 * Centralized routing helpers for Selections (finish-decisions).
 *
 * Workspace-first: routes no longer include collectionId segments.
 * The workspace anchor is resolved server-side, not embedded in URLs.
 */

const BASE = '/app/tools/finish-decisions'

export function buildDecisionHref({
  decisionId,
}: {
  decisionId: string
  /** @deprecated No longer used — kept for call-site compatibility during migration */
  collectionId?: string
}): string {
  return `${BASE}/decision/${decisionId}`
}

export function buildBoardHref(
  /** @deprecated No longer used — kept for call-site compatibility during migration */
  _collectionId?: string
): string {
  return BASE
}
