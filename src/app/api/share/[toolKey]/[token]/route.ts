import { NextResponse } from 'next/server'
import { resolveShareToken, buildSanitizedShareResponse } from '@/lib/public-share'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ toolKey: string; token: string }> }
) {
  const { toolKey, token } = await params

  const resolution = await resolveShareToken(token, toolKey)

  if ('error' in resolution) {
    return NextResponse.json({ error: resolution.error }, { status: resolution.status })
  }

  const result = await buildSanitizedShareResponse(resolution)

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json(result.body)
}
