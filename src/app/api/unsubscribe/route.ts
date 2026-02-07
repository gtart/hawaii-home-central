import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return htmlResponse(
      'Invalid Link',
      'This unsubscribe link is missing or invalid.',
      400
    )
  }

  const user = await prisma.user.findUnique({
    where: { newsletterUnsubToken: token },
    select: { id: true },
  })

  if (!user) {
    return htmlResponse(
      'Invalid Link',
      'This unsubscribe link is invalid or has expired.',
      404
    )
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      newsletterOptIn: false,
      newsletterUnsubscribedAt: new Date(),
    },
  })

  return htmlResponse(
    'Unsubscribed',
    'You have been unsubscribed from Hawaii Home Central updates.',
    200
  )
}

function htmlResponse(title: string, message: string, status: number) {
  const accentColor = title === 'Unsubscribed' ? '#c9a87c' : '#f5f0e8'

  return new NextResponse(
    `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | Hawaii Home Central</title></head>
<body style="background:#1a1a1a;color:#f5f0e8;font-family:system-ui,-apple-system,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0">
<div style="text-align:center;max-width:400px;padding:2rem">
<h1 style="color:${accentColor};font-size:1.5rem;margin-bottom:1rem">${title}</h1>
<p style="color:#f5f0e8cc;line-height:1.6">${message}</p>
<a href="/" style="color:#c9a87c;display:inline-block;margin-top:1.5rem">Return to site</a>
</div>
</body>
</html>`,
    {
      status,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }
  )
}
