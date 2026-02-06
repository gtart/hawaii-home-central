'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { EmailGate } from '@/components/forms/EmailGate'
import { ShareButton } from '@/components/resources/ShareButton'
import { ChecklistSection } from '@/components/resources/ChecklistSection'
import { CHECKLIST_SECTIONS } from '@/data/fair-bid-checklist'

const CHECKLIST_STORAGE_KEY = 'hhc_checklist_state'

function useChecklistState() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CHECKLIST_STORAGE_KEY)
      if (stored) {
        setCheckedItems(JSON.parse(stored))
      }
    } catch {
      // Ignore parse errors
    }
    setIsLoaded(true)
  }, [])

  const toggle = useCallback((id: string) => {
    setCheckedItems((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return { checkedItems, toggle, isLoaded }
}

function PreviewContent() {
  return (
    <div>
      <h1 className="font-serif text-4xl md:text-5xl text-sandstone mb-6">
        Fair Bid Checklist
      </h1>
      <p className="text-cream/70 text-lg mb-8 leading-relaxed">
        A structured checklist to help you compare contractor bids with confidence. This protects homeowners from surprises and protects contractors from scope disputes. Clarity benefits everyone.
      </p>

      <div className="bg-basalt-50 rounded-card p-6 mb-8">
        <h2 className="font-serif text-xl text-cream mb-3">What&apos;s inside</h2>
        <ul className="text-cream/60 space-y-2 text-sm">
          <li className="flex gap-3">
            <span className="text-sandstone">&rarr;</span>
            <span>11 critical sections covering scope, labor, materials, permits, and more</span>
          </li>
          <li className="flex gap-3">
            <span className="text-sandstone">&rarr;</span>
            <span>Interactive checkboxes that save your progress</span>
          </li>
          <li className="flex gap-3">
            <span className="text-sandstone">&rarr;</span>
            <span>Expandable detail explaining why each item matters</span>
          </li>
          <li className="flex gap-3">
            <span className="text-sandstone">&rarr;</span>
            <span>Hawai&#x02BB;i-specific callouts for local conditions</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

function ProgressBar({ checkedItems }: { checkedItems: Record<string, boolean> }) {
  const allItems = CHECKLIST_SECTIONS.flatMap((s) => s.items)
  const essentialItems = allItems.filter((item) => item.priority === 'essential')

  const totalAll = allItems.length
  const checkedAll = allItems.filter((item) => checkedItems[item.id]).length
  const percentAll = totalAll > 0 ? Math.round((checkedAll / totalAll) * 100) : 0

  const totalEssential = essentialItems.length
  const checkedEssential = essentialItems.filter((item) => checkedItems[item.id]).length
  const percentEssential = totalEssential > 0 ? Math.round((checkedEssential / totalEssential) * 100) : 0

  return (
    <div className="bg-basalt-50 rounded-card p-4 mb-8 space-y-3">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sandstone text-sm font-medium">Essentials</span>
          <span className="text-cream/60 text-sm">
            {checkedEssential}/{totalEssential} ({percentEssential}%)
          </span>
        </div>
        <div className="w-full h-2 bg-basalt rounded-full overflow-hidden">
          <div
            className="h-full bg-sandstone rounded-full transition-all duration-300"
            style={{ width: `${percentEssential}%` }}
          />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-cream/50 text-sm">All items</span>
          <span className="text-cream/40 text-sm">
            {checkedAll}/{totalAll} ({percentAll}%)
          </span>
        </div>
        <div className="w-full h-1.5 bg-basalt rounded-full overflow-hidden">
          <div
            className="h-full bg-cream/20 rounded-full transition-all duration-300"
            style={{ width: `${percentAll}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export function PlaybookContent() {
  const { checkedItems, toggle, isLoaded } = useChecklistState()
  const [showEssentialsOnly, setShowEssentialsOnly] = useState(false)

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        <EmailGate previewContent={<PreviewContent />}>
          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="font-serif text-4xl md:text-5xl text-sandstone">
              Fair Bid Checklist
            </h1>
            <div className="shrink-0 mt-2">
              <ShareButton title="Fair Bid Checklist \u2014 Hawaii Home Central" />
            </div>
          </div>

          <p className="text-cream/70 text-lg mb-8 leading-relaxed">
            A structured checklist to help you compare contractor bids with confidence. This protects homeowners from surprises and protects contractors from scope disputes. Clarity benefits everyone.
          </p>

          <div className="bg-basalt-50 rounded-card p-6 mb-8">
            <h2 className="font-serif text-xl text-sandstone mb-3">Goal & Definition of Done</h2>
            <p className="text-cream/70 text-sm leading-relaxed mb-3">
              The goal of this checklist is to normalize bids and surface gaps early&mdash;before you sign anything.
            </p>
            <p className="text-cream/60 text-sm leading-relaxed italic">
              You&apos;re ready to compare bids when every section below is clearly answered for each contractor.
            </p>
          </div>

          {isLoaded && (
            <>
              <ProgressBar checkedItems={checkedItems} />
              <div className="flex justify-end mb-6">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowEssentialsOnly(!showEssentialsOnly)}
                >
                  {showEssentialsOnly ? 'Show all items' : 'Show essentials only'}
                </Button>
              </div>
            </>
          )}

          {CHECKLIST_SECTIONS.map((section) => (
            <ChecklistSection
              key={section.id}
              section={section}
              checkedItems={checkedItems}
              onToggle={toggle}
              filterEssentials={showEssentialsOnly}
            />
          ))}

        </EmailGate>
      </div>
    </div>
  )
}
