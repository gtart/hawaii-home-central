import type { Metadata } from 'next'
import { PlaybookContent } from './PlaybookContent'

export const metadata: Metadata = {
  title: 'Who Handles What — Renovation Task Ownership for Hawaiʻi',
  description:
    'Clarify who handles commonly-missed renovation responsibilities. Assign ownership, document agreements, and prevent disputes before they start.',
  keywords: [
    'renovation responsibility matrix',
    'contractor responsibilities',
    'homeowner responsibilities',
    'renovation planning',
    'Hawaii renovation',
    'construction ownership',
  ],
}

export default function ResponsibilityMatrixPage() {
  return <PlaybookContent />
}
