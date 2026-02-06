import type { Metadata } from 'next'
import { PlaybookContent } from './PlaybookContent'

export const metadata: Metadata = {
  title: 'Hold Points: Specs You Must Lock In By Stage',
  description: 'A stage-by-stage guide to the material and finish decisions that must be locked in before each construction phase. Built for Hawai\u02BBi renovations.',
  keywords: [
    'construction hold points',
    'spec decisions by stage',
    'renovation specifications',
    'Hawaii renovation planning',
    'building phase checklist',
    'construction decision timeline',
  ],
}

export default function HoldPointsPage() {
  return <PlaybookContent />
}
