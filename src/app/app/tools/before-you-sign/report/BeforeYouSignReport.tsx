'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useToolState } from '@/hooks/useToolState'
import { useCollectionState } from '@/hooks/useCollectionState'
import { ALL_TABS } from '../beforeYouSignConfig'
import type {
  BYSPayload,
  BYSContractor,
  BYSAnswer,
  BYSAnswers,
  BYSCustomAgreeItem,
  BYSConfigSection,
  BYSConfigItem,
  TabKey,
  TriStatus,
} from '../types'

const DEFAULT_PAYLOAD: BYSPayload = {
  version: 1,
  contractors: [],
  selectedContractorIds: [],
  answers: { quotes: {}, handoffs: {}, agree: {} },
  customAgreeItems: [],
}

const TAB_LABELS: Record<TabKey, string> = {
  quotes: 'Contract Scope',
  handoffs: "Who's Responsible",
  agree: 'Contract Terms',
}

function statusIcon(s: TriStatus): string {
  if (s === 'yes') return '\u2713'
  if (s === 'no') return '\u2717'
  return '\u2014'
}

function statusColor(s: TriStatus): string {
  if (s === 'yes') return 'text-green-700'
  if (s === 'no') return 'text-red-600'
  return 'text-gray-400'
}

function formatCurrency(val?: string): string {
  if (!val) return '\u2014'
  const num = parseFloat(val.replace(/[^0-9.]/g, ''))
  if (isNaN(num)) return val
  return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

interface ReportSettings {
  companyName: string
  reportTitle: string
  footerText: string
}

export function BeforeYouSignReport({ collectionIdOverride }: { collectionIdOverride?: string } = {}) {
  const searchParams = useSearchParams()

  const collResult = useCollectionState<BYSPayload>({
    collectionId: collectionIdOverride ?? null,
    toolKey: 'before_you_sign',
    localStorageKey: `hhc_before_you_sign_coll_${collectionIdOverride}`,
    defaultValue: DEFAULT_PAYLOAD,
  })
  const toolResult = useToolState<BYSPayload>({
    toolKey: 'before_you_sign',
    localStorageKey: 'hhc_before_you_sign_v1',
    defaultValue: DEFAULT_PAYLOAD,
  })
  const useCollection = !!collectionIdOverride
  const { state: rawState, isLoaded } = useCollection ? collResult : toolResult
  const collectionTitle = useCollection ? collResult.title : ''

  const includeNotes = searchParams.get('includeNotes') === 'true'
  const includeComments = searchParams.get('includeComments') === 'true'

  const [settings, setSettings] = useState<ReportSettings>({
    companyName: 'HawaiiHomeCentral.com',
    reportTitle: 'Contract Checklist Report',
    footerText: 'Created at HawaiiHomeCentral.com',
  })

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/tools/punchlist/report-settings')
        if (res.ok) {
          const data = await res.json()
          setSettings((prev) => ({ ...prev, ...data, reportTitle: 'Contract Checklist Report' }))
        }
      } catch {
        // use defaults
      }
    }
    load()
  }, [])

  const payload = useMemo(() => {
    if (!rawState || typeof rawState !== 'object' || !('version' in rawState)) return DEFAULT_PAYLOAD
    const p = rawState as BYSPayload
    return {
      ...DEFAULT_PAYLOAD,
      ...p,
      answers: {
        quotes: p.answers?.quotes ?? {},
        handoffs: p.answers?.handoffs ?? {},
        agree: p.answers?.agree ?? {},
      },
    }
  }, [rawState])

  const contractors = payload.contractors
  const selectedContractors = useMemo(
    () => contractors.filter((c) => payload.selectedContractorIds.includes(c.id)),
    [contractors, payload.selectedContractorIds]
  )
  const answers = payload.answers
  const customAgreeItems = payload.customAgreeItems

  // Auto-trigger print when loaded
  useEffect(() => {
    if (isLoaded && contractors.length > 0) {
      const timeout = setTimeout(() => window.print(), 600)
      return () => clearTimeout(timeout)
    }
  }, [isLoaded, contractors.length])

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (contractors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-white">
        <p className="text-gray-600 font-medium">No contractors to display</p>
        <p className="text-gray-400 text-sm">Add contractors to your Contract Checklist first.</p>
      </div>
    )
  }

  const reportTitle = collectionTitle || settings.reportTitle

  return (
    <>
      {/* Print-friendly global styles */}
      <style>{`
        @media print {
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 0.5in; size: landscape; }
          .no-print { display: none !important; }
          .page-break { break-before: page; }
        }
      `}</style>

      <div className="min-h-screen bg-white text-gray-900 p-8 max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-8 border-b border-gray-200 pb-6">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{settings.companyName}</p>
          <h1 className="text-2xl font-bold text-gray-900">{reportTitle}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Generated {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            {' \u00b7 '}{selectedContractors.length} contractor{selectedContractors.length !== 1 ? 's' : ''} compared
          </p>
        </div>

        {/* Contractor Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {selectedContractors.map((c) => (
            <div key={c.id} className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-sm text-gray-900 mb-2">{c.name}</h3>
              {c.totalValue && (
                <p className="text-sm text-gray-600">
                  Total: <span className="font-medium">{formatCurrency(c.totalValue)}</span>
                </p>
              )}
              {c.contractType && (
                <p className="text-xs text-gray-400 mt-1">
                  {c.contractType === 'fixed' ? 'Fixed Price' :
                   c.contractType === 'time_materials' ? 'Time & Materials' :
                   c.contractType === 'cost_plus' ? 'Cost Plus' :
                   c.contractType === 'not_sure' ? 'Not Sure' : c.contractType}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Tabs/Sections */}
        {ALL_TABS.map((tab, tabIdx) => (
          <div key={tab.key} className={tabIdx > 0 ? 'page-break' : ''}>
            <h2 className="text-lg font-bold text-gray-800 mb-4 mt-8 border-b border-gray-200 pb-2">
              {TAB_LABELS[tab.key as TabKey]}
            </h2>

            {tab.sections.map((section) => (
              <SectionTable
                key={section.id}
                section={section}
                tabKey={tab.key as TabKey}
                contractors={selectedContractors}
                answers={answers}
                includeNotes={includeNotes}
                customAgreeItems={tab.key === 'agree' ? customAgreeItems : undefined}
              />
            ))}
          </div>
        ))}

        {/* Contractor Notes */}
        {includeNotes && selectedContractors.some((c) => c.notes) && (
          <div className="page-break mt-8">
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">
              Private Notes
            </h2>
            {selectedContractors.filter((c) => c.notes).map((c) => (
              <div key={c.id} className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-1">{c.name}</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{c.notes}</p>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400">{settings.footerText}</p>
        </div>
      </div>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/* Section Table                                                               */
/* -------------------------------------------------------------------------- */

function SectionTable({
  section,
  tabKey,
  contractors,
  answers,
  includeNotes,
  customAgreeItems,
}: {
  section: BYSConfigSection
  tabKey: TabKey
  contractors: BYSContractor[]
  answers: BYSAnswers
  includeNotes: boolean
  customAgreeItems?: BYSCustomAgreeItem[]
}) {
  const items: { id: string; label: string }[] = section.items.map((item) => ({
    id: item.id,
    label: item.shortLabel,
  }))

  // Append custom agree items for this section (they live at the end)
  if (customAgreeItems && section.id === 'custom') {
    customAgreeItems.forEach((ci) => {
      items.push({ id: ci.id, label: ci.question })
    })
  }

  if (items.length === 0) return null

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-600 mb-2">{section.title}</h3>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-1.5 pr-4 text-gray-500 font-medium w-[40%]">Item</th>
            {contractors.map((c) => (
              <th key={c.id} className="text-center py-1.5 px-2 text-gray-500 font-medium">
                {c.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const hasAnyNotes = includeNotes && contractors.some((c) => {
              const a = answers[tabKey]?.[c.id]?.[item.id]
              return a?.notes
            })

            return (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-1.5 pr-4 text-gray-700">{item.label}</td>
                {contractors.map((c) => {
                  const a: BYSAnswer = answers[tabKey]?.[c.id]?.[item.id] ?? { status: 'unknown', notes: '' }
                  return (
                    <td key={c.id} className="text-center py-1.5 px-2">
                      <span className={`font-bold ${statusColor(a.status)}`}>
                        {statusIcon(a.status)}
                      </span>
                      {includeNotes && a.notes && (
                        <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{a.notes}</p>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
