'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { OnboardingModal } from './OnboardingModal'

export function OnboardingModalWrapper() {
  const { data: session, status } = useSession()
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) return

    fetch('/api/user/onboarding-status')
      .then((r) => r.json())
      .then((data) => {
        if (!data.hasSeenAppOnboarding) setShowModal(true)
      })
      .catch(() => {})
  }, [status, session])

  if (!showModal) return null

  return <OnboardingModal onClose={() => setShowModal(false)} />
}
