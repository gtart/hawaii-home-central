import type { Metadata } from 'next'
import { DecisionDetailContent } from './DecisionDetailContent'

export const metadata: Metadata = {
  title: 'Selection Detail',
}

export default function DecisionDetailPage() {
  return <DecisionDetailContent />
}
