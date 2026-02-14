'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ChecklistSection } from '@/components/resources/ChecklistSection'
import { CHECKLIST_SECTIONS } from '@/data/fair-bid-checklist'

function ProgressBar({ checkedItems }: { checkedItems: Record<string, boolean> }) {
  const allItems = CHECKLIST_SECTIONS.flatMap((s) => s.items)
  const essentialItems = allItems.filter((item) => item.priority === 'essential')

  const totalAll = allItems.length
  const checkedAll = allItems.filter((item) => checkedItems[item.id]).length
  const percentAll = totalAll > 0 ? Math.round((checkedAll / totalAll) * 100) : 0

  const totalEssential = essentialItems.length
  const checkedEssential = essentialItems.filter((item) => checkedItems[item.id]).length
  const percentEssential =
    totalEssential > 0 ? Math.round((checkedEssential / totalEssential) * 100) : 0

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

export function FairBidPublicContent() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
  const [showEssentialsOnly, setShowEssentialsOnly] = useState(false)

  const toggle = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
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

      {CHECKLIST_SECTIONS.map((section) => (
        <ChecklistSection
          key={section.id}
          section={section}
          checkedItems={checkedItems}
          onToggle={toggle}
          filterEssentials={showEssentialsOnly}
        />
      ))}
    </>
  )
}
