import type { Metadata } from 'next'
import { CollectionPickerWrapper } from './CollectionPickerWrapper'

export const metadata: Metadata = {
  title: 'Project Summary',
}

export default function ProjectSummaryPage() {
  return <CollectionPickerWrapper />
}
