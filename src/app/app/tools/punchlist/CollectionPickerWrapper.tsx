'use client'

import { CollectionsPickerView } from '@/components/app/CollectionsPickerView'

export function CollectionPickerWrapper() {
  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        <CollectionsPickerView toolKey="punchlist" itemNoun="fix list" previewMode="statuses" />
      </div>
    </div>
  )
}
