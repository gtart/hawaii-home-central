'use client'

import { CollectionsPickerView } from '@/components/app/CollectionsPickerView'

export function CollectionPickerWrapper() {
  return (
    <div className="pt-32 pb-[calc(6rem+var(--bottom-nav-offset,3.5rem))] px-6 overflow-x-hidden">
      <div className="max-w-4xl mx-auto">
        <CollectionsPickerView toolKey="punchlist" itemNoun="fix list" previewMode="statuses" />
      </div>
    </div>
  )
}
