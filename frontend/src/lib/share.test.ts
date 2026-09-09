import { describe, expect, it } from 'vitest'
import { shareText, twitterShareUrl } from '@/lib/share'

describe('share copy', () => {
  it('includes score, brand, and url', () => {
    const text = shareText(4820, 'Acme Dash', 'https://acme.example/play')
    expect(text).toContain('4820')
    expect(text).toContain('Acme Dash')
    expect(text).toContain('https://acme.example/play')
  })

  it('builds a tweet intent url', () => {
    expect(twitterShareUrl('hi there')).toContain('intent/tweet')
  })
})
