import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { checkRateLimit } from '@/lib/rateLimit'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const body = await request.json()
  const { message, name, email, anonId, voteContext } = body

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return NextResponse.json({ error: 'Message required' }, { status: 400 })
  }

  if (message.length > 5000) {
    return NextResponse.json({ error: 'Message too long' }, { status: 400 })
  }

  if (name && (typeof name !== 'string' || name.length > 200)) {
    return NextResponse.json({ error: 'Name too long' }, { status: 400 })
  }

  if (email && (typeof email !== 'string' || email.length > 320)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const content = await prisma.content.findFirst({
    where: { slug, status: 'PUBLISHED' },
    select: { id: true },
  })

  if (!content) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Rate limit: 5 per hour per IP per content slug
  const { allowed, ipHash } = await checkRateLimit({
    key: `private-feedback:${slug}`,
    windowMs: 3600000,
    maxRequests: 5,
  })

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many submissions. Try again later.' },
      { status: 429 }
    )
  }

  const session = await auth()
  const userId = session?.user?.id ?? null
  const hdrs = await headers()
  const userAgent = hdrs.get('user-agent') || null
  const pageUrl = hdrs.get('referer') || null
  const country = hdrs.get('x-vercel-ip-country') || null
  const region = hdrs.get('x-vercel-ip-country-region') || null
  const city = hdrs.get('x-vercel-ip-city') || null

  await prisma.contentPrivateFeedback.create({
    data: {
      contentId: content.id,
      voteContext: voteContext || null,
      name: name || null,
      email: email || null,
      message: message.trim(),
      userId,
      anonId: anonId || null,
      pageUrl,
      referrer: hdrs.get('referer') || null,
      userAgent,
      ipHash,
      country,
      region,
      city,
    },
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
