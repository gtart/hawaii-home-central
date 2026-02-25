'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/Button'

const TEMPLATE_VARS = [
  { name: 'inviterName', description: 'Name of the person sending the invite', example: 'Jane Doe' },
  { name: 'toolName', description: 'Tool being shared', example: 'Selection Boards' },
  { name: 'accessLevel', description: '"edit" or "view"', example: 'edit' },
  { name: 'projectName', description: 'Name of the project', example: 'My Home' },
  { name: 'inviteLink', description: 'Full invite acceptance URL', example: 'https://www.hawaiihomecentral.com/invite/abc123' },
]

const DEFAULT_SUBJECT = '{{inviterName}} shared {{toolName}} with you'

const DEFAULT_BODY = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
  <h2 style="color: #1a1a1a; font-size: 22px; margin: 0 0 8px;">You've been invited to collaborate</h2>
  <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
    <strong>{{inviterName}}</strong> has invited you to <strong>{{accessLevel}}</strong>
    the <strong>{{toolName}}</strong> for their project <strong>{{projectName}}</strong>
    on Hawaii Home Central.
  </p>
  <a href="{{inviteLink}}"
     style="display: inline-block; padding: 12px 28px; background: #C4A265; color: #1a1a1a; font-weight: 600; text-decoration: none; border-radius: 8px; font-size: 15px;">
    Accept Invite
  </a>
  <p style="color: #999; font-size: 13px; margin-top: 28px; line-height: 1.5;">
    This invite expires in 7 days. If you didn't expect this, you can safely ignore it.
  </p>
</div>`

function interpolatePreview(template: string): string {
  const sampleVars: Record<string, string> = {}
  for (const v of TEMPLATE_VARS) {
    sampleVars[v.name] = v.example
  }
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => sampleVars[key] ?? match)
}

export function EmailTemplateEditor() {
  const [fromAddress, setFromAddress] = useState('')
  const [subject, setSubject] = useState(DEFAULT_SUBJECT)
  const [body, setBody] = useState(DEFAULT_BODY)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data: Record<string, string>) => {
        if (data['email_from_address']) setFromAddress(data['email_from_address'])
        if (data['invite_email_subject']) setSubject(data['invite_email_subject'])
        if (data['invite_email_body']) setBody(data['invite_email_body'])
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    setMessage('')
    try {
      const settings: Record<string, string> = {
        invite_email_subject: subject,
        invite_email_body: body,
      }
      if (fromAddress.trim()) {
        settings['email_from_address'] = fromAddress.trim()
      }

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      })
      setMessage(res.ok ? 'Saved' : 'Error saving')
    } catch {
      setMessage('Error saving')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setSubject(DEFAULT_SUBJECT)
    setBody(DEFAULT_BODY)
    setFromAddress('')
    setMessage('')
  }

  const previewSubject = useMemo(() => interpolatePreview(subject), [subject])
  const previewBody = useMemo(() => interpolatePreview(body), [body])

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-cream/40 text-sm">
        <div className="w-4 h-4 border-2 border-sandstone/30 border-t-sandstone rounded-full animate-spin" />
        Loading...
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* Left: Editor */}
      <div className="space-y-5">
        {/* From Address */}
        <div>
          <label className="block text-sm text-cream/70 mb-1.5">From address</label>
          <input
            value={fromAddress}
            onChange={(e) => setFromAddress(e.target.value)}
            placeholder="Hawaii Home Central <noreply@hawaiihomecentral.com>"
            className="w-full bg-basalt-50 border border-cream/10 rounded-lg px-3 py-2.5 text-cream text-sm placeholder:text-cream/20 focus:border-sandstone focus:outline-none"
          />
          <p className="text-xs text-cream/30 mt-1">
            Leave blank to use the RESEND_FROM_EMAIL env var default.
          </p>
        </div>

        {/* Subject Line */}
        <div>
          <label className="block text-sm text-cream/70 mb-1.5">Subject line</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-basalt-50 border border-cream/10 rounded-lg px-3 py-2.5 text-cream text-sm focus:border-sandstone focus:outline-none"
          />
        </div>

        {/* Body HTML */}
        <div>
          <label className="block text-sm text-cream/70 mb-1.5">Body (HTML with inline styles)</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={18}
            className="w-full bg-basalt-50 border border-cream/10 rounded-lg px-3 py-2.5 text-cream text-sm font-mono leading-relaxed resize-y focus:border-sandstone focus:outline-none"
          />
          <p className="text-xs text-cream/30 mt-1">
            Use inline styles only — email clients strip &lt;style&gt; tags.
          </p>
        </div>

        {/* Available Variables */}
        <div className="bg-basalt-50 rounded-lg border border-cream/10 p-4">
          <h3 className="text-xs font-medium text-cream/40 uppercase tracking-wider mb-3">
            Available variables
          </h3>
          <div className="space-y-1.5">
            {TEMPLATE_VARS.map((v) => (
              <div key={v.name} className="flex items-baseline gap-3 text-sm">
                <code className="text-sandstone text-xs font-mono bg-sandstone/10 px-1.5 py-0.5 rounded shrink-0">
                  {'{{' + v.name + '}}'}
                </code>
                <span className="text-cream/50">{v.description}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Template'}
          </Button>
          <button
            type="button"
            onClick={handleReset}
            className="text-sm text-cream/40 hover:text-cream/60 transition-colors"
          >
            Reset to defaults
          </button>
          {message && (
            <span className="text-sm text-cream/50">{message}</span>
          )}
        </div>
      </div>

      {/* Right: Preview */}
      <div>
        <h2 className="text-sm font-medium text-cream/50 mb-3 uppercase tracking-wider">Preview</h2>
        <div className="bg-white rounded-lg overflow-hidden shadow-lg">
          {/* Subject preview */}
          <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
            <p className="text-[11px] text-gray-400 mb-0.5 uppercase tracking-wider">Subject</p>
            <p className="text-sm text-gray-900 font-medium">{previewSubject}</p>
          </div>
          {/* Body preview */}
          <div
            className="p-1"
            dangerouslySetInnerHTML={{ __html: previewBody }}
          />
        </div>
      </div>
    </div>
  )
}
