import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { LEGAL_DEFAULTS } from '@/lib/legalDefaults'
import { MarkdownRenderer } from '@/components/content/MarkdownRenderer'

export const metadata: Metadata = {
  title: 'Disclaimer',
  description:
    'Disclaimer for Hawaii Home Central — important information about the content and tools on our site.',
}

async function getLegalContent() {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: ['legal_disclaimer_md'] } },
  })
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  return {
    content: map.legal_disclaimer_md || LEGAL_DEFAULTS.disclaimerMd,
  }
}

export default async function DisclaimerPage() {
  const { content } = await getLegalContent()

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-serif text-4xl md:text-5xl text-sandstone mb-4">
          Disclaimer
        </h1>
        <MarkdownRenderer content={content} />
      </div>
    </div>
  )
}
