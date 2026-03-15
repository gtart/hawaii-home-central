import type { Metadata } from 'next'
import { CollectionPickerWrapper } from './CollectionPickerWrapper'

export const metadata: Metadata = {
  title: 'Change Log',
}

export default function ProjectSummaryPage() {
  return <CollectionPickerWrapper />
}
