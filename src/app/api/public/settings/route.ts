import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Public (no-auth) endpoint that returns a strict allowlist of SiteSetting values.
 * Used by the Footer (client component) to pull editable contact/tagline.
 *
 * GET /api/public/settings?keys=site_contact_email,site_footer_tagline
 */

const ALLOWED_KEYS = new Set([
  'site_contact_email',
  'site_footer_tagline',
])

export async function GET(request: NextRequest) {
  const keysParam = request.nextUrl.searchParams.get('keys')
  if (!keysParam) {
    return NextResponse.json({})
  }

  const requested = keysParam
    .split(',')
    .map((k) => k.trim())
    .filter((k) => ALLOWED_KEYS.has(k))

  if (requested.length === 0) {
    return NextResponse.json({})
  }

  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: requested } },
  })

  const map: Record<string, string> = {}
  for (const r of rows) {
    map[r.key] = r.value
  }

  return NextResponse.json(map)
}
