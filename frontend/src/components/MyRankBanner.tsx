import { rankClass } from '@/lib/rank'
import type { LeaderboardEntry } from '@/types'

export function MyRankBanner({ entry }: { entry: LeaderboardEntry | null }) {
  if (!entry) {
    return (
      <p className="glass px-4 py-3 text-sm text-slate-300">
        Sign in and save a score to see your rank.
      </p>
    )
  }
  return (
    <div className="glass flex items-center justify-between px-4 py-3 text-sm">
      <span className="flex items-center gap-2">
        <span
          className={`grid h-7 w-7 place-items-center rounded-full font-display text-xs font-bold ${rankClass(entry.rank)}`}
        >
          {entry.rank}
        </span>
        {entry.displayName}
      </span>
      <span className="font-mono tabular-nums font-semibold">
        {entry.score}
      </span>
    </div>
  )
}
