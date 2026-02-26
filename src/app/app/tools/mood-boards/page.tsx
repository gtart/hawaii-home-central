import type { Metadata } from 'next'
import { ToolContent } from './ToolContent'

export const metadata: Metadata = {
  title: 'Mood Boards',
}

export default function MoodBoardsPage() {
  return <ToolContent />
}
