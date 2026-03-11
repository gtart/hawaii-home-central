import type { Metadata } from 'next'
import { CollectionPickerWrapper } from './CollectionPickerWrapper'

export const metadata: Metadata = {
  title: 'Project Alignment',
}

export default function ProjectAlignmentPage() {
  return <CollectionPickerWrapper />
}
