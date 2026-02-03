'use client'

import { useState, FormEvent } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

type Role = 'homeowner' | 'contractor' | 'both'

interface FormData {
  email: string
  role: Role | ''
  island: string
}

const ISLANDS = [
  { value: '', label: 'Select an island (optional)' },
  { value: 'oahu', label: 'Oʻahu' },
  { value: 'maui', label: 'Maui' },
  { value: 'hawaii', label: 'Hawaiʻi (Big Island)' },
  { value: 'kauai', label: 'Kauaʻi' },
  { value: 'other', label: 'Other' },
]

const ROLES = [
  { value: '', label: 'Select your role' },
  { value: 'homeowner', label: 'Homeowner' },
  { value: 'contractor', label: 'Contractor or Trade' },
  { value: 'both', label: 'Both' },
]

export function NativeForm() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    role: '',
    island: '',
  })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setStatus('submitting')
    setErrorMessage('')

    // Validate required fields
    if (!formData.email || !formData.role) {
      setStatus('error')
      setErrorMessage('Please fill in all required fields.')
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setStatus('error')
      setErrorMessage('Please enter a valid email address.')
      return
    }

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setStatus('success')
    } catch {
      setStatus('error')
      setErrorMessage('Something went wrong. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center py-12 px-6 bg-basalt-50 rounded-card">
        <div className="text-4xl mb-4">🌺</div>
        <h3 className="font-serif text-2xl text-sandstone mb-4">
          You&apos;re on the early list—watch your inbox.
        </h3>
        <p className="text-cream/70">
          Mahalo for signing up! We&apos;ll be in touch soon with early access details.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Email Address"
        type="email"
        required
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="you@example.com"
        disabled={status === 'submitting'}
      />

      <Select
        label="Your Role"
        required
        value={formData.role}
        onChange={(e) => setFormData({ ...formData, role: e.target.value as Role | '' })}
        options={ROLES}
        disabled={status === 'submitting'}
      />

      <Select
        label="Island"
        value={formData.island}
        onChange={(e) => setFormData({ ...formData, island: e.target.value })}
        options={ISLANDS}
        disabled={status === 'submitting'}
      />

      {status === 'error' && (
        <p className="text-red-400 text-sm" role="alert">
          {errorMessage}
        </p>
      )}

      <Button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full"
        size="lg"
      >
        {status === 'submitting' ? 'Joining...' : 'Get Early Access'}
      </Button>

      <p className="text-xs text-cream/50 text-center">
        Get notified when we launch. Early subscribers get first access. No spam. Unsubscribe anytime.
      </p>
    </form>
  )
}
