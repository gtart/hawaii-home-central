'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useProject } from '@/contexts/ProjectContext'
import { useDashboard } from '@/hooks/useDashboard'
import { useInboxCount } from '@/hooks/useInboxCount'
import { useUnseenActivityCount } from '@/hooks/useUnseenActivityCount'
import { DashboardToolGrid } from './DashboardToolGrid'
import { DashboardNextActions } from './DashboardNextActions'
import { QuickCaptureSheet } from '@/components/app/QuickCaptureSheet'
import { SortWizard } from '@/components/app/SortWizard'
import { ActivityPanel } from '@/components/app/ActivityPanel'

interface CapturedResult {
  id: string
  type: string
  title?: string | null
  thumbnailUrl?: string | null
  imageUrl?: string | null
  note?: string | null
}

export function DashboardPage() {
  const { currentProject } = useProject()
  const { data, isLoading } = useDashboard()
  const { total: inboxCount, refetch: refetchInbox } = useInboxCount()
  const [showCapture, setShowCapture] = useState(false)
  const [sortItem, setSortItem] = useState<CapturedResult | null>(null)
  const [showActivity, setShowActivity] = useState(false)
  const { count: unseenCount, markSeen: markActivitySeen } = useUnseenActivityCount()

  // Derive attention summary for hero
  const attentionItems: string[] = []
  if (data) {
    const totalHigh = (data.fixLists ?? []).reduce((s, l) => s + l.highPriorityCount, 0)
    const totalStale = (data.fixLists ?? []).reduce((s, l) => s + l.staleCount, 0)
    const totalOpen = (data.fixLists ?? []).reduce((s, l) => s + l.openCount, 0)
    const totalDeciding = (data.selectionLists ?? []).reduce((s, l) => s + l.notStartedCount + l.decidingCount, 0)
    const totalActiveChanges = (data.projectSummaries ?? []).reduce((s, l) => s + l.activeChangeCount, 0)

    if (totalHigh > 0) attentionItems.push(`${totalHigh} urgent fix${totalHigh !== 1 ? 'es' : ''}`)
    if (totalStale > 0) attentionItems.push(`${totalStale} stale issue${totalStale !== 1 ? 's' : ''}`)
    if (totalDeciding > 0) attentionItems.push(`${totalDeciding} selection${totalDeciding !== 1 ? 's' : ''} to decide`)
    if (totalActiveChanges > 0) attentionItems.push(`${totalActiveChanges} active change${totalActiveChanges !== 1 ? 's' : ''}`)
    if (attentionItems.length === 0 && totalOpen > 0) attentionItems.push(`${totalOpen} open issue${totalOpen !== 1 ? 's' : ''}`)
  }

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Hero — project identity + attention summary */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-cream mb-1">
            {currentProject?.name ?? 'My Renovation'}
          </h1>
          {!isLoading && attentionItems.length > 0 ? (
            <p className="text-sm text-cream/65">
              {attentionItems.join(' \u00b7 ')}
            </p>
          ) : !isLoading && data?.noNews.isQuiet ? (
            <p className="text-sm text-cream/65">Nothing needs your attention right now.</p>
          ) : !isLoading ? (
            <p className="text-sm text-cream/55">Everything looks good.</p>
          ) : null}
        </div>

        {/* Actions — Capture (primary), Inbox + Activity (secondary, lighter) */}
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
            className="inline-flex items-center gap-1.5 px-3 py-2.5 text-cream/65 text-sm rounded-lg hover:text-cream/80 hover:bg-stone-hover transition-colors whitespace-nowrap"
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
          <button
            type="button"
            onClick={() => { setShowActivity(true); markActivitySeen() }}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 text-cream/65 text-sm rounded-lg hover:text-cream/80 hover:bg-stone-hover transition-colors whitespace-nowrap"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Activity
            {unseenCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-sandstone shrink-0" />
            )}
          </button>
        </div>

        {/* Next actions — what to do first */}
        {!isLoading && (
          <DashboardNextActions data={data} />
        )}

        {/* Tool cards */}
        <DashboardToolGrid data={data} isLoading={isLoading} />

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

      {/* Activity Panel */}
      {showActivity && <ActivityPanel onClose={() => setShowActivity(false)} />}
    </div>
  )
}
