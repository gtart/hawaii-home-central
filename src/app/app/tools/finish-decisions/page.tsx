import type { Metadata } from 'next'
import { CollectionPickerWrapper } from './CollectionPickerWrapper'

export const metadata: Metadata = {
  title: 'Selection Lists',
}

export default function FinishDecisionsToolPage() {
  return <CollectionPickerWrapper />
}
