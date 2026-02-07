'use client'

import { PreviewGate } from '@/components/auth/PreviewGate'
import { RESPONSIBILITY_ITEMS } from '@/data/responsibility-matrix'

function PreviewTeaser() {
  return (
    <div className="bg-basalt-50 rounded-card p-6 mb-8">
      <h2 className="font-serif text-xl text-cream mb-3">What&apos;s inside</h2>
      <ul className="text-cream/60 space-y-2 text-sm">
        <li className="flex gap-3">
          <span className="text-sandstone">&rarr;</span>
          <span>
            {RESPONSIBILITY_ITEMS.length} commonly-missed responsibilities across all project stages
          </span>
        </li>
        <li className="flex gap-3">
          <span className="text-sandstone">&rarr;</span>
          <span>
            Owner assignment with guidance on who typically handles each item
          </span>
        </li>
        <li className="flex gap-3">
          <span className="text-sandstone">&rarr;</span>
          <span>
            Expandable detail: what ownership includes, clarifying questions,
            and common mismatches
          </span>
        </li>
        <li className="flex gap-3">
          <span className="text-sandstone">&rarr;</span>
          <span>
            Notes field for documenting your specific agreements
          </span>
        </li>
      </ul>
    </div>
  )
}

export function PlaybookContent() {
  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-serif text-4xl md:text-5xl text-sandstone mb-2">
          Responsibility Matrix
        </h1>
        <p className="text-cream/70 text-lg mb-4 leading-relaxed">
          Assign who owns the easy-to-miss tasks&mdash;so nothing gets assumed.
        </p>
        <p className="text-cream/60 text-sm mb-8 leading-relaxed">
          Not a contract&mdash;just a clarity baseline to confirm handoffs.
        </p>

        <PreviewGate
          previewContent={<PreviewTeaser />}
          appToolPath="/app/tools/responsibility-matrix"
        />
      </div>
    </div>
  )
}
