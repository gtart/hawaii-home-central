import type { Metadata } from 'next'
import { CollectionPickerWrapper } from './CollectionPickerWrapper'

export const metadata: Metadata = {
  title: 'Mood Boards',
}

export default function MoodBoardsPage() {
  return <CollectionPickerWrapper />
}
