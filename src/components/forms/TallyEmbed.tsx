'use client'

import { useState, useEffect } from 'react'

interface TallyEmbedProps {
  formUrl: string
}

export function TallyEmbed({ formUrl }: TallyEmbedProps) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load Tally script dynamically
    const existingScript = document.querySelector('script[src="https://tally.so/widgets/embed.js"]')

    if (!existingScript) {
      const script = document.createElement('script')
      script.src = 'https://tally.so/widgets/embed.js'
      script.async = true
      script.onload = () => {
        setIsLoading(false)
        // Trigger Tally to load embeds
        if (typeof window !== 'undefined' && (window as unknown as { Tally?: { loadEmbeds: () => void } }).Tally) {
          (window as unknown as { Tally: { loadEmbeds: () => void } }).Tally.loadEmbeds()
        }
      }
      document.body.appendChild(script)
    } else {
      setIsLoading(false)
      // Trigger Tally to load embeds if script already exists
      if (typeof window !== 'undefined' && (window as unknown as { Tally?: { loadEmbeds: () => void } }).Tally) {
        (window as unknown as { Tally: { loadEmbeds: () => void } }).Tally.loadEmbeds()
      }
    }
  }, [])

  return (
    <div className="relative min-h-[450px] bg-basalt-50 rounded-card overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-cream/50 animate-pulse">Loading form...</div>
        </div>
      )}
      <iframe
        data-tally-src={formUrl}
        loading="lazy"
        width="100%"
        height="450"
        frameBorder="0"
        marginHeight={0}
        marginWidth={0}
        title="Early Access Signup Form"
        className="rounded-card"
        style={{ background: 'transparent' }}
      />
    </div>
  )
}
