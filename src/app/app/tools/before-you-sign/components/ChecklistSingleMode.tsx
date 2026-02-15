'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { ItemRow } from './ItemRow'
import type {
  BYSTabConfig,
  BYSConfigItem,
  BYSAnswer,
  BYSCustomAgreeItem,
  TabKey,
  TriStatus,
} from '../types'

interface ChecklistSingleModeProps {
  tabConfig: BYSTabConfig
  contractorId: string
  getAnswer: (tab: TabKey, contractorId: string, itemId: string) => BYSAnswer
  setAnswer: (
    tab: TabKey,
    contractorId: string,
    itemId: string,
    answer: Partial<BYSAnswer>
  ) => void
  customAgreeItems?: BYSCustomAgreeItem[]
  onAddCustomItem?: (question: string) => string
  onRemoveCustomItem?: (id: string) => void
}

export function ChecklistSingleMode({
  tabConfig,
  contractorId,
  getAnswer,
  setAnswer,
  customAgreeItems = [],
  onAddCustomItem,
  onRemoveCustomItem,
}: ChecklistSingleModeProps) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set()
  )
  const [newItemText, setNewItemText] = useState('')
  const [showAllItems, setShowAllItems] = useState(false)

  const tab = tabConfig.key
  const isQuotesTab = tab === 'quotes'

  // Build sections with custom agree items appended
  const baseSections = useMemo(() => {
    const base = tabConfig.sections

    if (tab !== 'agree' || customAgreeItems.length === 0) return base

    // Append custom items to the first (only) section
    const customConfigItems: BYSConfigItem[] = customAgreeItems.map((ci) => ({
      id: ci.id,
      shortLabel: ci.question,
      fullLabel: ci.question,
      detail: 'Custom item you added.',
    }))

    return base.map((section, i) =>
      i === 0
        ? { ...section, items: [...section.items, ...customConfigItems] }
        : section
    )
  }, [tabConfig.sections, tab, customAgreeItems])

  // Filter by priority for quotes tab when in essentials mode
  const sections = useMemo(() => {
    if (!isQuotesTab || showAllItems) return baseSections

    return baseSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => item.priority === 'essential'),
      }))
      .filter((section) => section.items.length > 0)
  }, [baseSections, isQuotesTab, showAllItems])

  // Item counts for the toggle label
  const essentialCount = useMemo(() => {
    if (!isQuotesTab) return 0
    return baseSections.reduce(
      (sum, s) => sum + s.items.filter((i) => i.priority === 'essential').length,
      0
    )
  }, [baseSections, isQuotesTab])

  const totalCount = useMemo(() => {
    if (!isQuotesTab) return 0
    return baseSections.reduce((sum, s) => sum + s.items.length, 0)
  }, [baseSections, isQuotesTab])

  // Overall progress
  const allItemIds = useMemo(
    () => sections.flatMap((s) => s.items.map((i) => i.id)),
    [sections]
  )
  const answeredCount = useMemo(
    () =>
      allItemIds.filter(
        (id) => getAnswer(tab, contractorId, id).status !== 'unknown'
      ).length,
    [allItemIds, tab, contractorId, getAnswer]
  )

  function toggleSection(sectionId: string) {
    setCollapsedSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) next.delete(sectionId)
      else next.add(sectionId)
      return next
    })
  }

  function handleAddCustom() {
    const trimmed = newItemText.trim()
    if (!trimmed || !onAddCustomItem) return
    onAddCustomItem(trimmed)
    setNewItemText('')
  }

  const progressPct =
    allItemIds.length > 0
      ? Math.round((answeredCount / allItemIds.length) * 100)
      : 0

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-cream/40">
          <span>
            {answeredCount} / {allItemIds.length} verified
          </span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-1.5 bg-cream/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-sandstone rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Essentials / Full toggle (quotes tab only) */}
      {isQuotesTab && (
        <div className="flex items-center gap-1 rounded-full bg-basalt-50 border border-cream/10 p-0.5 w-fit">
          <button
            type="button"
            onClick={() => setShowAllItems(false)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-colors',
              !showAllItems
                ? 'bg-sandstone text-basalt'
                : 'text-cream/50 hover:text-cream/70'
            )}
          >
            Essentials ({essentialCount})
          </button>
          <button
            type="button"
            onClick={() => setShowAllItems(true)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-colors',
              showAllItems
                ? 'bg-sandstone text-basalt'
                : 'text-cream/50 hover:text-cream/70'
            )}
          >
            Full checklist ({totalCount})
          </button>
        </div>
      )}

      {/* Sections */}
      {sections.map((section) => {
        const isCollapsed = collapsedSections.has(section.id)
        const sectionItemIds = section.items.map((i) => i.id)
        const sectionAnswered = sectionItemIds.filter(
          (id) => getAnswer(tab, contractorId, id).status !== 'unknown'
        ).length

        return (
          <div
            key={section.id}
            className="bg-basalt-50 rounded-lg border border-cream/10 overflow-hidden"
          >
            {/* Section header */}
            <button
              type="button"
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-cream/[0.02] transition-colors"
            >
              <div className="flex items-center gap-2">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={cn(
                    'text-cream/30 transition-transform duration-200',
                    !isCollapsed && 'rotate-90'
                  )}
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                <span className="text-sm font-medium text-cream/80">
                  {section.title}
                </span>
              </div>
              <span className="text-xs text-cream/30">
                {sectionAnswered}/{sectionItemIds.length}
              </span>
            </button>

            {/* Section items */}
            <div
              className={cn(
                'overflow-hidden transition-all duration-200',
                isCollapsed ? 'max-h-0' : 'max-h-[200rem]'
              )}
            >
              <div className="px-4 pb-2">
                {section.items.map((item) => {
                  const isCustom = item.id.startsWith('custom_')
                  const answer = getAnswer(tab, contractorId, item.id)

                  return (
                    <ItemRow
                      key={item.id}
                      item={item}
                      answer={answer}
                      onStatusChange={(status: TriStatus) =>
                        setAnswer(tab, contractorId, item.id, { status })
                      }
                      onNotesChange={(notes: string) =>
                        setAnswer(tab, contractorId, item.id, { notes })
                      }
                      isCustom={isCustom}
                      onRemove={
                        isCustom && onRemoveCustomItem
                          ? () => onRemoveCustomItem(item.id)
                          : undefined
                      }
                    />
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}

      {/* Add custom item (agree tab only) */}
      {tab === 'agree' && onAddCustomItem && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleAddCustom()
          }}
          className="flex items-center gap-2"
        >
          <input
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="Add your own item..."
            className={cn(
              'flex-1 px-3 py-2 rounded-lg text-sm',
              'bg-basalt border border-cream/15 text-cream',
              'placeholder:text-cream/30',
              'focus:outline-none focus:border-sandstone focus:ring-1 focus:ring-sandstone'
            )}
          />
          <button
            type="submit"
            disabled={!newItemText.trim()}
            className="shrink-0 px-3 py-2 rounded-lg text-sm font-medium bg-sandstone text-basalt hover:bg-sandstone/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </form>
      )}
    </div>
  )
}
