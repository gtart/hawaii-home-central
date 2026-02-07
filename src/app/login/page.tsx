import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoginContent } from './LoginContent'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to Hawaii Home Central to save your tool progress.',
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="pt-32 pb-24 px-6 flex justify-center">
          <div className="w-6 h-6 border-2 border-sandstone/30 border-t-sandstone rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
