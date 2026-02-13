import type { Metadata } from 'next'
import { ToolContent } from './ToolContent'

export const metadata: Metadata = {
  title: 'Decision Tracker',
}

export default function FinishDecisionsToolPage() {
  return <ToolContent />
}
