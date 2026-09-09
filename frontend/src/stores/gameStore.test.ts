import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from '@/stores/gameStore'

describe('gameStore guest loop', () => {
  beforeEach(() => {
    sessionStorage.clear()
    useGameStore.getState().reset()
    useGameStore.getState().initFromTenant(3)
  })

  it('decrements guest plays on endRun', () => {
    useGameStore.getState().startRun()
    useGameStore.getState().endRun(120, { isGuest: true })
    expect(useGameStore.getState().guestPlaysRemaining).toBe(2)
    expect(useGameStore.getState().pendingScore).toBe(120)
    expect(useGameStore.getState().phase).toBe('gameover')
  })

  it('does not decrement guest plays for authenticated runs', () => {
    useGameStore.getState().startRun()
    useGameStore.getState().endRun(50, { isGuest: false })
    expect(useGameStore.getState().guestPlaysRemaining).toBe(3)
  })
})
