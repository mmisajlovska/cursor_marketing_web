import { create } from 'zustand'
import { fetchLeaderboard, persistLeaderboard } from '@/api/client'
import { MOCK_LEADERBOARD } from '@/mocks/leaderboard'
import type { LeaderboardEntry } from '@/types'

function rankEntries(
  rows: Omit<LeaderboardEntry, 'rank'>[],
): LeaderboardEntry[] {
  return [...rows]
    .sort((a, b) => b.score - a.score)
    .map((row, i) => ({ ...row, rank: i + 1 }))
}

type LeaderboardState = {
  entries: LeaderboardEntry[]
  updatedAt: string | null
  load: () => Promise<void>
  upsertScore: (input: {
    userId: string
    displayName: string
    avatarUrl: string | null
    score: number
  }) => LeaderboardEntry | null
  myEntry: (userId: string | undefined) => LeaderboardEntry | null
  reset: () => void
}

export const useLeaderboardStore = create<LeaderboardState>((set, get) => ({
  entries: MOCK_LEADERBOARD,
  updatedAt: null,
  load: async () => {
    const entries = rankEntries(await fetchLeaderboard())
    persistLeaderboard(entries)
    set({ entries, updatedAt: new Date().toISOString() })
  },
  upsertScore: (input) => {
    const existing = get().entries.find((e) => e.userId === input.userId)
    const nextScore = Math.max(existing?.score ?? 0, input.score)
    const without = get().entries.filter((e) => e.userId !== input.userId)
    const merged = rankEntries([
      ...without.map(({ rank: _r, ...rest }) => rest),
      {
        userId: input.userId,
        displayName: input.displayName,
        avatarUrl: input.avatarUrl,
        score: nextScore,
        lastPlayedAt: new Date().toISOString(),
      },
    ])
    persistLeaderboard(merged)
    set({ entries: merged, updatedAt: new Date().toISOString() })
    return merged.find((e) => e.userId === input.userId) ?? null
  },
  myEntry: (userId) => {
    if (!userId) return null
    return get().entries.find((e) => e.userId === userId) ?? null
  },
  reset: () => set({ entries: MOCK_LEADERBOARD, updatedAt: null }),
}))
