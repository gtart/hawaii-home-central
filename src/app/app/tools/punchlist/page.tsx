import type { Metadata } from 'next'
import { CollectionPickerWrapper } from './CollectionPickerWrapper'

export const metadata: Metadata = {
  title: 'Fix Issues',
}

export default function PunchlistPage() {
  return <CollectionPickerWrapper />
}
