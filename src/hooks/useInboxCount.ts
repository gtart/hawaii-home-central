'use client'

import { useState, useEffect, useCallback } from 'react'
import { useProject } from '@/contexts/ProjectContext'

interface InboxCountData {
  total: number
  byTool: Record<string, number>
}

const POLL_INTERVAL = 60_000 // 60 seconds

export function useInboxCount() {
  const { currentProject } = useProject()
  const [data, setData] = useState<InboxCountData>({ total: 0, byTool: {} })
  const [isLoading, setIsLoading] = useState(true)

  const fetchCount = useCallback(async () => {
    if (!currentProject?.id) return
    try {
      const res = await fetch('/api/captured-items/count')
      if (!res.ok) return
      const json = await res.json()
      setData({ total: json.total ?? 0, byTool: json.byTool ?? {} })
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }, [currentProject?.id])

  useEffect(() => {
    fetchCount()
    const interval = setInterval(fetchCount, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchCount])

  return { ...data, isLoading, refetch: fetchCount }
}
