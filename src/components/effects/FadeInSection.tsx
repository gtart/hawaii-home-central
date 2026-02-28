'use client'

import { useRef, useEffect, useState } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'

interface FadeInSectionProps {
  children: React.ReactNode
  className?: string
  threshold?: number
  delay?: number
}

export function FadeInSection({
  children,
  className = '',
  threshold = 0.1,
  delay = 0,
}: FadeInSectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  // Start as 'idle' (visible by default), JS sets to 'pending' then 'visible'
  const [state, setState] = useState<'idle' | 'pending' | 'visible'>('idle')
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (prefersReducedMotion) {
      setState('visible')
      return
    }

    // Once JS loads, hide elements that are below the fold
    setState('pending')

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            setTimeout(() => setState('visible'), delay)
          } else {
            setState('visible')
          }
          observer.disconnect()
        }
      },
      { threshold }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [threshold, prefersReducedMotion, delay])

  return (
    <div
      ref={ref}
      className={cn(
        prefersReducedMotion ? '' : 'animate-on-scroll',
        state === 'pending' ? 'pending' : '',
        state === 'visible' ? 'visible' : '',
        className
      )}
    >
      {children}
    </div>
  )
}
