'use client'

import { useState, useEffect } from 'react'
import { useProject } from '@/contexts/ProjectContext'
import type { DashboardResponse } from '@/server/dashboard'

export function useDashboard(opts?: { skip?: boolean }) {
  const { currentProject } = useProject()
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [isLoading, setIsLoading] = useState(!opts?.skip)

  useEffect(() => {
    if (opts?.skip || !currentProject?.id) return
    let cancelled = false
    setIsLoading(true)

    fetch('/api/dashboard')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d) setData(d)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [currentProject?.id, opts?.skip])

  return { data, isLoading }
}
