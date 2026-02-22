import type { Metadata } from 'next'
import { BeforeYouSignContent } from './BeforeYouSignContent'

export const metadata: Metadata = {
  title: 'Contract Checklist',
}

export default function BeforeYouSignPage() {
  return <BeforeYouSignContent />
}
