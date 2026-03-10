/**
 * Centralized routing helpers for Selections (finish-decisions).
 *
 * Workspace-first: routes no longer include collectionId segments.
 * The workspace anchor is resolved server-side, not embedded in URLs.
 */

const BASE = '/app/tools/finish-decisions'

export function buildDecisionHref({
  decisionId,
  optionId,
  commentId,
  comments,
}: {
  decisionId: string
  /** @deprecated No longer used — kept for call-site compatibility during migration */
  collectionId?: string
  optionId?: string
  commentId?: string
  comments?: boolean
}): string {
  const url = `${BASE}/decision/${decisionId}`
  const params = new URLSearchParams()
  if (optionId) params.set('optionId', optionId)
  if (commentId) params.set('commentId', commentId)
  if (comments) params.set('comments', '1')
  const qs = params.toString()
  return qs ? `${url}?${qs}` : url
}

export function buildBoardHref(
  /** @deprecated No longer used — kept for call-site compatibility during migration */
  _collectionId?: string
): string {
  return BASE
}
