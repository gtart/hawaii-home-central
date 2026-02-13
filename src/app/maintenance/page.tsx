import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Under Construction',
  robots: { index: false, follow: false },
}

export default function MaintenancePage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        {/* Construction hard hat icon */}
        <svg
          width="80"
          height="80"
          viewBox="0 0 80 80"
          fill="none"
          className="mx-auto mb-8 text-sandstone"
          aria-hidden="true"
        >
          <path
            d="M40 10C28.954 10 20 18.954 20 30v4H16a4 4 0 0 0-4 4v4a4 4 0 0 0 4 4h48a4 4 0 0 0 4-4v-4a4 4 0 0 0-4-4h-4v-4C60 18.954 51.046 10 40 10Z"
            fill="currentColor"
            opacity="0.2"
          />
          <path
            d="M40 10C28.954 10 20 18.954 20 30v4H16a4 4 0 0 0-4 4v4a4 4 0 0 0 4 4h48a4 4 0 0 0 4-4v-4a4 4 0 0 0-4-4h-4v-4C60 18.954 51.046 10 40 10Z"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M40 10v24M28 34V22M52 34V22"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <rect
            x="12"
            y="46"
            width="56"
            height="6"
            rx="2"
            fill="currentColor"
            opacity="0.15"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M22 52v12M40 52v12M58 52v12"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>

        <h1 className="font-serif text-3xl md:text-4xl text-sandstone mb-4">
          We&apos;re Making Improvements
        </h1>
        <p className="text-cream/70 text-lg leading-relaxed mb-2">
          Hawaii Home Central is temporarily offline while we make some updates.
        </p>
        <p className="text-cream/50 text-base mb-8">
          We&apos;ll be back soon.
        </p>
        <p className="text-cream/40 text-sm">
          Questions?{' '}
          <a
            href="mailto:hello@hawaiihomecentral.com"
            className="text-sandstone hover:text-sandstone-light transition-colors"
          >
            hello@hawaiihomecentral.com
          </a>
        </p>
      </div>
    </div>
  )
}
