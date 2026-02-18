'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState, useEffect } from 'react'
import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useBYSState } from './useBYSState'
import { ALL_TABS } from './beforeYouSignConfig'
import { ContractorBar } from './components/ContractorBar'
import { ContractorSummaryCard } from './components/ContractorSummaryCard'
import { ContractorSnapshotRow } from './components/ContractorSnapshotRow'
import { PricingSnapshot } from './components/PricingSnapshot'
import { EmptyState } from './components/EmptyState'
import { ChecklistSingleMode } from './components/ChecklistSingleMode'
import { CompareGrid } from './components/CompareGrid'
import type { TabKey } from './types'

const TAB_PILLS: { key: TabKey; label: string }[] = [
  { key: 'quotes', label: 'Quotes' },
  { key: 'handoffs', label: 'Who does what' },
  { key: 'agree', label: 'What we agreed to' },
]

function BYSContent() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab') as TabKey | null
  const [activeTab, setActiveTab] = useState<TabKey>(
    tabParam && TAB_PILLS.some((t) => t.key === tabParam) ? tabParam : 'quotes'
  )
  const [isAddingContractor, setIsAddingContractor] = useState(false)
  const [newContractorName, setNewContractorName] = useState('')
  const addInputRef = React.useRef<HTMLInputElement>(null)

  const {
    payload,
    isLoaded,
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

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', tab)
    window.history.replaceState({}, '', url.toString())
  }

  const handleAddContractor = () => {
    const trimmed = newContractorName.trim()
    if (!trimmed) return
    addContractor(trimmed)
    setNewContractorName('')
    setIsAddingContractor(false)
  }

  React.useEffect(() => {
    if (isAddingContractor) addInputRef.current?.focus()
  }, [isAddingContractor])

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
  const isSingleMode = selectedContractorIds.length === 1
  const singleContractor = isSingleMode ? selectedContractors[0] : null
  const tabConfig = ALL_TABS.find((t) => t.key === activeTab) ?? ALL_TABS[0]

  return (
    <>
      {/* Getting started + empty state */}
      {contractors.length === 0 ? (
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
      ) : (
        <div className="space-y-4 mb-6">
          {/* Contractor pills */}
          <ContractorBar
            contractors={contractors}
            selectedContractorIds={selectedContractorIds}
            onToggle={toggleContractorSelection}
            onAdd={addContractor}
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

          {/* Tab content - always show comparison grid */}
          <CompareGrid
            tabConfig={tabConfig}
            contractors={selectedContractors}
            getAnswer={getAnswer}
            setAnswer={setAnswer}
            customAgreeItems={
              activeTab === 'agree' ? customAgreeItems : undefined
            }
          />

          {/* Summary card when exactly 1 contractor selected */}
          {singleContractor && (
            <div className="mt-6">
              <h3 className="text-xs font-medium text-cream/50 mb-3">Contractor Details</h3>
              <ContractorSummaryCard
                contractor={singleContractor}
                onUpdate={updateContractor}
                onDelete={removeContractor}
              />
            </div>
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
        <Link
          href="/app"
          className="text-sandstone hover:text-sandstone-light text-sm mb-4 inline-block"
        >
          &larr; My Tools
        </Link>
        <h1 className="font-serif text-4xl md:text-5xl text-sandstone mb-4">
          Contract Comparison Tool
        </h1>
        <p className="text-cream/70 text-lg mb-8 leading-relaxed">
          Add each contractor, then mark what&apos;s covered, what&apos;s missing, and jot notes. This helps you compare apples-to-apples.
        </p>

        <Suspense fallback={null}>
          <BYSContent />
        </Suspense>
      </div>
    </div>
  )
}
