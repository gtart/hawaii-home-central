import type { Metadata } from 'next'
import { PlaybookContent } from './PlaybookContent'

export const metadata: Metadata = {
  title: 'Apples-to-Apples Bid Checklist',
  description: 'Compare contractor bids apples-to-apples in Hawaiʻi. 11 sections covering scope, labor, materials, allowances, permits, timeline, and change orders.',
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
