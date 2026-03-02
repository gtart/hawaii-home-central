'use client'

import { CollectionsPickerView } from '@/components/app/CollectionsPickerView'

export function CollectionPickerWrapper() {
  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-6xl mx-auto">
        <CollectionsPickerView toolKey="before_you_sign" itemNoun="contract comparison" />
      </div>
    </div>
  )
}
