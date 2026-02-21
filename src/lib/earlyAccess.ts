/**
 * Early-access / whitelist helpers (edge-safe — no Prisma import).
 * Single source of truth for env-based allowlist checks.
 */

function parseList(envValue: string | undefined): Set<string> {
  if (!envValue) return new Set()
  return new Set(
    envValue
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  )
}

const adminEmails = () => parseList(process.env.ADMIN_ALLOWLIST)
const allowlistEmails = () => parseList(process.env.EARLY_ACCESS_ALLOWLIST)

export function isAdminEmail(email: string): boolean {
  return adminEmails().has(email.toLowerCase().trim())
}

/** Check env-var allowlist only (fast, no DB). Used by edge-safe auth.config.ts. */
export function isEmailAllowlisted(email: string): boolean {
  const normalized = email.toLowerCase().trim()
  return adminEmails().has(normalized) || allowlistEmails().has(normalized)
}

export function requiresWhitelist(): boolean {
  return process.env.REQUIRE_WHITELIST === 'true'
}

export function isMaintenanceMode(): boolean {
  return process.env.MAINTENANCE_MODE === 'true'
}
