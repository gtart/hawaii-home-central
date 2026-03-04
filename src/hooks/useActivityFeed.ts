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
  createdAt: string
  actorName: string | null
}

export function useActivityFeed(toolKey?: string) {
  const { currentProject } = useProject()
  const [events, setEvents] = useState<ActivityFeedEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const fetchEvents = useCallback(
    async (cursor?: string) => {
      if (!currentProject?.id) return

      const params = new URLSearchParams()
      if (toolKey) params.set('toolKey', toolKey)
      params.set('limit', '20')
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
    [currentProject?.id, toolKey]
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
