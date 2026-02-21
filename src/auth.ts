import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { authConfig } from './auth.config'
import { isAdminEmail } from '@/lib/earlyAccess'
import { isEmailAllowlistedWithDB } from '@/lib/earlyAccessDB'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, profile }) {
      const email = (user?.email || profile?.email || '').toLowerCase().trim()
      if (!email) return false

      // Maintenance mode: only admins can sign in (env-only, fast)
      if (process.env.MAINTENANCE_MODE === 'true') {
        return isAdminEmail(email)
      }

      // Whitelist mode: check env + DB allowlist
      if (process.env.REQUIRE_WHITELIST === 'true') {
        return isEmailAllowlistedWithDB(email)
      }

      // Fully public
      return true
    },
  },
})
