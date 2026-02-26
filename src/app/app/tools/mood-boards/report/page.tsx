import type { Metadata } from 'next'
import { MoodBoardReport } from './MoodBoardReport'

export const metadata: Metadata = {
  title: 'Mood Board Report',
  robots: 'noindex, nofollow',
}

export default function ReportPage() {
  return <MoodBoardReport />
}
