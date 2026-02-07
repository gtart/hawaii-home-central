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
          <span>5 construction stages from ordering through closeout</span>
        </li>
        <li className="flex gap-3">
          <span className="text-sandstone">&rarr;</span>
          <span>Category-first spec decisions for kitchen and bath renovations</span>
        </li>
        <li className="flex gap-3">
          <span className="text-sandstone">&rarr;</span>
          <span>Expandable detail: why it matters, what it impacts, and what to ask your contractor</span>
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
            Hold Points
          </h1>
          <div className="shrink-0 mt-2">
            <ShareButton title="Hold Points: Specs You Must Lock In By Stage &mdash; Hawaii Home Central" />
          </div>
        </div>
        <p className="text-cream/70 text-lg mb-8 leading-relaxed">
          The costliest renovation mistakes happen when decisions are made after construction moves on. This tool shows what must be locked in before each stage.
        </p>

        <PreviewGate
          previewContent={<PreviewTeaser />}
          appToolPath="/app/tools/hold-points"
        />
      </div>
    </div>
  )
}
