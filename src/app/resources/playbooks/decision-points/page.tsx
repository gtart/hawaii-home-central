import type { Metadata } from 'next'
import { PlaybookContent } from './PlaybookContent'

export const metadata: Metadata = {
  title: 'Decision Points: Specs You Must Lock In By Stage',
  description: 'A stage-by-stage guide to the material and finish decisions that must be locked in before each construction phase. Built for Hawaiʻi renovations.',
  keywords: [
    'construction decision points',
    'spec decisions by stage',
    'renovation specifications',
    'Hawaii renovation planning',
    'building phase checklist',
    'construction decision timeline',
  ],
}

export default function DecisionPointsPage() {
  return <PlaybookContent />
}
