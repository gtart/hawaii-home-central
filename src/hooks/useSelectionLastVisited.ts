'use client'

import { useCallback } from 'react'

const PREFIX = 'hhc_sel_visited_'

function storageKey(collectionId: string, selectionId: string) {
  return `${PREFIX}${collectionId}_${selectionId}`
}

/**
 * Tracks when the user last visited each selection detail page.
 * Uses localStorage — no schema changes needed.
 *
 * First-time visitors (no stored timestamp) are treated as "seen"
 * to avoid false unread badges.
 */
export function useSelectionLastVisited(collectionId: string | null | undefined) {
  const getLastVisited = useCallback(
    (selectionId: string): string | null => {
      if (!collectionId || typeof window === 'undefined') return null
      return localStorage.getItem(storageKey(collectionId, selectionId))
    },
    [collectionId]
  )

  const markVisited = useCallback(
    (selectionId: string) => {
      if (!collectionId || typeof window === 'undefined') return
      localStorage.setItem(storageKey(collectionId, selectionId), new Date().toISOString())
    },
    [collectionId]
  )

  const hasUnread = useCallback(
    (selectionId: string, latestCommentAt: string | undefined | null): boolean => {
      if (!latestCommentAt || !collectionId) return false
      const lastVisited = getLastVisited(selectionId)
      // No stored timestamp = first visit — treat as seen (no false unread)
      if (!lastVisited) return false
      return latestCommentAt > lastVisited
    },
    [collectionId, getLastVisited]
  )

  return { getLastVisited, markVisited, hasUnread }
}
