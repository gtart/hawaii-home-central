/**
 * DB-backed early access allowlist check.
 * NOT edge-safe — imports Prisma. Use only in Node.js contexts (auth.ts, API routes).
 */

import { prisma } from '@/lib/prisma'
import { isEmailAllowlisted } from '@/lib/earlyAccess'

/** Check env vars + DB allowlist. */
export async function isEmailAllowlistedWithDB(email: string): Promise<boolean> {
  const normalized = email.toLowerCase().trim()
  // Fast env check first
  if (isEmailAllowlisted(normalized)) return true
  // Then DB check
  const row = await prisma.earlyAccessAllowlist.findUnique({
    where: { email: normalized },
    select: { id: true },
  })
  return !!row
}
