import Google from 'next-auth/providers/google'
import type { NextAuthConfig } from 'next-auth'
import { isAdminEmail, isEmailAllowlisted } from '@/lib/earlyAccess'

export const authConfig = {
  providers: [Google],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    signIn({ user, profile }) {
      const email = (user?.email || profile?.email || '').toLowerCase().trim()
      if (!email) return false

      // Maintenance mode: only admins can sign in
      if (process.env.MAINTENANCE_MODE === 'true') {
        return isAdminEmail(email)
      }

      // Whitelist mode: only allowlisted emails can sign in
      if (process.env.REQUIRE_WHITELIST === 'true') {
        return isEmailAllowlisted(email)
      }

      // Fully public: anyone can sign in
      return true
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
} satisfies NextAuthConfig
