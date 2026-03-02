import type { Metadata } from 'next'
import { CollectionPickerWrapper } from './CollectionPickerWrapper'

export const metadata: Metadata = {
  title: 'Contract Checklist',
}

export default function BeforeYouSignPage() {
  return <CollectionPickerWrapper />
}
