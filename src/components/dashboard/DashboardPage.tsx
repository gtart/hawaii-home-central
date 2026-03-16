'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useProject } from '@/contexts/ProjectContext'
import { useDashboard } from '@/hooks/useDashboard'
import { useInboxCount } from '@/hooks/useInboxCount'
import { DashboardToolGrid } from './DashboardToolGrid'
import { DashboardNextActions } from './DashboardNextActions'
import { DashboardFeed } from './DashboardFeed'
import { QuietBanner } from './QuietBanner'
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
  const totalHigh = data.fixLists.reduce((s, l) => s + l.highPriorityCount, 0)
  const totalOpen = data.fixLists.reduce((s, l) => s + l.openCount, 0)
  const totalDeciding = data.selectionLists.reduce((s, l) => s + l.notStartedCount + l.decidingCount, 0)
  const totalActiveChanges = data.projectSummaries.reduce((s, l) => s + l.activeChangeCount, 0)

  const parts: string[] = []

  if (totalHigh > 0) {
    parts.push(`${totalHigh} urgent fix${totalHigh !== 1 ? 'es' : ''}`)
  } else if (totalOpen > 0) {
    parts.push(`${totalOpen} open fix${totalOpen !== 1 ? 'es' : ''}`)
  }
  if (totalDeciding > 0) {
    parts.push(`${totalDeciding} selection${totalDeciding !== 1 ? 's' : ''} to decide`)
  }
  if (totalActiveChanges > 0) {
    parts.push(`${totalActiveChanges} plan change${totalActiveChanges !== 1 ? 's' : ''} pending`)
  }

  if (parts.length === 0) {
    if (data.noNews.isQuiet) return 'All caught up. Nothing needs your attention right now.'
    return 'Everything looks good.'
  }

  return parts.join(' · ')
}

export function DashboardPage() {
  const { currentProject } = useProject()
  const { data, isLoading } = useDashboard()
  const { total: inboxCount, refetch: refetchInbox } = useInboxCount()
  const [showCapture, setShowCapture] = useState(false)
  const [sortItem, setSortItem] = useState<CapturedResult | null>(null)

  const stateSentence = data ? deriveStateSentence(data) : null

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        {/* ── Hero: project name + state sentence ── */}
        <div className="mb-5">
          <h1 className="text-2xl font-semibold text-cream mb-1">
            {currentProject?.name ?? 'My Renovation'}
          </h1>
          {!isLoading && stateSentence && (
            <p className="text-sm text-cream/60">{stateSentence}</p>
          )}
        </div>

        {/* ── Quick actions row ── */}
        <div className="flex items-center gap-2 sm:gap-3 mb-6">
          <button
            type="button"
            onClick={() => setShowCapture(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors shadow-sm whitespace-nowrap"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
              <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
            </svg>
            Capture
          </button>
          <Link
            href="/app/inbox"
            className="inline-flex items-center gap-1.5 px-3 py-2.5 text-cream/60 text-sm rounded-lg hover:text-cream/80 hover:bg-stone-hover transition-colors whitespace-nowrap"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 12h-6l-2 3H10l-2-3H2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Inbox
            {inboxCount > 0 && (
              <span className="bg-sandstone/20 text-sandstone text-[10px] font-medium px-1.5 py-0.5 rounded-full tabular-nums">
                {inboxCount}
              </span>
            )}
          </Link>
        </div>

        {/* ── Needs attention / continuation prompts ── */}
        {!isLoading && (
          <DashboardNextActions data={data} />
        )}

        {/* ── Quiet state banner (when nothing needs attention) ── */}
        {!isLoading && data?.noNews.isQuiet && (
          <QuietBanner lastActivityAt={data.noNews.lastActivityAt} data={data} />
        )}

        {/* ── Recent activity feed (inline, not behind a panel) ── */}
        <div className="mb-8">
          <DashboardFeed />
        </div>

        {/* ── Tool summaries (lower, less dominant) ── */}
        <div>
          <h2 className="text-[11px] uppercase tracking-wider text-cream/30 mb-3">Your tools</h2>
          <DashboardToolGrid data={data} isLoading={isLoading} />
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
