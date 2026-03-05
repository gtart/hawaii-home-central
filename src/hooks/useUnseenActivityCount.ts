'use client'

import { useState, useEffect, useCallback } from 'react'
import { useProject } from '@/contexts/ProjectContext'

const STORAGE_KEY = 'hhc-activity-last-seen'

export function useUnseenActivityCount(opts?: { toolKey?: string; collectionId?: string }) {
  const { currentProject } = useProject()
  const [count, setCount] = useState(0)

  const storageKey = opts?.collectionId
    ? `${STORAGE_KEY}-${opts.collectionId}`
    : opts?.toolKey
      ? `${STORAGE_KEY}-${opts.toolKey}`
      : STORAGE_KEY

  const fetchCount = useCallback(async () => {
    if (!currentProject?.id) return

    const lastSeen = typeof window !== 'undefined'
      ? localStorage.getItem(storageKey)
      : null

    // No "last seen" means this is their first visit — don't show a badge
    if (!lastSeen) { setCount(0); return }

    const params = new URLSearchParams({ limit: '50' })
    if (opts?.toolKey) params.set('toolKey', opts.toolKey)
    if (opts?.collectionId) params.set('collectionId', opts.collectionId)
    params.set('start', lastSeen)

    try {
      const res = await fetch(`/api/activity?${params}`)
      if (!res.ok) return
      const data = await res.json()
      const n = data.events?.length ?? 0
      // If there's another page, show 99+
      setCount(data.nextCursor ? 99 : n)
    } catch {
      // ignore
    }
  }, [currentProject?.id, storageKey, opts?.toolKey, opts?.collectionId])

  useEffect(() => {
    fetchCount()
  }, [fetchCount])

  const markSeen = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, new Date().toISOString())
    }
    setCount(0)
  }, [storageKey])

  return { count, markSeen }
}
