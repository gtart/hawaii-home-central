import type { Metadata } from 'next'
import { CollectionPickerWrapper } from './CollectionPickerWrapper'

export const metadata: Metadata = {
  title: 'Decision Tracker',
}

export default function FinishDecisionsToolPage() {
  return <CollectionPickerWrapper />
}
