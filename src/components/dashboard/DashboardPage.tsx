'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useProject } from '@/contexts/ProjectContext'
import { useDashboard } from '@/hooks/useDashboard'
import { useInboxCount } from '@/hooks/useInboxCount'
import { DashboardToolGrid } from './DashboardToolGrid'
import { DashboardFeed } from './DashboardFeed'
import { QuickCaptureSheet } from '@/components/app/QuickCaptureSheet'
import { SortWizard } from '@/components/app/SortWizard'

interface CapturedResult {
  id: string
  type: string
  title?: string | null
  thumbnailUrl?: string | null
  imageUrl?: string | null
  note?: string | null
}

function deriveStateSentence(data: {
  fixLists: { highPriorityCount: number; staleCount: number; openCount: number }[]
  selectionLists: { notStartedCount: number; decidingCount: number }[]
  projectSummaries: { activeChangeCount: number }[]
  noNews: { isQuiet: boolean }
}): string {
  const totalOpen = data.fixLists.reduce((s, l) => s + l.openCount, 0)
  const totalDeciding = data.selectionLists.reduce((s, l) => s + l.notStartedCount + l.decidingCount, 0)
  const totalActiveChanges = data.projectSummaries.reduce((s, l) => s + l.activeChangeCount, 0)

  const parts: string[] = []
  if (totalOpen > 0) parts.push(`${totalOpen} open fix${totalOpen !== 1 ? 'es' : ''}`)
  if (totalDeciding > 0) parts.push(`${totalDeciding} selection${totalDeciding !== 1 ? 's' : ''} to decide`)
  if (totalActiveChanges > 0) parts.push(`${totalActiveChanges} plan change${totalActiveChanges !== 1 ? 's' : ''} pending`)

  if (parts.length === 0) return 'All caught up.'
  return parts.join(' · ')
}

export function DashboardPage() {
  const { currentProject } = useProject()
  const { data, isLoading } = useDashboard()
  const { total: inboxCount, refetch: refetchInbox } = useInboxCount()
  const [showCapture, setShowCapture] = useState(false)
  const [sortItem, setSortItem] = useState<CapturedResult | null>(null)
  const [showFeed, setShowFeed] = useState(false)

  const stateSentence = data ? deriveStateSentence(data) : null

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        {/* ── Project header + compact summary ── */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-cream mb-1">
              {currentProject?.name ?? 'My Renovation'}
            </h1>
            {!isLoading && stateSentence && (
              <p className="text-sm text-cream/45">{stateSentence}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 mt-1">
            <button
              type="button"
              onClick={() => setShowCapture(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
                <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
              </svg>
              <span className="hidden sm:inline">Capture</span>
            </button>
            <Link
              href="/app/inbox"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-cream/50 text-sm rounded-lg hover:text-cream/70 hover:bg-stone-hover transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 12h-6l-2 3H10l-2-3H2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {inboxCount > 0 && (
                <span className="bg-sandstone/20 text-sandstone text-[10px] font-medium px-1.5 py-0.5 rounded-full tabular-nums">
                  {inboxCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* ── Core tool cards — primary homepage content ── */}
        <DashboardToolGrid data={data} isLoading={isLoading} />

        {/* ── Recent activity (collapsed by default, expandable) ── */}
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowFeed(!showFeed)}
            className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-cream/30 hover:text-cream/50 transition-colors mb-3"
          >
            <svg className={`w-3 h-3 transition-transform ${showFeed ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Recent activity
          </button>
          {showFeed && <DashboardFeed />}
        </div>
      </div>

      {/* Quick Capture Sheet */}
      {showCapture && (
        <QuickCaptureSheet
          onClose={() => setShowCapture(false)}
          onSort={(result) => {
            setShowCapture(false)
            setSortItem(result as CapturedResult)
          }}
        />
      )}

      {/* Sort Wizard */}
      {sortItem && (
        <SortWizard
          item={sortItem}
          onClose={() => setSortItem(null)}
          onSorted={() => {
            setSortItem(null)
            refetchInbox()
          }}
        />
      )}
    </div>
  )
}
