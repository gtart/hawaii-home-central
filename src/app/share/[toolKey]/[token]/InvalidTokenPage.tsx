import Link from 'next/link'

export function InvalidTokenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
          <svg className="w-7 h-7 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="font-serif text-2xl text-cream mb-2">
          Link Expired or Revoked
        </h1>
        <p className="text-cream/50 text-sm mb-6">
          This shared link is no longer valid. It may have been revoked by the
          project owner or expired.
        </p>
        <Link
          href="/"
          className="text-sandstone hover:text-sandstone-light text-sm transition-colors"
        >
          Go to Hawaii Home Central &rarr;
        </Link>
      </div>
    </div>
  )
}
