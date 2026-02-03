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
  const [isVisible, setIsVisible] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (prefersReducedMotion) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            setTimeout(() => setIsVisible(true), delay)
          } else {
            setIsVisible(true)
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
        isVisible ? 'visible' : '',
        className
      )}
    >
      {children}
    </div>
  )
}
