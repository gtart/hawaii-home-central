import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rateLimit'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getClientIP(headersList: Headers): string | null {
  const forwarded = headersList.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return headersList.get('x-real-ip')
}

async function geolocateIP(ip: string): Promise<{ city?: string; region?: string; country?: string }> {
  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,city,regionName,country`,
      { signal: AbortSignal.timeout(3000) }
    )
    if (!res.ok) return {}
    const data = await res.json()
    if (data.status !== 'success') return {}
    return {
      city: data.city || undefined,
      region: data.regionName || undefined,
      country: data.country || undefined,
    }
  } catch {
    return {}
  }
}

export async function POST(req: Request) {
  try {
    // Rate limit: 5 signups per hour per IP
    const { allowed } = await checkRateLimit({
      key: 'early-access',
      windowMs: 3600000,
      maxRequests: 5,
    })
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many submissions. Try again later.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { source = 'FORM', name, userId } = body
    const email = (body.email ?? '').trim().toLowerCase()

    if (!email || !EMAIL_RE.test(email) || email.length > 320) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
    }

    if (name && (typeof name !== 'string' || name.length > 200)) {
      return NextResponse.json({ error: 'Name too long.' }, { status: 400 })
    }

    if (source !== 'FORM' && source !== 'GOOGLE') {
      return NextResponse.json({ error: 'Invalid source.' }, { status: 400 })
    }

    // Capture IP + geolocation
    const headersList = await headers()
    const ipAddress = getClientIP(headersList)
    const geo = ipAddress ? await geolocateIP(ipAddress) : {}

    const existing = await prisma.earlyAccessSignup.findUnique({
      where: { email },
    })

    if (existing) {
      // Upgrade to GOOGLE if re-signing up via Google
      if (source === 'GOOGLE') {
        await prisma.earlyAccessSignup.update({
          where: { email },
          data: {
            source: 'GOOGLE',
            name: name ?? existing.name,
            userId: userId ?? existing.userId,
            // Update IP/geo if not already set
            ...(!existing.ipAddress && ipAddress ? { ipAddress } : {}),
            ...(!existing.city && geo.city ? { city: geo.city } : {}),
            ...(!existing.region && geo.region ? { region: geo.region } : {}),
            ...(!existing.country && geo.country ? { country: geo.country } : {}),
          },
        })
      }
      return NextResponse.json({ ok: true, isNew: false }, { status: 200 })
    }

    await prisma.earlyAccessSignup.create({
      data: {
        email,
        source,
        name: name ?? null,
        userId: userId ?? null,
        ipAddress: ipAddress ?? null,
        city: geo.city ?? null,
        region: geo.region ?? null,
        country: geo.country ?? null,
      },
    })

    return NextResponse.json({ ok: true, isNew: true }, { status: 201 })
  } catch (err) {
    console.error('Early access signup error:', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
