import type { Metadata } from 'next'
import { ToolContent } from './ToolContent'

export const metadata: Metadata = {
  title: 'Hold Points',
}

export default function HoldPointsToolPage() {
  return <ToolContent />
}
