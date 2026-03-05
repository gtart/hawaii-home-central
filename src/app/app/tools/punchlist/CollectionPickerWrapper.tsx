'use client'

import { CollectionsPickerView } from '@/components/app/CollectionsPickerView'

export function CollectionPickerWrapper() {
  return (
    <div className="pt-32 pb-[calc(6rem+var(--bottom-nav-offset,3.5rem))] px-6">
      <div className="max-w-4xl mx-auto overflow-x-clip">
        <CollectionsPickerView toolKey="punchlist" itemNoun="fix list" previewMode="statuses" />
      </div>
    </div>
  )
}
