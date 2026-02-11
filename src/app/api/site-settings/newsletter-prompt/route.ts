import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const DEFAULTS: Record<string, string> = {
  newsletter_prompt_title: 'Stay in the loop',
  newsletter_prompt_body:
    'Get occasional updates about new guides and tools for Hawaiʻi homeowners.',
  newsletter_prompt_opt_in_label: 'Yes, sign me up',
  newsletter_prompt_skip_label: 'Skip for now',
}

const KEYS = Object.keys(DEFAULTS)

export async function GET() {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: KEYS } },
  })

  const result: Record<string, string> = { ...DEFAULTS }
  for (const row of rows) {
    if (row.value) result[row.key] = row.value
  }

  return NextResponse.json(result)
}
