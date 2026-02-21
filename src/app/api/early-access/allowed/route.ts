import { NextResponse } from 'next/server'
import { isEmailAllowlisted } from '@/lib/earlyAccess'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const email = (searchParams.get('email') ?? '').trim().toLowerCase()

  if (!email) {
    return NextResponse.json({ allowed: false }, { status: 400 })
  }

  return NextResponse.json({ allowed: isEmailAllowlisted(email) })
}
