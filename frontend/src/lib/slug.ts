export function extractTenantSlug(hostname: string): string {
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'acme'
  }
  const host = hostname.split(':')[0] ?? hostname
  const parts = host.split('.')
  if (parts.length >= 3 && parts[1] === 'promorunner') {
    return parts[0] ?? 'acme'
  }
  return parts[0] ?? 'acme'
}
