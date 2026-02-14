'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ShareButton } from '@/components/resources/ShareButton'
import { ChecklistSection } from '@/components/resources/ChecklistSection'
import { CHECKLIST_SECTIONS } from '@/data/fair-bid-checklist'
import { useToolState } from '@/hooks/useToolState'

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

export function ToolContent({ embedded }: { embedded?: boolean }) {
  const { state: checkedItems, setState: setCheckedItems, isLoaded, isSyncing } =
    useToolState<Record<string, boolean>>({
      toolKey: 'fair_bid_checklist',
      localStorageKey: 'hhc_checklist_state',
      defaultValue: {},
    })

  const [showEssentialsOnly, setShowEssentialsOnly] = useState(false)

  const toggle = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const content = (
    <>
      {embedded ? (
        <>
          <div className="flex items-center justify-between gap-4 mb-2">
            <h2 className="font-serif text-2xl text-sandstone">
              Compare Your Quotes
            </h2>
            {isSyncing && (
              <span className="text-xs text-cream/30">Saving...</span>
            )}
          </div>
          <p className="text-cream/70 text-sm mb-6 leading-relaxed">
            Make sure you&apos;re comparing the same project&mdash;not just the bottom-line price.
          </p>
        </>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="font-serif text-4xl md:text-5xl text-sandstone">
              Compare Your Quotes
            </h1>
            <div className="shrink-0 mt-2 flex items-center gap-3">
              {isSyncing && (
                <span className="text-xs text-cream/30">Saving...</span>
              )}
              <ShareButton title="Compare Your Quotes &mdash; Hawaii Home Central" />
            </div>
          </div>
          <p className="text-cream/70 text-lg mb-8 leading-relaxed">
            Make sure you&apos;re comparing the same project&mdash;not just the
            bottom-line price. This checklist surfaces the gaps, exclusions, and
            assumptions that cause disputes.
          </p>
        </>
      )}

      <div className="bg-basalt-50 rounded-card p-6 mb-8">
        <h3 className="font-serif text-xl text-sandstone mb-3">
          You&apos;re ready when&hellip;
        </h3>
        <p className="text-cream/70 text-sm leading-relaxed mb-3">
          Every section below is clearly answered for each contractor
          you&apos;re comparing.
        </p>
        <p className="text-cream/60 text-sm leading-relaxed italic">
          The goal is to compare the same project&mdash;not just the
          bottom-line price.
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
    </>
  )

  if (embedded) {
    return <div>{content}</div>
  }

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        {content}
      </div>
    </div>
  )
}
