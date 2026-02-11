import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { source = 'FORM', name, userId } = body
    const email = (body.email ?? '').trim().toLowerCase()

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
    }

    if (source !== 'FORM' && source !== 'GOOGLE') {
      return NextResponse.json({ error: 'Invalid source.' }, { status: 400 })
    }

    const existing = await prisma.earlyAccessSignup.findUnique({
      where: { email },
    })

    if (existing) {
      // Upgrade to GOOGLE if re-signing up via Google
      if (source === 'GOOGLE') {
        await prisma.earlyAccessSignup.update({
          where: { email },
          data: { source: 'GOOGLE', name: name ?? existing.name, userId: userId ?? existing.userId },
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
      },
    })

    return NextResponse.json({ ok: true, isNew: true }, { status: 201 })
  } catch (err) {
    console.error('Early access signup error:', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
