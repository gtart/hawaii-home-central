import type { Metadata } from 'next'
import { PlaybookContent } from './PlaybookContent'

export const metadata: Metadata = {
  title: 'Responsibility Matrix: Who Owns What in Your Renovation',
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
