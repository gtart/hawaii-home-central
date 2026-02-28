/**
 * Auth setup -- creates valid NextAuth v5 JWT session cookies
 * for all test personas and saves them as Playwright storageState files.
 *
 * Produces:
 *   e2e/.auth/persona-new-user.json
 *   e2e/.auth/persona-fixlist.json
 *   e2e/.auth/persona-two-projects.json
 *   e2e/.auth/persona-full-setup.json
 *   e2e/.auth/user.json              (copy of full-setup, backward compat)
 */
import { test as setup } from '@playwright/test'
import { encode } from '@auth/core/jwt'
import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'
import { PERSONAS, DEFAULT_PERSONA } from './personas'

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

setup('create authenticated sessions for all personas', async () => {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET not found in .env -- cannot create test sessions')

  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'
  // NextAuth determines cookie names from AUTH_URL, not the request URL.
  // When AUTH_URL is HTTPS (e.g. production domain), NextAuth uses __Secure-
  // prefixed cookies even if the browser connects over HTTP localhost.
  const authURL = process.env.AUTH_URL || baseURL
  const useSecureCookies = authURL.startsWith('https')
  const cookieName = useSecureCookies
    ? '__Secure-authjs.session-token'
    : 'authjs.session-token'
  const domain = new URL(baseURL).hostname

  // Ensure .auth directory exists
  const authDir = path.join(__dirname, '.auth')
  fs.mkdirSync(authDir, { recursive: true })

  for (const persona of PERSONAS) {
    const token = await encode({
      token: {
        name: persona.name,
        email: persona.email,
        picture: '',
        sub: persona.userId,
        id: persona.userId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      },
      secret,
      salt: cookieName,
    })

    const storageState = {
      cookies: [
        {
          name: cookieName,
          value: token,
          domain,
          path: '/',
          httpOnly: true,
          secure: useSecureCookies,
          sameSite: 'Lax' as const,
          expires: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        },
      ],
      origins: [],
    }

    fs.writeFileSync(
      persona.storageStatePath,
      JSON.stringify(storageState, null, 2)
    )
    console.log(`  Auth: ${persona.name} -> ${path.basename(persona.storageStatePath)}`)
  }

  // Backward compat: copy full-setup as user.json
  const legacyPath = path.join(authDir, 'user.json')
  fs.copyFileSync(DEFAULT_PERSONA.storageStatePath, legacyPath)
  console.log('  Auth: backward compat -> user.json')

  // Verify the default persona session works via API fetch (avoids slow browser render)
  const storageData = JSON.parse(fs.readFileSync(DEFAULT_PERSONA.storageStatePath, 'utf-8'))
  const sessionCookie = storageData.cookies[0]
  const res = await fetch(`${baseURL}/api/auth/session`, {
    headers: { Cookie: `${sessionCookie.name}=${sessionCookie.value}` },
  })
  if (!res.ok) {
    throw new Error(
      `Auth setup failed -- /api/auth/session returned ${res.status}. Check AUTH_SECRET matches your running dev server.`
    )
  }
  const session = await res.json()
  if (!session?.user?.email) {
    throw new Error(
      'Auth setup failed -- session has no user. Check AUTH_SECRET matches your running dev server.'
    )
  }

  console.log(`  Auth verification passed for ${DEFAULT_PERSONA.name} (${session.user.email})`)
})
