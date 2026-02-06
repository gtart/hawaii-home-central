'use client'

import type { ChecklistSectionData } from '@/data/fair-bid-checklist'
import { ChecklistItem } from './ChecklistItem'

interface ChecklistSectionProps {
  section: ChecklistSectionData
  checkedItems: Record<string, boolean>
  onToggle: (id: string) => void
  filterEssentials?: boolean
}

export function ChecklistSection({ section, checkedItems, onToggle, filterEssentials = false }: ChecklistSectionProps) {
  const visibleItems = filterEssentials
    ? section.items.filter((item) => item.priority === 'essential')
    : section.items

  if (visibleItems.length === 0) return null

  const completedCount = visibleItems.filter((item) => checkedItems[item.id]).length
  const totalCount = visibleItems.length

  return (
    <div className="bg-basalt-50 rounded-card p-6 mb-6">
      <div className="flex items-start justify-between gap-4 mb-2">
        <h3 className="font-serif text-xl text-sandstone">{section.title}</h3>
        <span className="text-cream/40 text-sm whitespace-nowrap mt-1">
          {completedCount}/{totalCount}
        </span>
      </div>
      <p className="text-cream/50 text-sm mb-4">{section.why}</p>
      <div>
        {visibleItems.map((item) => (
          <ChecklistItem
            key={item.id}
            item={item}
            isChecked={!!checkedItems[item.id]}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  )
}
