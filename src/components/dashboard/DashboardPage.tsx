'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useProject } from '@/contexts/ProjectContext'
import { useDashboard } from '@/hooks/useDashboard'
import { useInboxCount } from '@/hooks/useInboxCount'
import { useUnseenActivityCount } from '@/hooks/useUnseenActivityCount'
import { DashboardToolGrid } from './DashboardToolGrid'
import { QuietBanner } from './QuietBanner'
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

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-cream mb-1">
            {currentProject?.name ?? 'Dashboard'}
          </h1>
          <p className="text-sm text-cream/40">Your renovation at a glance.</p>
        </div>

        {/* Quick Capture + Inbox + Activity row */}
        <div className="flex items-center gap-2 sm:gap-3 mb-6">
          <button
            type="button"
            onClick={() => setShowCapture(true)}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors shadow-sm whitespace-nowrap"
          >
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <svg className="w-3.5 h-3.5 shrink-0 -ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="flex flex-col items-start leading-tight">
              <span>Quick Capture</span>
              <span className="text-[9px] font-normal text-basalt/60 -mt-0.5">Capture now, sort later</span>
            </span>
          </button>
          <Link
            href="/app/inbox"
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-cream/5 border border-cream/10 text-cream/60 text-sm rounded-lg hover:bg-cream/10 hover:text-cream/80 transition-colors whitespace-nowrap"
          >
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
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-cream/5 border border-cream/10 text-cream/60 text-sm rounded-lg hover:bg-cream/10 hover:text-cream/80 transition-colors whitespace-nowrap"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Activity
            {unseenCount > 0 && (
              <span className="bg-sandstone/20 text-sandstone text-[10px] font-medium px-1.5 py-0.5 rounded-full tabular-nums">
                {unseenCount > 98 ? '99+' : unseenCount}
              </span>
            )}
          </button>
        </div>

        {/* Quiet state */}
        {data?.noNews.isQuiet && (
          <QuietBanner lastActivityAt={data.noNews.lastActivityAt} data={data} />
        )}

        {/* Next actions */}
        {!isLoading && !data?.noNews.isQuiet && (
          <DashboardNextActions data={data} />
        )}

        {/* Tool grid — active tools first, then other tools */}
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
