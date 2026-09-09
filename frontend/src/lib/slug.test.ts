import { describe, expect, it } from 'vitest'
import { extractTenantSlug } from '@/lib/slug'

describe('extractTenantSlug', () => {
  it('uses acme on localhost', () => {
    expect(extractTenantSlug('localhost')).toBe('acme')
  })

  it('reads subdomain on promorunner.io', () => {
    expect(extractTenantSlug('globex.promorunner.io')).toBe('globex')
  })
})
