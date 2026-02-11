import type { Metadata } from 'next'
import { ToolContent } from './ToolContent'

export const metadata: Metadata = {
  title: 'Decision Points',
}

export default function DecisionPointsToolPage() {
  return <ToolContent />
}
