'use client'

import { useState, useEffect } from 'react'
import type { MergePreviewCollection } from '@/lib/selections-workspace'

interface MultiCollectionBannerProps {
  collectionCount: number
  projectId: string
  primaryCollectionId: string
  /** Called after a successful merge so the parent can reload */
  onMergeComplete?: () => void
}

interface MergeSummary {
  anchorTitle: string
  sourcesMerged: { id: string; title: string }[]
  selectionsMerged: number
  duplicatesFound: number
  duplicateResolutions: string[]
  commentsReassigned: number
  activityReassigned: number
  shareTokensMigrated: number
  invitesMigrated: number
  membersMigrated: number
  sourcesArchived: number
}

/**
 * Banner shown when a project has multiple Selections collections.
 * Includes merge preview + confirmation flow.
 */
export function MultiCollectionBanner({
  collectionCount,
  projectId,
  primaryCollectionId,
  onMergeComplete,
}: MultiCollectionBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [preview, setPreview] = useState<MergePreviewCollection[] | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [merging, setMerging] = useState(false)
  const [mergeResult, setMergeResult] = useState<MergeSummary | null>(null)
  const [mergeError, setMergeError] = useState<string | null>(null)

  // Check dismissal in localStorage
  useEffect(() => {
    try {
      const key = `hhc_merge_banner_dismissed_${projectId}`
      const stored = localStorage.getItem(key)
      if (stored) {
        const ts = parseInt(stored, 10)
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

  async function loadPreview() {
    if (preview || loadingPreview) return
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

  async function handleExpand() {
    setExpanded(true)
    await loadPreview()
  }

  async function handleMerge() {
    setMerging(true)
    setMergeError(null)
    try {
      const res = await fetch('/api/selections-workspace/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, anchorCollectionId: primaryCollectionId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setMergeError(data.error || 'Merge failed')
        return
      }
      const summary: MergeSummary = await res.json()
      setMergeResult(summary)
      setConfirmOpen(false)
    } catch {
      setMergeError('Network error — please try again')
    } finally {
      setMerging(false)
    }
  }

  if (dismissed && !mergeResult) return null

  // Post-merge success state
  if (mergeResult) {
    return (
      <div className="bg-green-500/8 border border-green-400/20 rounded-lg px-4 py-3 mb-4">
        <div className="flex items-start gap-3">
          <svg className="w-4 h-4 text-green-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-cream/70 font-medium">
              Workspace combined successfully
            </p>
            <p className="text-xs text-cream/50 mt-1">
              {mergeResult.selectionsMerged} selection{mergeResult.selectionsMerged !== 1 ? 's' : ''} merged from {mergeResult.sourcesArchived} list{mergeResult.sourcesArchived !== 1 ? 's' : ''}.
              {mergeResult.commentsReassigned > 0 && ` ${mergeResult.commentsReassigned} comment${mergeResult.commentsReassigned !== 1 ? 's' : ''} moved.`}
              {mergeResult.duplicatesFound > 0 && ` ${mergeResult.duplicatesFound} duplicate title${mergeResult.duplicatesFound !== 1 ? 's' : ''} renamed.`}
            </p>
            <button
              type="button"
              onClick={() => {
                setMergeResult(null)
                onMergeComplete?.()
                window.location.reload()
              }}
              className="text-xs text-green-400/70 hover:text-green-400 transition-colors mt-2"
            >
              Reload workspace
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
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
            </p>

            <div className="flex items-center gap-3 mt-2">
              {!expanded && (
                <button
                  type="button"
                  onClick={handleExpand}
                  className="text-xs text-amber-400/70 hover:text-amber-400 transition-colors"
                >
                  Show details
                </button>
              )}
              <button
                type="button"
                onClick={async () => {
                  await loadPreview()
                  setConfirmOpen(true)
                }}
                className="text-xs text-sandstone hover:text-sandstone-light transition-colors font-medium"
              >
                Combine into one workspace
              </button>
            </div>

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

      {/* Merge confirmation dialog */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !merging && setConfirmOpen(false)} />
          <div className="relative bg-basalt-50 border border-cream/15 rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-medium text-cream mb-2">
              Combine selection lists?
            </h3>
            <p className="text-sm text-cream/50 mb-4">
              This will merge all your selection lists into one workspace. Former list names will become tags on the merged selections.
            </p>

            {preview && (
              <div className="bg-cream/5 rounded-lg p-3 mb-4 space-y-1.5">
                {preview.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-xs">
                    <span className={c.isPrimary ? 'text-cream/70 font-medium' : 'text-cream/50'}>
                      {c.title}
                      {c.isPrimary && <span className="text-sandstone ml-1">(workspace anchor)</span>}
                    </span>
                    <span className="text-cream/40 tabular-nums">
                      {c.selectionCount} selection{c.selectionCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
                <div className="border-t border-cream/10 pt-1.5 mt-1.5 flex items-center justify-between text-xs font-medium text-cream/60">
                  <span>Total after merge</span>
                  <span className="tabular-nums">{preview.reduce((sum, c) => sum + c.selectionCount, 0)} selections</span>
                </div>
              </div>
            )}

            <p className="text-xs text-cream/40 mb-4">
              Comments, activity, sharing, and collaboration will all be preserved and moved to the combined workspace. Source lists will be archived (not deleted).
            </p>

            {mergeError && (
              <p className="text-xs text-red-400 mb-3">{mergeError}</p>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={merging}
                className="px-4 py-2 text-sm text-cream/50 hover:text-cream/70 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMerge}
                disabled={merging}
                className="px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors disabled:opacity-50"
              >
                {merging ? 'Combining...' : 'Combine now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
