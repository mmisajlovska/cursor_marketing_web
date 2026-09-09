import { rankClass } from '@/lib/rank'
import type { LeaderboardEntry } from '@/types'

type Props = {
  entries: LeaderboardEntry[]
  highlightUserId?: string
  compact?: boolean
}

export function LeaderboardPanel({ entries, highlightUserId, compact }: Props) {
  if (entries.length === 0) {
    return (
      <p className="glass p-6 text-slate-400">
        No named scores yet. Be first to claim a rank.
      </p>
    )
  }

  return (
    <ol className="glass divide-y divide-white/10 overflow-hidden">
      {entries.map((row) => (
        <li
          key={row.userId}
          className={`flex items-center gap-3 px-4 py-3 transition ${
            row.userId === highlightUserId ? 'bg-primary/20' : ''
          }`}
        >
          <span
            className={`grid h-8 w-8 place-items-center rounded-full font-display text-xs font-bold ${rankClass(row.rank)}`}
          >
            {row.rank}
          </span>
          <span
            className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-xs"
            aria-hidden
          >
            {row.displayName.slice(0, 1)}
          </span>
          <span className="flex-1 truncate font-medium">{row.displayName}</span>
          <span className="font-mono tabular-nums font-semibold">
            {row.score}
          </span>
          {!compact ? (
            <span className="hidden text-xs text-slate-500 sm:inline">
              {new Date(row.lastPlayedAt).toLocaleDateString()}
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  )
}
