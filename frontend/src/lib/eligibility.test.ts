import { describe, expect, it } from 'vitest'
import { canStartRun } from '@/lib/eligibility'

describe('canStartRun', () => {
  it('allows guests with remaining plays', () => {
    expect(
      canStartRun({
        isGuest: true,
        guestPlaysRemaining: 1,
        hasConsented: false,
        freePlaysRemaining: null,
      }),
    ).toBe(true)
  })

  it('blocks guests at zero plays', () => {
    expect(
      canStartRun({
        isGuest: true,
        guestPlaysRemaining: 0,
        hasConsented: false,
        freePlaysRemaining: null,
      }),
    ).toBe(false)
  })

  it('allows consented users always', () => {
    expect(
      canStartRun({
        isGuest: false,
        guestPlaysRemaining: 0,
        hasConsented: true,
        freePlaysRemaining: 0,
      }),
    ).toBe(true)
  })

  it('requires remaining plays without consent', () => {
    expect(
      canStartRun({
        isGuest: false,
        guestPlaysRemaining: 0,
        hasConsented: false,
        freePlaysRemaining: 0,
      }),
    ).toBe(false)
  })
})
