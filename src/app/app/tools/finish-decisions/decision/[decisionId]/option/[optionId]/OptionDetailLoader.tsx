'use client'

import { useState, useEffect } from 'react'
import { useProject } from '@/contexts/ProjectContext'
import { OptionDetailContent } from './OptionDetailContent'

const WS_CACHE_PREFIX = 'hhc_ws_resolved_'

/**
 * Resolves the workspace anchor ID before rendering OptionDetailContent.
 * Uses localStorage cache to skip the API call when possible.
 */
export function OptionDetailLoader() {
  const { currentProject } = useProject()
  const [workspaceId, setWorkspaceId] = useState<string | null>(() => {
    if (typeof window === 'undefined' || !currentProject?.id) return null
    try {
      return localStorage.getItem(`${WS_CACHE_PREFIX}${currentProject.id}`)
    } catch { return null }
  })
  const [isResolving, setIsResolving] = useState(!workspaceId)

  useEffect(() => {
    if (!currentProject?.id) return

    // If we already have a cached value, use it immediately but still validate in background
    const cached = (() => {
      try {
        return localStorage.getItem(`${WS_CACHE_PREFIX}${currentProject.id}`)
      } catch { return null }
    })()

    if (cached) {
      setWorkspaceId(cached)
      setIsResolving(false)
    }

    let cancelled = false

    async function resolve() {
      try {
        const res = await fetch(
          `/api/selections-workspace/resolve?projectId=${currentProject!.id}`
        )
        if (cancelled) return
        if (res.ok) {
          const info = await res.json()
          const wsId = info.workspaceCollectionId
          setWorkspaceId(wsId)
          try {
            localStorage.setItem(`${WS_CACHE_PREFIX}${currentProject!.id}`, wsId)
          } catch { /* silent */ }
        }
      } catch {
        // Silent — will fall back if cache was available
      } finally {
        if (!cancelled) setIsResolving(false)
      }
    }

    resolve()
    return () => { cancelled = true }
  }, [currentProject?.id])

  if (isResolving) {
    return (
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center py-12 text-cream/65">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return <OptionDetailContent collectionId={workspaceId ?? undefined} />
}
