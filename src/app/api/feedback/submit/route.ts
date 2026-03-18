import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rateLimit'

async function geolocateIP(ip: string): Promise<{ city?: string; region?: string; country?: string; lat?: string; lon?: string }> {
  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,city,regionName,country,lat,lon`,
      { signal: AbortSignal.timeout(3000) }
    )
    if (!res.ok) return {}
    const data = await res.json()
    if (data.status !== 'success') return {}
    return {
      city: data.city || undefined,
      region: data.regionName || undefined,
      country: data.country || undefined,
      lat: data.lat != null ? String(data.lat) : undefined,
      lon: data.lon != null ? String(data.lon) : undefined,
    }
  } catch {
    return {}
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const message = typeof body.message === 'string' ? body.message.trim() : ''
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }
    if (message.length > 5000) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 })
    }

    // Rate limit: 10 submissions per hour per IP
    const { allowed } = await checkRateLimit({
      key: 'feedback_submit',
      maxRequests: 10,
      windowMs: 60 * 60 * 1000,
    })
    if (!allowed) {
      return NextResponse.json({ error: 'Too many submissions. Try again later.' }, { status: 429 })
    }

    // Extract headers
    const hdrs = req.headers
    const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() || null
    const userAgent = hdrs.get('user-agent') || null
    const language = hdrs.get('accept-language')?.split(',')[0]?.trim() || null
    const referrer = hdrs.get('referer') || null

    // Vercel geo headers (fast, no API call)
    let city = hdrs.get('x-vercel-ip-city') || null
    let region = hdrs.get('x-vercel-ip-country-region') || null
    let country = hdrs.get('x-vercel-ip-country') || null
    let latitude: string | null = hdrs.get('x-vercel-ip-latitude') || null
    let longitude: string | null = hdrs.get('x-vercel-ip-longitude') || null

    if (city) city = decodeURIComponent(city)

    // Fallback to ip-api if Vercel headers missing
    if (!city && ip) {
      const geo = await geolocateIP(ip)
      city = geo.city || null
      region = geo.region || null
      country = geo.country || null
      latitude = geo.lat || null
      longitude = geo.lon || null
    }

    // Client-sent context
    const email = typeof body.email === 'string' && body.email.trim() ? body.email.trim() : null
    const screenSize = typeof body.screenSize === 'string' ? body.screenSize : null
    const timezone = typeof body.timezone === 'string' ? body.timezone : null
    const platform = typeof body.platform === 'string' ? body.platform : null
    const pageUrl = typeof body.pageUrl === 'string' ? body.pageUrl : null
    const submittedAt = typeof body.submittedAt === 'string' ? new Date(body.submittedAt) : new Date()

    await prisma.feedbackSubmission.create({
      data: {
        message,
        email,
        ipAddress: ip,
        userAgent,
        language,
        referrer,
        pageUrl,
        screenSize,
        timezone,
        platform,
        city,
        region,
        country,
        latitude,
        longitude,
        submittedAt,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Feedback submission error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
