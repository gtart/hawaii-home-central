import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import crypto from 'crypto'

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

  const content = await prisma.content.findFirst({
    where: { slug, status: 'PUBLISHED' },
    select: { id: true },
  })

  if (!content) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Rate limit: 5 per hour per ipHash+contentId
  const hdrs = await headers()
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const dailySalt = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const ipHash = crypto
    .createHash('sha256')
    .update(`${ip}:${dailySalt}`)
    .digest('hex')

  const oneHourAgo = new Date(Date.now() - 3600000)
  const recentCount = await prisma.contentPrivateFeedback.count({
    where: {
      contentId: content.id,
      ipHash,
      createdAt: { gte: oneHourAgo },
    },
  })

  if (recentCount >= 5) {
    return NextResponse.json(
      { error: 'Too many submissions. Try again later.' },
      { status: 429 }
    )
  }

  const session = await auth()
  const userId = session?.user?.id ?? null
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
