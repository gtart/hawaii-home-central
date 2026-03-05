import { NextResponse } from 'next/server'
import { resolveShareToken, buildSanitizedShareResponse } from '@/lib/public-share'

type Params = { params: Promise<{ token: string }> }

/**
 * GET /api/share/c/[token]
 * Public share resolution — no auth required.
 * Validates collection share token and returns sanitized payload
 * using the same allowlist logic as /api/share/[toolKey]/[token].
 */
export async function GET(_request: Request, { params }: Params) {
  const { token } = await params

  // Resolve without expectedToolKey — collection tokens carry their own toolKey
  const resolution = await resolveShareToken(token)

  if ('error' in resolution) {
    return NextResponse.json({ error: resolution.error }, { status: resolution.status })
  }

  const result = await buildSanitizedShareResponse(resolution)

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json(result.body)
}
