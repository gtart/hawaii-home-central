import type { Metadata } from 'next'
import { ToolContent } from './ToolContent'

export const metadata: Metadata = {
  title: 'Fair Bid Checklist',
}

export default function FairBidChecklistToolPage() {
  return <ToolContent />
}
