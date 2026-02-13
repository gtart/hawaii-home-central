import type { Metadata } from 'next'
import { DecisionDetailContent } from './DecisionDetailContent'

export const metadata: Metadata = {
  title: 'Decision Detail',
}

export default function DecisionDetailPage() {
  return <DecisionDetailContent />
}
