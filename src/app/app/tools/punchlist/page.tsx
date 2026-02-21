import type { Metadata } from 'next'
import { ToolContent } from './ToolContent'

export const metadata: Metadata = {
  title: 'Punchlist',
}

export default function PunchlistPage() {
  return <ToolContent />
}
