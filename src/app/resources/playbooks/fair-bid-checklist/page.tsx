import type { Metadata } from 'next'
import { PlaybookContent } from './PlaybookContent'

export const metadata: Metadata = {
  title: 'Fair Bid Checklist',
  description: 'A comprehensive checklist for comparing contractor bids in Hawaiʻi. 11 sections covering scope, labor, materials, allowances, permits, timeline, change orders, and more.',
  keywords: [
    'contractor bid checklist',
    'Hawaii contractor',
    'renovation bid comparison',
    'home renovation Hawaii',
    'contractor bid evaluation',
  ],
}

export default function FairBidChecklistPage() {
  return <PlaybookContent />
}
