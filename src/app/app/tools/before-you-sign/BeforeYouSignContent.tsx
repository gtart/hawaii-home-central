'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ToolPageHeader } from '@/components/app/ToolPageHeader'
import { useBYSState } from './useBYSState'
import { ALL_TABS } from './beforeYouSignConfig'
import { ContractorBar } from './components/ContractorBar'
import { ContractorSnapshotRow } from './components/ContractorSnapshotRow'
import { PricingSnapshot } from './components/PricingSnapshot'
import { EmptyState } from './components/EmptyState'
import { CompareGrid } from './components/CompareGrid'
import { NotesTab } from './components/NotesTab'
import type { ViewTab } from './types'

const TAB_PILLS: { key: ViewTab; label: string }[] = [
  { key: 'quotes', label: 'Quotes' },
  { key: 'handoffs', label: 'Who does what' },
  { key: 'agree', label: 'What we agreed to' },
  { key: 'notes', label: 'Notes' },
]

function BYSContent() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab') as ViewTab | null
  const [activeTab, setActiveTab] = useState<ViewTab>(
    tabParam && TAB_PILLS.some((t) => t.key === tabParam) ? tabParam : 'quotes'
  )
  const {
    payload,
    isLoaded,
    access,
    readOnly,
    noAccess,
    addContractor,
    updateContractor,
    removeContractor,
    toggleContractorSelection,
    setAnswer,
    getAnswer,
    addCustomAgreeItem,
    removeCustomAgreeItem,
  } = useBYSState()

  useEffect(() => {
    if (tabParam && TAB_PILLS.some((t) => t.key === tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  const handleTabChange = (tab: ViewTab) => {
    setActiveTab(tab)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', tab)
    window.history.replaceState({}, '', url.toString())
  }

  if (!isLoaded) {
    return (
      <div className="py-12 text-center text-cream/30 text-sm">
        Loading...
      </div>
    )
  }

  const { contractors, selectedContractorIds, customAgreeItems } = payload
  const selectedContractors = contractors.filter((c) =>
    selectedContractorIds.includes(c.id)
  )
  const isNotesTab = activeTab === 'notes'
  const tabConfig = ALL_TABS.find((t) => t.key === activeTab) ?? ALL_TABS[0]

  return (
    <>
      <ToolPageHeader
        toolKey="before_you_sign"
        title="Contract Comparison Tool"
        description="Add each contractor, then mark what's covered, what's missing, and jot notes. This helps you compare apples-to-apples."
        accessLevel={access}
      />

      {noAccess ? (
        <div className="bg-basalt-50 rounded-card p-8 text-center">
          <p className="text-cream/50 mb-2">You don&apos;t have access to this tool for the current project.</p>
          <a href="/app" className="text-sandstone hover:text-sandstone-light text-sm">Back to My Tools</a>
        </div>
      ) : contractors.length === 0 ? (
        readOnly ? (
          <div className="bg-basalt-50 rounded-card p-8 text-center">
            <p className="text-cream/50">No contractors have been added yet.</p>
          </div>
        ) : (
          <div>
            <div className="bg-basalt-50 rounded-card p-6 mb-6">
              <h2 className="text-cream text-sm font-medium mb-3">How it works</h2>
              <ol className="space-y-2 text-sm text-cream/60">
                <li className="flex gap-2">
                  <span className="text-sandstone font-medium shrink-0">1.</span>
                  <span>Add your contractors (even one is fine to start)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-sandstone font-medium shrink-0">2.</span>
                  <span>Fill in Quote Details &mdash; compare what each bid includes</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-sandstone font-medium shrink-0">3.</span>
                  <span>Assign Who Handles What &mdash; so nothing falls through the cracks</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-sandstone font-medium shrink-0">4.</span>
                  <span>Review Key Agreements &mdash; conversations to have before signing</span>
                </li>
              </ol>
            </div>
            <EmptyState onAdd={addContractor} />
          </div>
        )
      ) : (
        <div className="space-y-4 mb-6">
          {/* Contractor pills */}
          <ContractorBar
            contractors={contractors}
            selectedContractorIds={selectedContractorIds}
            onToggle={toggleContractorSelection}
            onAdd={addContractor}
            onRemove={removeContractor}
            onUpdate={updateContractor}
            readOnly={readOnly}
          />

          {/* Progress snapshot */}
          <ContractorSnapshotRow
            contractors={selectedContractors}
            getAnswer={getAnswer}
          />
        </div>
      )}

      {/* Only show tabs + content when we have at least one contractor */}
      {contractors.length > 0 && (
        <>
          {/* Tab pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {TAB_PILLS.map((tab) => (
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
          {isNotesTab ? (
            <NotesTab
              contractors={selectedContractors}
              onUpdate={updateContractor}
            />
          ) : (
            <>
              {/* Pricing snapshot (quotes tab only) */}
              {activeTab === 'quotes' && (
                <div className="mb-4">
                  <PricingSnapshot
                    contractors={selectedContractors}
                    activeContractorId="all"
                    onUpdate={updateContractor}
                  />
                </div>
              )}

              {/* Comparison grid */}
              <CompareGrid
                tabConfig={tabConfig}
                contractors={selectedContractors}
                getAnswer={getAnswer}
                setAnswer={setAnswer}
                customAgreeItems={
                  activeTab === 'agree' ? customAgreeItems : undefined
                }
              />
            </>
          )}
        </>
      )}
    </>
  )
}

export function BeforeYouSignContent() {
  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-6xl mx-auto">
        <Suspense fallback={null}>
          <BYSContent />
        </Suspense>
      </div>
    </div>
  )
}
