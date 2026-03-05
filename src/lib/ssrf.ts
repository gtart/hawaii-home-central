import dns from 'node:dns/promises'

// ---------------------------------------------------------------------------
// SSRF protection helpers
// ---------------------------------------------------------------------------

export function parseIPv4(ip: string): [number, number, number, number] | null {
  const parts = ip.split('.')
  if (parts.length !== 4) return null
  const octets = parts.map(Number)
  if (octets.some((o) => isNaN(o) || o < 0 || o > 255)) return null
  return octets as [number, number, number, number]
}

function isBlockedIPv4(
  [a, b, , ]: [number, number, number, number],
  allowLocalhost: boolean
): boolean {
  // Always block: link-local / cloud metadata (169.254.0.0/16)
  if (a === 169 && b === 254) return true
  // Always block: 0.0.0.0
  if (a === 0) return true
  // Localhost 127.0.0.0/8
  if (a === 127) return !allowLocalhost
  // Private ranges — always blocked
  if (a === 10) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  return false
}

export function isBlockedIp(ip: string, allowLocalhost: boolean): boolean {
  if (ip === '::') return true
  if (ip === '::1') return !allowLocalhost
  // IPv4-mapped IPv6 (::ffff:x.x.x.x)
  if (ip.startsWith('::ffff:')) {
    const octets = parseIPv4(ip.slice(7))
    if (octets) return isBlockedIPv4(octets, allowLocalhost)
    return true
  }
  // fe80::/10 link-local IPv6
  if (ip.toLowerCase().startsWith('fe80')) return true
  // fc00::/7 unique-local IPv6
  const first = ip.toLowerCase().split(':')[0]
  if (first && (first.startsWith('fc') || first.startsWith('fd'))) return true
  // ff00::/8 multicast IPv6
  if (first && first.startsWith('ff')) return true

  const octets = parseIPv4(ip)
  if (octets) return isBlockedIPv4(octets, allowLocalhost)

  // Standard global unicast IPv6 that passed all blocked checks above — allow
  if (ip.includes(':')) return false

  return true // truly unknown format → block
}

export async function checkSsrf(hostname: string, allowLocalhost: boolean): Promise<string | null> {
  // Raw IPv4 literal
  if (parseIPv4(hostname)) {
    return isBlockedIp(hostname, allowLocalhost) ? 'Blocked by SSRF protection' : null
  }

  // Raw IPv6 literal (brackets stripped by URL parser)
  const bare = hostname.replace(/^\[|\]$/g, '')
  if (bare.includes(':')) {
    return isBlockedIp(bare, allowLocalhost) ? 'Blocked by SSRF protection' : null
  }

  // Hostname → resolve DNS and check every IP
  const ips: string[] = []
  try { ips.push(...await dns.resolve4(hostname)) } catch { /* no A record */ }
  try { ips.push(...await dns.resolve6(hostname)) } catch { /* no AAAA record */ }

  if (ips.length === 0) return 'DNS resolution failed'

  for (const ip of ips) {
    if (isBlockedIp(ip, allowLocalhost)) return 'Blocked by SSRF protection'
  }
  return null
}
