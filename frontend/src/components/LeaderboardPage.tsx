import { LeaderboardPanel } from '@/components/LeaderboardPanel'
import { MyRankBanner } from '@/components/MyRankBanner'
import { useAuthStore } from '@/stores/authStore'
import { useLeaderboardStore } from '@/stores/leaderboardStore'
import { useEffect } from 'react'

export function LeaderboardPage() {
  const load = useLeaderboardStore((s) => s.load)
  const entries = useLeaderboardStore((s) => s.entries).slice(0, 10)
  const user = useAuthStore((s) => s.user)
  const mine = useLeaderboardStore((s) => s.myEntry(user?.id))
  const updatedAt = useLeaderboardStore((s) => s.updatedAt)

  useEffect(() => {
    void load()
    const id = window.setInterval(() => {
      void load()
    }, 10_000)
    return () => window.clearInterval(id)
  }, [load])

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-3xl font-extrabold tracking-wide">
        Leaderboard
      </h1>
      <p className="mb-4 mt-2 text-sm text-slate-400">
        Named scores only. Guest runs stay private until you claim a rank.
        {updatedAt
          ? ` Updated ${new Date(updatedAt).toLocaleTimeString()}.`
          : ''}
      </p>
      <div className="mb-4">
        <MyRankBanner entry={mine} />
      </div>
      <LeaderboardPanel entries={entries} highlightUserId={user?.id} />
    </div>
  )
}
