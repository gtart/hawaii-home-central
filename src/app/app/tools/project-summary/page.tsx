import type { Metadata } from 'next'
import { CollectionPickerWrapper } from './CollectionPickerWrapper'

export const metadata: Metadata = {
  title: 'Plan & Changes',
}

export default function ProjectSummaryPage() {
  return <CollectionPickerWrapper />
}
