import type { Metadata } from 'next'
import { ToolContent } from './ToolContent'

export const metadata: Metadata = {
  title: 'Responsibility Matrix',
}

export default function ResponsibilityMatrixToolPage() {
  return <ToolContent />
}
