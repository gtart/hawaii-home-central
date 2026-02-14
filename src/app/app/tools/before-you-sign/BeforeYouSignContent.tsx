'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ToolContent as FairBidContent } from '@/app/app/tools/fair-bid-checklist/ToolContent'
import { ToolContent as ResponsibilityContent } from '@/app/app/tools/responsibility-matrix/ToolContent'
import { ThingsToAgreeOn } from './ThingsToAgreeOn'

type Tab = 'quotes' | 'handoffs' | 'agree'

const TABS: { key: Tab; label: string }[] = [
  { key: 'quotes', label: 'Compare Your Quotes' },
  { key: 'handoffs', label: 'Who Handles What' },
  { key: 'agree', label: 'Things to Agree On' },
]

function TabContent() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab') as Tab | null
  const [activeTab, setActiveTab] = useState<Tab>(
    tabParam && TABS.some((t) => t.key === tabParam) ? tabParam : 'quotes'
  )

  useEffect(() => {
    if (tabParam && TABS.some((t) => t.key === tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', tab)
    window.history.replaceState({}, '', url.toString())
  }

  return (
    <>
      {/* Tab pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-colors',
              activeTab === tab.key
                ? 'bg-sandstone text-basalt'
                : 'bg-basalt-50 text-cream/50 border border-cream/10 hover:border-cream/30 hover:text-cream/70'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'quotes' && <FairBidContent embedded />}
      {activeTab === 'handoffs' && <ResponsibilityContent embedded />}
      {activeTab === 'agree' && <ThingsToAgreeOn />}
    </>
  )
}

export function BeforeYouSignContent() {
  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-serif text-4xl md:text-5xl text-sandstone mb-4">
          Before You Sign
        </h1>
        <p className="text-cream/70 text-lg mb-8 leading-relaxed">
          Compare quotes, assign handoffs, and avoid surprises.
        </p>

        <Suspense fallback={null}>
          <TabContent />
        </Suspense>
      </div>
    </div>
  )
}
