import { beforeEach, describe, expect, it } from 'vitest'
import { useLeaderboardStore } from '@/stores/leaderboardStore'

describe('leaderboardStore', () => {
  beforeEach(() => {
    sessionStorage.clear()
    useLeaderboardStore.getState().reset()
  })

  it('upserts a named score and assigns rank', () => {
    const row = useLeaderboardStore.getState().upsertScore({
      userId: 'me',
      displayName: 'Marko',
      avatarUrl: null,
      score: 20000,
    })
    expect(row?.rank).toBe(1)
    expect(row?.displayName).toBe('Marko')
    expect(useLeaderboardStore.getState().myEntry('me')?.score).toBe(20000)
  })
})
