import { prisma } from '@/lib/prisma'
import type { Session } from 'next-auth'
import type { AdminRole } from '@prisma/client'

interface AdminCheck {
  allowed: boolean
  role: AdminRole | null
}

export async function isAdmin(session: Session | null): Promise<AdminCheck> {
  const email = session?.user?.email
  if (!email) return { allowed: false, role: null }

  // Check env allowlist first
  const envList = process.env.ADMIN_ALLOWLIST ?? ''
  const envEmails = envList
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  if (envEmails.includes(email.toLowerCase())) {
    return { allowed: true, role: 'ADMIN' }
  }

  // Check DB allowlist
  const row = await prisma.adminAllowlist.findUnique({
    where: { email: email.toLowerCase() },
    select: { role: true },
  })

  if (row) {
    return { allowed: true, role: row.role }
  }

  return { allowed: false, role: null }
}
