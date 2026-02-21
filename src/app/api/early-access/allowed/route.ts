import { NextResponse } from 'next/server'
import { isEmailAllowlistedWithDB } from '@/lib/earlyAccessDB'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const email = (searchParams.get('email') ?? '').trim().toLowerCase()

  if (!email) {
    return NextResponse.json({ allowed: false }, { status: 400 })
  }

  return NextResponse.json({ allowed: await isEmailAllowlistedWithDB(email) })
}
