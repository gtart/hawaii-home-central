'use client'

import { ShareButton } from '@/components/resources/ShareButton'
import { PreviewGate } from '@/components/auth/PreviewGate'

function PreviewTeaser() {
  return (
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
  )
}

export function PlaybookContent() {
  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="font-serif text-4xl md:text-5xl text-sandstone">
            Fair Bid Checklist
          </h1>
          <div className="shrink-0 mt-2">
            <ShareButton title="Fair Bid Checklist &mdash; Hawaii Home Central" />
          </div>
        </div>
        <p className="text-cream/70 text-lg mb-8 leading-relaxed">
          Compare bids apples-to-apples. This checklist surfaces the gaps, exclusions, and assumptions that cause disputes&mdash;before you sign anything.
        </p>

        <PreviewGate
          previewContent={<PreviewTeaser />}
          appToolPath="/app/tools/fair-bid-checklist"
        />
      </div>
    </div>
  )
}
