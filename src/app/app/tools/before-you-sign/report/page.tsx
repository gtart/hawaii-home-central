import type { Metadata } from 'next'
import { Suspense } from 'react'
import { BeforeYouSignReport } from './BeforeYouSignReport'

export const metadata: Metadata = {
  title: 'Contract Checklist Report',
  robots: 'noindex, nofollow',
}

export default function BeforeYouSignReportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      }
    >
      <BeforeYouSignReport />
    </Suspense>
  )
}
