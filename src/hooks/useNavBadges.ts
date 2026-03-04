'use client'

import { useState, useEffect } from 'react'
import { useProject } from '@/contexts/ProjectContext'
import type { NavBadges } from '@/app/api/nav-badges/route'

export function useNavBadges() {
  const { currentProject } = useProject()
  const [badges, setBadges] = useState<NavBadges | null>(null)

  useEffect(() => {
    if (!currentProject?.id) return
    let cancelled = false

    fetch('/api/nav-badges')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d) setBadges(d)
      })
      .catch(() => {})

    return () => { cancelled = true }
  }, [currentProject?.id])

  return badges
}
