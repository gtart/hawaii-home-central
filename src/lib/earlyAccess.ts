/**
 * Early-access / whitelist helpers.
 * Single source of truth for auth callback + UI allowlist checks.
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
