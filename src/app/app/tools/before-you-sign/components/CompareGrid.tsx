'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { StatusControl } from './StatusControl'
import type {
  BYSTabConfig,
  BYSConfigItem,
  BYSAnswer,
  BYSContractor,
  BYSCustomAgreeItem,
  TabKey,
  TriStatus,
} from '../types'

interface CompareGridProps {
  tabConfig: BYSTabConfig
  contractors: BYSContractor[]
  getAnswer: (tab: TabKey, contractorId: string, itemId: string) => BYSAnswer
  setAnswer: (
    tab: TabKey,
    contractorId: string,
    itemId: string,
    answer: Partial<BYSAnswer>
  ) => void
  customAgreeItems?: BYSCustomAgreeItem[]
}

export function CompareGrid({
  tabConfig,
  contractors,
  getAnswer,
  setAnswer,
  customAgreeItems = [],
}: CompareGridProps) {
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set()
  )
  const [showAllItems, setShowAllItems] = useState(false)
  const [showGapsOnly, setShowGapsOnly] = useState(false)

  const tab = tabConfig.key
  const isQuotesTab = tab === 'quotes'

  // Build sections with custom agree items appended
  const baseSections = useMemo(() => {
    const base = tabConfig.sections

    if (tab !== 'agree' || customAgreeItems.length === 0) return base

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

  // Filter sections for gaps-only mode
  const displaySections = useMemo(() => {
    if (!showGapsOnly) return sections
    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          contractors.some(
            (c) => getAnswer(tab, c.id, item.id).status === 'unknown'
          )
        ),
      }))
      .filter((section) => section.items.length > 0)
  }, [sections, showGapsOnly, tab, contractors, getAnswer])

  function toggleSection(sectionId: string) {
    setCollapsedSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) next.delete(sectionId)
      else next.add(sectionId)
      return next
    })
  }

  if (contractors.length === 0) {
    return (
      <div className="text-center py-8 text-cream/40 text-sm">
        Add contractors to start comparing.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toggles row */}
      <div className="flex items-center gap-3 flex-wrap">
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

        {/* Gaps toggle */}
        <button
          type="button"
          onClick={() => setShowGapsOnly((p) => !p)}
          className={cn(
            'text-xs transition-colors',
            showGapsOnly
              ? 'text-amber-400 font-medium'
              : 'text-cream/30 hover:text-cream/50'
          )}
        >
          {showGapsOnly ? 'Showing gaps only' : 'Show gaps only'}
        </button>
      </div>

      {displaySections.map((section) => {
        const isCollapsed = collapsedSections.has(section.id)

        return (
          <div
            key={section.id}
            className="bg-basalt-50 rounded-lg border border-cream/10 overflow-hidden"
          >
            {/* Section header */}
            <button
              type="button"
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center gap-2 px-4 py-3 hover:bg-cream/[0.02] transition-colors"
            >
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
            </button>

            {/* Grid content */}
            <div
              className={cn(
                'overflow-hidden transition-all duration-200',
                isCollapsed ? 'max-h-0' : 'max-h-[200rem]'
              )}
            >
              {/* Desktop table (md+) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '45%' }} />
                    {contractors.map((c) => (
                      <col key={c.id} style={{ width: `${55 / contractors.length}%` }} />
                    ))}
                  </colgroup>
                  <thead>
                    <tr className="border-b border-cream/5">
                      <th className="text-left px-4 py-2 text-cream/40 text-xs font-medium uppercase tracking-wider sticky left-0 bg-basalt-50">
                        Item
                      </th>
                      {contractors.map((c) => (
                        <th
                          key={c.id}
                          className="text-center px-3 py-2 text-cream/40 text-xs font-medium uppercase tracking-wider"
                        >
                          {c.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.items.map((item) => {
                      const isExpanded = expandedItemId === item.id

                      return (
                        <TableItemRow
                          key={item.id}
                          item={item}
                          tab={tab}
                          contractors={contractors}
                          getAnswer={getAnswer}
                          setAnswer={setAnswer}
                          isExpanded={isExpanded}
                          onToggle={() =>
                            setExpandedItemId(
                              isExpanded ? null : item.id
                            )
                          }
                        />
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards (<md) */}
              <div className="md:hidden px-4 pb-2 space-y-2">
                {section.items.map((item) => {
                  const isExpanded = expandedItemId === item.id

                  return (
                    <MobileItemCard
                      key={item.id}
                      item={item}
                      tab={tab}
                      contractors={contractors}
                      getAnswer={getAnswer}
                      setAnswer={setAnswer}
                      isExpanded={isExpanded}
                      onToggle={() =>
                        setExpandedItemId(isExpanded ? null : item.id)
                      }
                    />
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ---- Desktop table row ----

function TableItemRow({
  item,
  tab,
  contractors,
  getAnswer,
  setAnswer,
  isExpanded,
  onToggle,
}: {
  item: BYSConfigItem
  tab: TabKey
  contractors: BYSContractor[]
  getAnswer: CompareGridProps['getAnswer']
  setAnswer: CompareGridProps['setAnswer']
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <>
      <tr
        className="border-b border-cream/5 last:border-b-0 hover:bg-cream/[0.02] cursor-pointer"
        onClick={onToggle}
      >
        <td className="px-4 py-2 text-cream/70 sticky left-0 bg-basalt-50">
          <div className="flex items-center gap-1.5">
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn(
                'text-cream/20 transition-transform duration-200 shrink-0',
                isExpanded && 'rotate-90'
              )}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span className="text-sm">{item.shortLabel}</span>
          </div>
        </td>
        {contractors.map((c) => {
          const answer = getAnswer(tab, c.id, item.id)
          return (
            <td key={c.id} className="text-center px-3 py-2">
              <div
                className="inline-flex"
                onClick={(e) => e.stopPropagation()}
              >
                <StatusControl
                  status={answer.status}
                  onChange={(status: TriStatus) =>
                    setAnswer(tab, c.id, item.id, { status })
                  }
                  compact
                />
              </div>
            </td>
          )
        })}
      </tr>

      {/* Expanded detail row */}
      {isExpanded && (
        <tr>
          <td colSpan={1 + contractors.length} className="px-4 py-3">
            <div className="space-y-3">
              {item.fullLabel !== item.shortLabel && (
                <p className="text-cream/60 text-sm">{item.fullLabel}</p>
              )}
              <p className="text-cream/40 text-sm">{item.detail}</p>

              {/* Per-contractor notes */}
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${contractors.length}, 1fr)` }}>
                {contractors.map((c) => {
                  const answer = getAnswer(tab, c.id, item.id)
                  return (
                    <div key={c.id}>
                      <p className="text-cream/30 text-xs mb-1">{c.name}</p>
                      <textarea
                        value={answer.notes}
                        onChange={(e) =>
                          setAnswer(tab, c.id, item.id, {
                            notes: e.target.value,
                          })
                        }
                        placeholder="Notes..."
                        className={cn(
                          'w-full px-2 py-1.5 rounded text-xs leading-relaxed',
                          'bg-basalt border border-cream/15 text-cream',
                          'placeholder:text-cream/30',
                          'focus:outline-none focus:border-sandstone',
                          'resize-y min-h-[2rem]'
                        )}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ---- Mobile card ----

function MobileItemCard({
  item,
  tab,
  contractors,
  getAnswer,
  setAnswer,
  isExpanded,
  onToggle,
}: {
  item: BYSConfigItem
  tab: TabKey
  contractors: BYSContractor[]
  getAnswer: CompareGridProps['getAnswer']
  setAnswer: CompareGridProps['setAnswer']
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <div className="border-b border-cream/5 last:border-b-0 py-2">
      {/* Header row with item label + status dots */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2"
      >
        <span className="text-sm text-cream/70 text-left flex-1 min-w-0">
          {item.shortLabel}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {contractors.map((c) => {
            const status = getAnswer(tab, c.id, item.id).status
            return (
              <span
                key={c.id}
                className={cn(
                  'w-2.5 h-2.5 rounded-full',
                  status === 'yes' && 'bg-emerald-400',
                  status === 'no' && 'bg-red-400',
                  status === 'unknown' && 'bg-amber-400/40'
                )}
                title={`${c.name}: ${status}`}
              />
            )
          })}
        </div>
      </button>

      {/* Expanded detail */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          isExpanded ? 'max-h-[40rem] opacity-100 mt-3' : 'max-h-0 opacity-0'
        )}
      >
        <div className="space-y-3 pl-1">
          {item.fullLabel !== item.shortLabel && (
            <p className="text-cream/60 text-sm">{item.fullLabel}</p>
          )}
          <p className="text-cream/40 text-xs">{item.detail}</p>

          {/* Per-contractor status + notes */}
          {contractors.map((c) => {
            const answer = getAnswer(tab, c.id, item.id)
            return (
              <div
                key={c.id}
                className="flex items-start gap-2 py-1 border-t border-cream/5"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-cream/50 text-xs font-medium mb-1">
                    {c.name}
                  </p>
                  <textarea
                    value={answer.notes}
                    onChange={(e) =>
                      setAnswer(tab, c.id, item.id, {
                        notes: e.target.value,
                      })
                    }
                    placeholder="Notes..."
                    className={cn(
                      'w-full px-2 py-1 rounded text-xs leading-relaxed',
                      'bg-basalt border border-cream/15 text-cream',
                      'placeholder:text-cream/30',
                      'focus:outline-none focus:border-sandstone',
                      'resize-y min-h-[1.5rem]'
                    )}
                  />
                </div>
                <div
                  className="shrink-0 pt-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <StatusControl
                    status={answer.status}
                    onChange={(status: TriStatus) =>
                      setAnswer(tab, c.id, item.id, { status })
                    }
                    compact
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
