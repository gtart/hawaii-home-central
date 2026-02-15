import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import crypto from 'crypto'

interface RateLimitOptions {
  key: string
  windowMs: number
  maxRequests: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  ipHash: string
}

/**
 * Generic rate-limit check backed by the RateLimit table.
 * Uses the same IP-hashing pattern as private-feedback (SHA256 with daily salt).
 * Returns the ipHash so callers can reuse it for audit fields.
 */
export async function checkRateLimit(
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const { key, windowMs, maxRequests } = options

  const hdrs = await headers()
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const dailySalt = new Date().toISOString().slice(0, 10)
  const ipHash = crypto
    .createHash('sha256')
    .update(`${ip}:${dailySalt}`)
    .digest('hex')

  const windowStart = new Date(Date.now() - windowMs)

  const recentCount = await prisma.rateLimit.count({
    where: {
      key,
      ipHash,
      createdAt: { gte: windowStart },
    },
  })

  if (recentCount >= maxRequests) {
    return { allowed: false, remaining: 0, ipHash }
  }

  await prisma.rateLimit.create({
    data: { key, ipHash },
  })

  return { allowed: true, remaining: maxRequests - recentCount - 1, ipHash }
}
