import type { Metadata } from 'next'
import { BeforeYouSignContent } from './BeforeYouSignContent'

export const metadata: Metadata = {
  title: 'Before You Sign',
}

export default function BeforeYouSignPage() {
  return <BeforeYouSignContent />
}
