import type { Metadata } from 'next'
import { ToolContent } from './ToolContent'

export const metadata: Metadata = {
  title: 'Fix List',
}

export default function PunchlistPage() {
  return <ToolContent />
}
