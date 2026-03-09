'use client'

import { useState, useEffect } from 'react'
import type { MergePreviewCollection } from '@/lib/selections-workspace'

interface MultiCollectionBannerProps {
  collectionCount: number
  projectId: string
  primaryCollectionId: string
}

/**
 * Temporary banner shown when a project has multiple Selections collections.
 * Shows a preview of what exists and explains that combining is coming.
 *
 * Phase 1: informational only. Phase 2 will add the actual merge flow.
 */
export function MultiCollectionBanner({
  collectionCount,
  projectId,
  primaryCollectionId,
}: MultiCollectionBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [preview, setPreview] = useState<MergePreviewCollection[] | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)

  // Check dismissal in localStorage
  useEffect(() => {
    try {
      const key = `hhc_merge_banner_dismissed_${projectId}`
      const stored = localStorage.getItem(key)
      if (stored) {
        const ts = parseInt(stored, 10)
        // Dismiss for 30 days
        if (Date.now() - ts < 30 * 24 * 60 * 60 * 1000) {
          setDismissed(true)
        }
      }
    } catch {}
  }, [projectId])

  function handleDismiss() {
    setDismissed(true)
    try {
      localStorage.setItem(
        `hhc_merge_banner_dismissed_${projectId}`,
        String(Date.now())
      )
    } catch {}
  }

  async function handleExpand() {
    setExpanded(true)
    if (!preview && !loadingPreview) {
      setLoadingPreview(true)
      try {
        const res = await fetch(
          `/api/selections-workspace/preview?projectId=${projectId}&primaryId=${primaryCollectionId}`
        )
        if (res.ok) {
          const data = await res.json()
          setPreview(data.collections || [])
        }
      } catch {
        // Silent
      } finally {
        setLoadingPreview(false)
      }
    }
  }

  if (dismissed) return null

  return (
    <div className="bg-amber-500/8 border border-amber-400/20 rounded-lg px-4 py-3 mb-4">
      <div className="flex items-start gap-3">
        <svg
          className="w-4 h-4 text-amber-400 shrink-0 mt-0.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" />
          <line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round" />
        </svg>

        <div className="flex-1 min-w-0">
          <p className="text-sm text-cream/70">
            You have{' '}
            <span className="text-cream font-medium">
              {collectionCount} selection lists
            </span>{' '}
            from before. You&rsquo;re viewing the most recently updated one.
            A combine feature is coming soon to merge them into this single workspace.
          </p>

          {!expanded && (
            <button
              type="button"
              onClick={handleExpand}
              className="text-xs text-amber-400/70 hover:text-amber-400 transition-colors mt-1"
            >
              Show details
            </button>
          )}

          {expanded && (
            <div className="mt-2 space-y-1">
              {loadingPreview && (
                <p className="text-xs text-cream/40">Loading...</p>
              )}
              {preview && preview.map((c) => (
                <div
                  key={c.id}
                  className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${
                    c.isPrimary
                      ? 'bg-cream/5 text-cream/70'
                      : 'text-cream/40'
                  }`}
                >
                  <span className="flex-1 truncate">
                    {c.title}
                    {c.isPrimary && (
                      <span className="text-amber-400/60 ml-1">(current)</span>
                    )}
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {c.selectionCount} selection{c.selectionCount !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="text-cream/30 hover:text-cream/50 transition-colors shrink-0"
          title="Dismiss for 30 days"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
            <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
