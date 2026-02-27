'use client'

import { useState, useEffect } from 'react'
import { useProject } from '@/contexts/ProjectContext'
import { OnboardingModal } from './OnboardingModal'

export function OnboardingModalWrapper() {
  const { currentProject, isLoading } = useProject()
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (isLoading) return
    // Show the stage picker when the project exists but has no stage set
    if (currentProject && !currentProject.currentStage) {
      setShowModal(true)
    } else {
      setShowModal(false)
    }
  }, [isLoading, currentProject])

  if (!showModal) return null

  return <OnboardingModal onClose={() => setShowModal(false)} />
}
