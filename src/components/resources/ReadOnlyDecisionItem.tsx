/**
 * @deprecated 2026-02-16
 * Retained for reference only. Canonical replacement: /resources/renovation-stages
 * Do NOT import into production UI.
 */

'use client'

import { useState } from 'react'
import type { DecisionPointItemData } from '@/data/decision-points'

export function ReadOnlyDecisionItem({ item }: { item: DecisionPointItemData }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-basalt-50 rounded-card p-5">
      <p className="text-sandstone/70 text-xs font-medium uppercase tracking-wider">
        {item.category}
      </p>
      <p className="text-cream/80 text-sm mt-2 leading-relaxed">
        {item.summary}
      </p>

      <button
        onClick={() => setOpen(!open)}
        className="text-sandstone/60 text-xs mt-3 hover:text-sandstone transition-colors cursor-pointer"
      >
        {open ? 'Hide detail \u25B2' : 'More detail \u25BC'}
      </button>

      {open && (
        <div className="mt-3 space-y-3 text-sm border-t border-cream/5 pt-3">
          <div>
            <span className="text-cream/50 font-medium">Why it matters: </span>
            <span className="text-cream/60">{item.why}</span>
          </div>
          <div>
            <span className="text-cream/50 font-medium">What it impacts: </span>
            <span className="text-cream/60">{item.impacts}</span>
          </div>
          <div>
            <span className="text-cream/50 font-medium">Ask your contractor: </span>
            <span className="text-cream/60">{item.ask}</span>
          </div>
        </div>
      )}

      {item.hawaiiCallout && (
        <div className="mt-3 bg-sandstone/10 border border-sandstone/20 rounded-lg p-3">
          <p className="text-sandstone/90 text-xs font-medium mb-1">
            Hawai&#x02BB;i reality
          </p>
          <p className="text-cream/60 text-xs leading-relaxed">
            {item.hawaiiCallout}
          </p>
        </div>
      )}
    </div>
  )
}
