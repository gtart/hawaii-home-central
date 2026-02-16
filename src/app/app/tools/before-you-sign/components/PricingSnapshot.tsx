'use client'

import { cn } from '@/lib/utils'
import type { BYSContractor, ContractType } from '../types'

interface PricingSnapshotProps {
  contractors: BYSContractor[]
  activeContractorId: string
  onUpdate: (id: string, updates: Partial<BYSContractor>) => void
}

const CONTRACT_TYPE_OPTIONS: { value: ContractType; label: string }[] = [
  { value: '', label: 'Select...' },
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'time_materials', label: 'Time & Materials' },
  { value: 'cost_plus', label: 'Cost Plus' },
  { value: 'not_sure', label: 'Not sure' },
]

const PRICING_FIELDS: {
  key: keyof Pick<BYSContractor, 'totalValue' | 'allowances' | 'laborEstimate' | 'materialsEstimate'>
  label: string
  placeholder: string
}[] = [
  { key: 'totalValue', label: 'Total Contract Value', placeholder: 'e.g., $85,000' },
  { key: 'allowances', label: 'Allowances', placeholder: 'e.g., $12,000' },
  { key: 'laborEstimate', label: 'Est. Labor', placeholder: 'e.g., $40,000' },
  { key: 'materialsEstimate', label: 'Est. Materials', placeholder: 'e.g., $30,000' },
]

const inputClasses = cn(
  'w-full px-2.5 py-1.5 rounded-lg text-sm',
  'bg-basalt border border-cream/15 text-cream',
  'placeholder:text-cream/30',
  'focus:outline-none focus:border-sandstone focus:ring-1 focus:ring-sandstone'
)

function SingleContractorForm({
  contractor,
  onUpdate,
}: {
  contractor: BYSContractor
  onUpdate: PricingSnapshotProps['onUpdate']
}) {
  return (
    <div className="bg-basalt-50 rounded-lg border border-cream/10 p-4">
      <h3 className="text-xs font-medium text-cream/50 uppercase tracking-wider mb-3">
        Pricing Details
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PRICING_FIELDS.map((field) => (
          <div key={field.key}>
            <label className="block text-xs text-cream/40 mb-1">
              {field.label}
            </label>
            <input
              type="text"
              value={contractor[field.key] ?? ''}
              onChange={(e) =>
                onUpdate(contractor.id, { [field.key]: e.target.value })
              }
              placeholder={field.placeholder}
              className={inputClasses}
            />
          </div>
        ))}
        <div className="sm:col-span-2">
          <label className="block text-xs text-cream/40 mb-1">
            Contract Type
          </label>
          <select
            value={contractor.contractType ?? ''}
            onChange={(e) =>
              onUpdate(contractor.id, {
                contractType: e.target.value as ContractType,
              })
            }
            className={cn(inputClasses, 'appearance-none')}
          >
            {CONTRACT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

function CompareTable({
  contractors,
  onUpdate,
}: {
  contractors: BYSContractor[]
  onUpdate: PricingSnapshotProps['onUpdate']
}) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block bg-basalt-50 rounded-lg border border-cream/10 overflow-hidden">
        <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '30%' }} />
            {contractors.map((c) => (
              <col key={c.id} style={{ width: `${70 / contractors.length}%` }} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-cream/5">
              <th className="text-left px-4 py-2 text-cream/40 text-xs font-medium uppercase tracking-wider">
                Pricing
              </th>
              {contractors.map((c) => (
                <th
                  key={c.id}
                  className="text-center px-3 py-2 text-cream/40 text-xs font-medium uppercase tracking-wider"
                >
                  {c.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PRICING_FIELDS.map((field) => (
              <tr key={field.key} className="border-b border-cream/5 last:border-b-0">
                <td className="px-4 py-2 text-cream/60 text-sm">
                  {field.label}
                </td>
                {contractors.map((c) => (
                  <td key={c.id} className="px-3 py-1.5">
                    <input
                      type="text"
                      value={c[field.key] ?? ''}
                      onChange={(e) =>
                        onUpdate(c.id, { [field.key]: e.target.value })
                      }
                      placeholder={field.placeholder}
                      className={cn(inputClasses, 'text-center')}
                    />
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="px-4 py-2 text-cream/60 text-sm">
                Contract Type
              </td>
              {contractors.map((c) => (
                <td key={c.id} className="px-3 py-1.5">
                  <select
                    value={c.contractType ?? ''}
                    onChange={(e) =>
                      onUpdate(c.id, {
                        contractType: e.target.value as ContractType,
                      })
                    }
                    className={cn(inputClasses, 'appearance-none text-center')}
                  >
                    {CONTRACT_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards */}
      <div className="md:hidden space-y-3">
        {contractors.map((c) => (
          <SingleContractorForm key={c.id} contractor={c} onUpdate={onUpdate} />
        ))}
      </div>
    </>
  )
}

export function PricingSnapshot({
  contractors,
  activeContractorId,
  onUpdate,
}: PricingSnapshotProps) {
  const isCompareMode = activeContractorId === 'all'
  const activeContractor = contractors.find((c) => c.id === activeContractorId)

  if (isCompareMode) {
    return <CompareTable contractors={contractors} onUpdate={onUpdate} />
  }

  if (activeContractor) {
    return (
      <SingleContractorForm
        contractor={activeContractor}
        onUpdate={onUpdate}
      />
    )
  }

  return null
}
