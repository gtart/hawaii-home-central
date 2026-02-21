import type { Metadata } from 'next'
import { PunchlistReport } from './PunchlistReport'

export const metadata: Metadata = {
  title: 'Punchlist Report',
  robots: 'noindex, nofollow',
}

export default function ReportPage() {
  return <PunchlistReport />
}
