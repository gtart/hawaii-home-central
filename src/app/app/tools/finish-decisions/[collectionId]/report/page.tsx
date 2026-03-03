import type { Metadata } from 'next'
import { Suspense } from 'react'
import { FinishDecisionsReport } from '../../report/FinishDecisionsReport'

export const metadata: Metadata = {
  title: 'Selection Board Report',
  robots: 'noindex, nofollow',
}

export default async function CollectionReportPage({
  params,
}: {
  params: Promise<{ collectionId: string }>
}) {
  const { collectionId } = await params

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      }
    >
      <FinishDecisionsReport collectionIdOverride={collectionId} />
    </Suspense>
  )
}
