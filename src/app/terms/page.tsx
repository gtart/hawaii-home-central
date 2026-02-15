import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { LEGAL_DEFAULTS } from '@/lib/legalDefaults'
import { MarkdownRenderer } from '@/components/content/MarkdownRenderer'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Terms of Service for Hawaii Home Central — rules and guidelines for using our site.',
}

async function getLegalContent() {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: ['legal_effective_date', 'legal_terms_md'] } },
  })
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  return {
    effectiveDate: map.legal_effective_date || LEGAL_DEFAULTS.effectiveDate,
    content: map.legal_terms_md || LEGAL_DEFAULTS.termsMd,
  }
}

export default async function TermsPage() {
  const { effectiveDate, content } = await getLegalContent()

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-serif text-4xl md:text-5xl text-sandstone mb-4">
          Terms of Service
        </h1>
        <p className="text-cream/50 text-sm mb-10">
          Effective date: {effectiveDate}
        </p>
        <MarkdownRenderer content={content} />
      </div>
    </div>
  )
}
