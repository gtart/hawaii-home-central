'use client'

import { useState, useEffect, useCallback } from 'react'
import { useProject } from '@/contexts/ProjectContext'

export interface ActivityFeedEvent {
  id: string
  toolKey: string
  collectionId: string | null
  entityType: string | null
  entityId: string | null
  action: string
  summaryText: string
  entityLabel: string | null
  detailText: string | null
  createdAt: string
  actorName: string | null
}

export interface ActivityFeedOptions {
  toolKey?: string
  collectionId?: string
  actionTypes?: string[]
  q?: string
  limit?: number
}

export function useActivityFeed(opts?: ActivityFeedOptions) {
  const { currentProject } = useProject()
  const [events, setEvents] = useState<ActivityFeedEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const toolKey = opts?.toolKey
  const collectionId = opts?.collectionId
  const actionTypes = opts?.actionTypes
  const q = opts?.q
  const limit = opts?.limit ?? 20

  const fetchEvents = useCallback(
    async (cursor?: string) => {
      if (!currentProject?.id) return

      const params = new URLSearchParams()
      if (toolKey) params.set('toolKey', toolKey)
      if (collectionId) params.set('collectionId', collectionId)
      if (actionTypes && actionTypes.length > 0) params.set('actionTypes', actionTypes.join(','))
      if (q) params.set('q', q)
      params.set('limit', String(limit))
      if (cursor) params.set('cursor', cursor)

      try {
        const res = await fetch(`/api/activity?${params}`)
        if (!res.ok) return
        const data = await res.json()

        if (cursor) {
          setEvents((prev) => [...prev, ...data.events])
        } else {
          setEvents(data.events)
        }
        setNextCursor(data.nextCursor)
        setHasMore(!!data.nextCursor)
      } catch {
        // ignore
      } finally {
        setIsLoading(false)
      }
    },
    [currentProject?.id, toolKey, collectionId, actionTypes?.join(','), q, limit]
  )

  useEffect(() => {
    setIsLoading(true)
    setEvents([])
    fetchEvents()
  }, [fetchEvents])

  const loadMore = useCallback(() => {
    if (nextCursor) fetchEvents(nextCursor)
  }, [nextCursor, fetchEvents])

  return { events, isLoading, hasMore, loadMore }
}
