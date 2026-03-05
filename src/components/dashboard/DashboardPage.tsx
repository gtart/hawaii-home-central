'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useProject } from '@/contexts/ProjectContext'
import { useDashboard } from '@/hooks/useDashboard'
import { useInboxCount } from '@/hooks/useInboxCount'
import { DashboardToolGrid } from './DashboardToolGrid'
import { DashboardFeed } from './DashboardFeed'
import { QuietBanner } from './QuietBanner'
import { DashboardNextActions } from './DashboardNextActions'
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

export function DashboardPage() {
  const { currentProject } = useProject()
  const { data, isLoading } = useDashboard()
  const { total: inboxCount, refetch: refetchInbox } = useInboxCount()
  const [showCapture, setShowCapture] = useState(false)
  const [sortItem, setSortItem] = useState<CapturedResult | null>(null)

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

        {/* Quick Capture + Inbox row */}
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => setShowCapture(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Quick Capture
          </button>
          <Link
            href="/app/inbox"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-cream/5 border border-cream/10 text-cream/60 text-sm rounded-lg hover:bg-cream/10 hover:text-cream/80 transition-colors"
          >
            Inbox
            {inboxCount > 0 && (
              <span className="bg-sandstone/20 text-sandstone text-[10px] font-medium px-1.5 py-0.5 rounded-full tabular-nums">
                {inboxCount}
              </span>
            )}
          </Link>
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

        {/* Activity feed */}
        <div className="mb-8">
          <DashboardFeed />
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
