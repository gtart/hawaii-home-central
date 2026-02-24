import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const MAX_SUMMARY = 1000
const MAX_OPTIONAL = 500

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, summary, challenge, proudestMoment } = body

    if (!summary || typeof summary !== 'string' || !summary.trim()) {
      return NextResponse.json(
        { error: 'Please tell us about your story.' },
        { status: 400 }
      )
    }

    if (email && typeof email === 'string' && email.trim()) {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRe.test(email.trim())) {
        return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
      }
    }

    // Extract geolocation from Vercel headers
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
    const city = req.headers.get('x-vercel-ip-city') || null
    const region = req.headers.get('x-vercel-ip-country-region') || null
    const country = req.headers.get('x-vercel-ip-country') || null

    await prisma.storySubmission.create({
      data: {
        email: email?.trim() || null,
        summary: summary.trim().slice(0, MAX_SUMMARY),
        challenge: challenge?.trim().slice(0, MAX_OPTIONAL) || null,
        proudestMoment: proudestMoment?.trim().slice(0, MAX_OPTIONAL) || null,
        ipAddress: ip,
        city: city ? decodeURIComponent(city) : null,
        region,
        country,
      },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
