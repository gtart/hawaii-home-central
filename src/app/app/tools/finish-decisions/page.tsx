import type { Metadata } from 'next'
import { CollectionPickerWrapper } from './CollectionPickerWrapper'

export const metadata: Metadata = {
  title: 'Decision List',
}

export default function FinishDecisionsToolPage() {
  return <CollectionPickerWrapper />
}
