'use client'

export default function CollectionDecisionDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-lg font-medium text-cream mb-2">Something went wrong</h2>
        <p className="text-sm text-cream/65 mb-4">
          {error.message || 'An unexpected error occurred while loading this decision.'}
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-sandstone text-basalt text-sm font-medium rounded-lg hover:bg-sandstone-light transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
