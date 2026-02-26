'use client'

import { useState, type ReactNode } from 'react'

/**
 * Image component with stateful error fallback.
 * When the image fails to load, renders the fallback ReactNode instead of
 * hiding the element (which leaves blank space).
 */
export function ImageWithFallback({
  src,
  alt,
  className,
  fallback,
  loading = 'lazy',
}: {
  src: string | undefined | null
  alt: string
  className?: string
  fallback: ReactNode
  loading?: 'lazy' | 'eager'
}) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return <>{fallback}</>
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => setFailed(true)}
    />
  )
}
