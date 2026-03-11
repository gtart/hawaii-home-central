'use client'

import type { AlignmentGuestResponse } from '@/data/alignment'

interface Props {
  response: AlignmentGuestResponse
}

export function GuestResponseCard({ response }: Props) {
  const date = new Date(response.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div className="rounded-xl border border-cream/8 bg-basalt-50 p-4 space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-sandstone/15 flex items-center justify-center">
            <span className="text-[10px] font-medium text-sandstone">
              {response.respondent_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-sm font-medium text-cream">{response.respondent_name}</span>
          <span className="text-[10px] text-cream/25 bg-cream/5 px-1.5 py-0.5 rounded">Guest</span>
        </div>
        <span className="text-[10px] text-cream/20">{date}</span>
      </div>

      {/* Structured fields */}
      {response.understanding_of_issue && (
        <ResponseField label="Understanding" value={response.understanding_of_issue} />
      )}

      {response.included_not_included_unsure && (
        <ResponseField
          label="Included?"
          value={
            response.included_not_included_unsure === 'included' ? 'Included in scope'
            : response.included_not_included_unsure === 'not_included' ? 'Not included in scope'
            : 'Unsure'
          }
        />
      )}

      {response.cost_impact && (
        <ResponseField label="Cost Impact" value={response.cost_impact} />
      )}

      {response.schedule_impact && (
        <ResponseField label="Schedule Impact" value={response.schedule_impact} />
      )}

      {response.suggested_resolution && (
        <ResponseField label="Suggested Resolution" value={response.suggested_resolution} />
      )}

      {response.note && (
        <ResponseField label="Note" value={response.note} />
      )}
    </div>
  )
}

function ResponseField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] font-medium text-cream/30 uppercase tracking-wider">{label}</span>
      <p className="text-sm text-cream/70 mt-0.5 leading-relaxed">{value}</p>
    </div>
  )
}
