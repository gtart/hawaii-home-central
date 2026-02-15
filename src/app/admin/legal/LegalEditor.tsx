'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { MarkdownRenderer } from '@/components/content/MarkdownRenderer'
import { LEGAL_DEFAULTS } from '@/lib/legalDefaults'

type LegalTab = 'privacy' | 'terms' | 'disclaimer'

const TABS: { key: LegalTab; label: string; settingKey: string; defaultKey: keyof typeof LEGAL_DEFAULTS }[] = [
  { key: 'privacy', label: 'Privacy', settingKey: 'legal_privacy_md', defaultKey: 'privacyMd' },
  { key: 'terms', label: 'Terms', settingKey: 'legal_terms_md', defaultKey: 'termsMd' },
  { key: 'disclaimer', label: 'Disclaimer', settingKey: 'legal_disclaimer_md', defaultKey: 'disclaimerMd' },
]

export function LegalEditor() {
  const [activeTab, setActiveTab] = useState<LegalTab>('privacy')
  const [effectiveDate, setEffectiveDate] = useState<string>(LEGAL_DEFAULTS.effectiveDate)
  const [drafts, setDrafts] = useState<Record<LegalTab, string>>({
    privacy: LEGAL_DEFAULTS.privacyMd as string,
    terms: LEGAL_DEFAULTS.termsMd as string,
    disclaimer: LEGAL_DEFAULTS.disclaimerMd as string,
  })
  const [showPreview, setShowPreview] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Load existing settings
  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data: Record<string, string>) => {
        if (data.legal_effective_date) {
          setEffectiveDate(data.legal_effective_date)
        }
        setDrafts({
          privacy: data.legal_privacy_md || LEGAL_DEFAULTS.privacyMd,
          terms: data.legal_terms_md || LEGAL_DEFAULTS.termsMd,
          disclaimer: data.legal_disclaimer_md || LEGAL_DEFAULTS.disclaimerMd,
        })
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            legal_effective_date: effectiveDate,
            legal_privacy_md: drafts.privacy,
            legal_terms_md: drafts.terms,
            legal_disclaimer_md: drafts.disclaimer,
          },
        }),
      })
      if (res.ok) {
        setMessage('Saved successfully')
      } else {
        setMessage('Error saving')
      }
    } catch {
      setMessage('Error saving')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    const tab = TABS.find((t) => t.key === activeTab)!
    setDrafts((prev) => ({ ...prev, [activeTab]: LEGAL_DEFAULTS[tab.defaultKey] }))
    if (activeTab === 'privacy') {
      setEffectiveDate(LEGAL_DEFAULTS.effectiveDate)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-cream/40 text-sm">
        <div className="w-4 h-4 border-2 border-sandstone/30 border-t-sandstone rounded-full animate-spin" />
        Loading...
      </div>
    )
  }

  const currentDraft = drafts[activeTab]

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-colors',
              activeTab === tab.key
                ? 'bg-sandstone text-basalt'
                : 'bg-basalt-50 text-cream/50 border border-cream/10 hover:border-cream/30 hover:text-cream/70'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Effective date */}
      <div>
        <label className="block text-xs text-cream/50 mb-1">
          Effective Date
        </label>
        <input
          value={effectiveDate}
          onChange={(e) => setEffectiveDate(e.target.value)}
          placeholder="February 14, 2026"
          className="w-full max-w-xs bg-basalt-50 border border-cream/10 rounded px-3 py-2 text-cream text-sm focus:border-sandstone focus:outline-none"
        />
      </div>

      {/* Editor / Preview toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowPreview(false)}
          className={cn(
            'text-sm font-medium transition-colors',
            !showPreview ? 'text-sandstone' : 'text-cream/40 hover:text-cream/60'
          )}
        >
          Edit
        </button>
        <span className="text-cream/20">|</span>
        <button
          onClick={() => setShowPreview(true)}
          className={cn(
            'text-sm font-medium transition-colors',
            showPreview ? 'text-sandstone' : 'text-cream/40 hover:text-cream/60'
          )}
        >
          Preview
        </button>
      </div>

      {/* Editor or preview */}
      {showPreview ? (
        <div className="bg-basalt-50 rounded-card p-6 border border-cream/10 max-h-[600px] overflow-y-auto">
          <MarkdownRenderer content={currentDraft} />
        </div>
      ) : (
        <textarea
          value={currentDraft}
          onChange={(e) =>
            setDrafts((prev) => ({ ...prev, [activeTab]: e.target.value }))
          }
          className="w-full bg-basalt-50 border border-cream/10 rounded-card px-4 py-3 text-cream text-sm font-mono leading-relaxed resize-y focus:border-sandstone focus:outline-none"
          style={{ minHeight: '400px' }}
        />
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save All'}
        </Button>
        <Button variant="secondary" size="sm" onClick={handleReset}>
          Reset to Defaults
        </Button>
        <a
          href={`/${activeTab === 'privacy' ? 'privacy' : activeTab === 'terms' ? 'terms' : 'disclaimer'}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-cream/40 hover:text-sandstone transition-colors"
        >
          View live page &rarr;
        </a>
        {message && (
          <span className="text-sm text-cream/50">{message}</span>
        )}
      </div>
    </div>
  )
}
