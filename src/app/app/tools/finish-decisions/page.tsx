import type { Metadata } from 'next'
import { CollectionPickerWrapper } from './CollectionPickerWrapper'

export const metadata: Metadata = {
  title: 'Selections',
}

export default function FinishDecisionsToolPage() {
  return <CollectionPickerWrapper />
}
